'use strict';

// Runs the tc39/test262 Iterator suite (the `test262` git submodule) against
// this package's shim. The shim is browserified into self-contained source and
// prepended to each compiled test via a `--preprocessor`. Two reasons it must be
// browserified source rather than a `require`: test262-harness runs each test in
// its own `vm` realm (so the shim must execute inside the realm, not the
// runner's); and `--prelude` content is concatenated *after* the harness
// includes, but some includes (e.g. wellKnownIntrinsicObjects.js) derive
// intrinsics from the global `Iterator` at load time -- before a prelude would
// install it. The preprocessor prepends the shim to the very top instead, so it
// is installed before anything reads from it.
//
// Run across a Node version matrix: on a version without native helpers the shim
// provides everything (exercising this package's own code); on current LTS the
// ES2025 helpers are native passthrough and only zip/zipKeyed exercise our impl.
//
// `node test262.js [suite]` runs a suite (default `main`). `main` covers the
// tests merged into the pinned submodule; the PR suites cover features whose
// test262 tests are still in open PRs, by fetching the PR's test ref and running
// just its files. A PR suite that *adds* files auto-skips once they exist in the
// pinned submodule (merged + bumped); `main`'s `features` then covers them.

var path = require('path');
var fs = require('fs');
var os = require('os');
var spawnSync = require('child_process').spawnSync;

var browserify = require('browserify');

var root = __dirname;
var autoPath = path.join(root, 'auto.js');
var test262Dir = path.join(root, 'test262');
var harnessBin = require.resolve('test262-harness/bin/run.js');

// Known failures, keyed by path. A new failure fails the run; a listed test
// that starts passing is reported so it can be removed. Each reason is tagged
// `engine:` (an artifact of the native intrinsic differing from this package's
// on a native-capable engine; not a logic bug) or `polyfill:` (a real spec
// divergence tracked here rather than fixed alongside wiring up test262).
var EXPECTED_FAILURES = {
	'test262/test/built-ins/Iterator/zip/result-is-iterator.js': 'engine: zip result inherits this package\'s %IteratorHelperPrototype%, which is not SameValue as the native intrinsic on a native-capable engine',
	'test262/test/built-ins/Iterator/zipKeyed/result-is-iterator.js': 'engine: zipKeyed result inherits this package\'s %IteratorHelperPrototype%, which is not SameValue as the native intrinsic on a native-capable engine',
	'test262/test/built-ins/Iterator/from/return-method-throws-for-invalid-this.js': 'polyfill: WrapForValidIteratorPrototype return/next use SLOT.assert, which makes observable property accesses on an invalid `this` before throwing',
	'test262/test/built-ins/Iterator/prototype/constructor/prop-desc.js': 'polyfill: Iterator.prototype.constructor is shimmed as a data property instead of the spec-mandated get/set accessor',
	'test262/test/built-ins/Iterator/prototype/constructor/weird-setter.js': 'polyfill: Iterator.prototype.constructor is shimmed as a data property, so its setter is undefined',
	'test262/test/built-ins/Iterator/proto-from-ctor-realm.js': 'engine: cross-realm construction (Reflect.construct with a NewTarget from another realm whose .prototype is a non-object) requires the internal GetFunctionRealm to obtain that realm\'s %Iterator.prototype%, which has no userland equivalent'
};

function prototypeTests(methods, names) {
	var paths = [];
	methods.forEach(function (method) {
		names.forEach(function (name) {
			paths.push('test/built-ins/Iterator/prototype/' + method + '/' + name + '.js');
		});
	});
	return paths;
}

// `main` runs the merged Iterator tests. The PR suites run a not-yet-merged
// feature's tests by fetching the PR ref; `main`'s `features` includes
// `iterator-includes` so that once PR #5031 merges and the submodule is bumped,
// `main` covers it and the `includes` suite auto-skips. Suites for features this
// package does not implement (chunks/windows, join, the unmerged take/drop
// RangeError) are informational (non-blocking).
var SUITES = {
	main: {
		label: 'main',
		features: ['iterator-helpers', 'iterator-sequencing', 'joint-iteration', 'iterator-includes'],
		paths: ['test/built-ins/Iterator/**/*.js'],
		expectedFailures: EXPECTED_FAILURES,
		blocking: true
	},
	includes: {
		label: 'Iterator.prototype.includes (test262 PR #5031)',
		pr: 5031,
		paths: ['test/built-ins/Iterator/prototype/includes'],
		blocking: true
	},
	'helper-edge': {
		label: 'helper iterator-close edge cases (test262 PR #4496)',
		pr: 4496,
		paths: prototypeTests(
			['drop', 'filter', 'map', 'take'],
			[
				'next-method-called-with-zero-arguments',
				'return-method-called-with-zero-arguments',
				'suspended-start-iterator-close-calls-next',
				'suspended-start-iterator-close-calls-return',
				'suspended-yield-iterator-close-calls-next',
				'suspended-yield-iterator-close-calls-return'
			]
		).concat(prototypeTests(
			['flatMap'],
			[
				'next-method-called-with-zero-arguments',
				'return-method-called-with-zero-arguments',
				'return-method-can-be-absent-for-inner',
				'return-method-can-be-absent-for-underlying',
				'suspended-start-iterator-close-calls-next',
				'suspended-start-iterator-close-calls-return',
				'suspended-yield-iterator-close-calls-next',
				'suspended-yield-iterator-close-calls-next-from-inner',
				'suspended-yield-iterator-close-calls-return',
				'suspended-yield-iterator-close-calls-return-from-inner'
			]
		)),
		blocking: true
	},
	chunking: {
		label: 'iterator-chunking (test262 PR #5011)',
		pr: 5011,
		paths: ['test/built-ins/Iterator/prototype/chunks', 'test/built-ins/Iterator/prototype/windows'],
		blocking: false
	},
	join: {
		label: 'Iterator.prototype.join (test262 PR #4768)',
		pr: 4768,
		paths: ['test/built-ins/Iterator/prototype/join'],
		blocking: false
	},
	'take-drop-rangeerror': {
		// #5065 *modifies* existing files for the unmerged ecma262 #3776 RangeError,
		// which this package does not implement; it can't auto-skip and is informational.
		label: 'take/drop RangeError (test262 PR #5065)',
		pr: 5065,
		modifies: true,
		paths: prototypeTests(
			['take', 'drop'],
			['argument-effect-order', 'argument-validation-failure-closes-underlying', 'limit-rangeerror']
		),
		blocking: false
	}
};

function bundle(callback) {
	browserify([autoPath]).bundle(function (err, buf) {
		if (err) {
			callback(err);
			return;
		}
		var bundlePath = path.join(os.tmpdir(), 'es-iterator-helpers-test262-bundle.js');
		fs.writeFileSync(bundlePath, buf);

		var preprocessorPath = path.join(os.tmpdir(), 'es-iterator-helpers-test262-preprocessor.js');
		fs.writeFileSync(preprocessorPath, [
			'var fs = require(\'fs\');',
			'var shim = fs.readFileSync(' + JSON.stringify(bundlePath) + ', \'utf8\');',
			'module.exports = function prependShim(test) {',
			'\ttest.contents = shim + \'\\n\' + test.contents;',
			'\treturn test;',
			'};',
			''
		].join('\n'));
		callback(null, preprocessorPath);
	});
}

function git(args) {
	return spawnSync('git', ['-C', test262Dir].concat(args), { encoding: 'utf8' });
}

function fetchPR(suite) {
	var fetched = git(['fetch', '--depth', '1', 'origin', 'refs/pull/' + suite.pr + '/head']);
	if (fetched.status !== 0) {
		throw new Error('failed to fetch test262 PR #' + suite.pr + ': ' + (fetched.stderr || ''));
	}
	var checkedOut = git(['checkout', 'FETCH_HEAD', '--'].concat(suite.paths));
	if (checkedOut.status !== 0) {
		throw new Error('failed to check out PR #' + suite.pr + ' tests: ' + (checkedOut.stderr || ''));
	}
}

function cleanupPR(suite) {
	git(['reset', '--quiet', 'HEAD', '--'].concat(suite.paths));
	if (suite.modifies) {
		git(['checkout', '--quiet', 'HEAD', '--'].concat(suite.paths));
	} else {
		suite.paths.forEach(function (p) {
			fs.rmSync(path.join(test262Dir, p), { recursive: true, force: true });
		});
	}
}

function globFor(p) {
	var abs = path.join(test262Dir, p).replace(/\\/g, '/');
	return (/\.js$/).test(p) ? abs : abs + '/**/*.js';
}

function runHarness(preprocessorPath, suite) {
	var threads = Math.max(1, os.cpus().length - 1);
	var expectedFailures = suite.expectedFailures || {};

	var args = [
		harnessBin,
		'--host-type',
		'node',
		'--host-path',
		process.execPath,
		'--preprocessor',
		preprocessorPath,
		'--test262-dir',
		test262Dir,
		'--reporter',
		'json',
		'--reporter-keys',
		'file,scenario,result',
		'-t',
		String(threads)
	];
	if (suite.features) {
		args.push('--features-include', suite.features.join(','));
	}
	args = args.concat(suite.paths.map(globFor));

	var result = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

	if (!result.stdout) {
		process.stderr.write(result.stderr || '');
		throw new Error('test262-harness produced no output');
	}

	var records;
	try {
		records = JSON.parse(result.stdout);
	} catch (e) {
		process.stderr.write(result.stdout);
		process.stderr.write(result.stderr || '');
		throw new Error('could not parse test262-harness output', { cause: e });
	}

	var passed = 0;
	var failingFiles = {};
	var unexpectedFailures = [];

	for (var i = 0; i < records.length; i += 1) {
		var record = records[i];
		if (record.result && record.result.pass) {
			passed += 1;
		} else {
			failingFiles[record.file] = true;
			if (!(record.file in expectedFailures)) {
				unexpectedFailures.push(record.file + ' (' + record.scenario + '): ' + (record.result && record.result.message));
			}
		}
	}

	// `engine:` failures are version-dependent: they pass where the shim provides
	// every helper and fail where native helpers exist, so passing is not a signal
	// to remove them. Only `polyfill:` (real-bug) entries are flagged when they pass.
	var unexpectedPasses = Object.keys(expectedFailures).filter(function (file) {
		return !(file in failingFiles) && expectedFailures[file].indexOf('engine:') !== 0;
	});

	var prefix = 'test262 [' + suite.label + ']: ';
	console.log(prefix + 'ran ' + records.length + ' (' + passed + ' passed, ' + (records.length - passed) + ' failed)');
	if (Object.keys(expectedFailures).length > 0) {
		console.log(prefix + Object.keys(expectedFailures).length + ' known failures allow-listed');
	}

	if (unexpectedPasses.length > 0) {
		console.warn('\n' + prefix + unexpectedPasses.length + ' allow-listed test(s) now PASS; remove them from EXPECTED_FAILURES in test262.js:');
		unexpectedPasses.forEach(function (file) {
			console.warn('  - ' + file);
		});
	}

	if (unexpectedFailures.length > 0) {
		var log = suite.blocking ? console.error : console.warn;
		log('\n' + prefix + unexpectedFailures.length + (suite.blocking ? ' UNEXPECTED failure(s):' : ' failure(s) (non-blocking; feature not implemented here):'));
		unexpectedFailures.forEach(function (failure) {
			log('  - ' + failure);
		});
		if (suite.blocking) {
			process.exitCode = 1;
		}
		return;
	}

	console.log('\n' + prefix + 'no unexpected failures');
}

function run(preprocessorPath) {
	if (!fs.existsSync(path.join(test262Dir, 'test'))) {
		throw new Error('the `test262` submodule is not checked out; run `git submodule update --init --depth 1`');
	}

	var suiteName = process.argv[2] || 'main';
	var suite = SUITES[suiteName];
	if (!suite) {
		throw new Error('unknown suite `' + suiteName + '`; known suites: ' + Object.keys(SUITES).join(', '));
	}

	if (!suite.pr) {
		runHarness(preprocessorPath, suite);
		return;
	}

	if (!suite.modifies) {
		var alreadyMerged = suite.paths.every(function (p) {
			return fs.existsSync(path.join(test262Dir, p));
		});
		if (alreadyMerged) {
			console.log('test262 [' + suite.label + ']: tests are present in the pinned submodule; the `main` run covers them -- skipping');
			return;
		}
	}

	fetchPR(suite);
	try {
		runHarness(preprocessorPath, suite);
	} finally {
		cleanupPR(suite);
	}
}

bundle(function (err, preprocessorPath) {
	if (err) {
		throw err;
	}
	run(preprocessorPath);
});
