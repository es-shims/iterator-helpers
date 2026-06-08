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

var path = require('path');
var fs = require('fs');
var os = require('os');
var spawnSync = require('child_process').spawnSync;

var browserify = require('browserify');

var root = __dirname;
var autoPath = path.join(root, 'auto.js');
var test262Dir = path.join(root, 'test262');
var harnessBin = require.resolve('test262-harness/bin/run.js');

var FEATURES = [
	'iterator-helpers',
	'iterator-sequencing',
	'joint-iteration'
];

// Known failures, keyed by path. A new failure fails the run; a listed test
// that starts passing is reported so it can be removed. Each reason is tagged
// `engine:` (an artifact of the native intrinsic differing from this package's
// on a native-capable engine; not a logic bug) or `polyfill:` (a real spec
// divergence tracked here rather than fixed alongside wiring up test262).
var EXPECTED_FAILURES = {
	'test262/test/built-ins/Iterator/zip/result-is-iterator.js': 'engine: zip result inherits this package\'s %IteratorHelperPrototype%, which is not SameValue as the native intrinsic on a native-capable engine',
	'test262/test/built-ins/Iterator/zipKeyed/result-is-iterator.js': 'engine: zipKeyed result inherits this package\'s %IteratorHelperPrototype%, which is not SameValue as the native intrinsic on a native-capable engine',
	'test262/test/built-ins/Iterator/from/return-method-throws-for-invalid-this.js': 'polyfill: WrapForValidIteratorPrototype return/next use SLOT.assert, which makes observable property accesses on an invalid `this` before throwing',
	'test262/test/built-ins/Iterator/zipKeyed/iterables-iteration-deleted.js': 'polyfill: Iterator.zipKeyed passes a deleted property\'s undefined descriptor to ToPropertyDescriptor instead of skipping it',
	'test262/test/built-ins/Iterator/prototype/constructor/prop-desc.js': 'polyfill: Iterator.prototype.constructor is shimmed as a data property instead of the spec-mandated get/set accessor',
	'test262/test/built-ins/Iterator/prototype/constructor/weird-setter.js': 'polyfill: Iterator.prototype.constructor is shimmed as a data property, so its setter is undefined',
	'test262/test/built-ins/Iterator/proto-from-ctor-realm.js': 'engine: cross-realm construction (Reflect.construct with a NewTarget from another realm whose .prototype is a non-object) requires the internal GetFunctionRealm to obtain that realm\'s %Iterator.prototype%, which has no userland equivalent'
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

function run(preprocessorPath) {
	if (!fs.existsSync(path.join(test262Dir, 'test'))) {
		throw new Error('the `test262` submodule is not checked out; run `git submodule update --init --depth 1`');
	}

	var threads = Math.max(1, os.cpus().length - 1);
	var glob = path.join(test262Dir, 'test/built-ins/Iterator/**/*.js').replace(/\\/g, '/');

	var result = spawnSync(process.execPath, [
		harnessBin,
		'--host-type',
		'node',
		'--host-path',
		process.execPath,
		'--preprocessor',
		preprocessorPath,
		'--test262-dir',
		test262Dir,
		'--features-include',
		FEATURES.join(','),
		'--reporter',
		'json',
		'--reporter-keys',
		'file,scenario,result',
		'-t',
		String(threads),
		glob
	], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

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
			if (!(record.file in EXPECTED_FAILURES)) {
				unexpectedFailures.push(record.file + ' (' + record.scenario + '): ' + (record.result && record.result.message));
			}
		}
	}

	// `engine:` failures are version-dependent: they pass where the shim provides
	// every helper and fail where native helpers exist, so passing is not a signal
	// to remove them. Only `polyfill:` (real-bug) entries are flagged when they pass.
	var unexpectedPasses = Object.keys(EXPECTED_FAILURES).filter(function (file) {
		return !(file in failingFiles) && EXPECTED_FAILURES[file].indexOf('engine:') !== 0;
	});

	console.log('test262: ran ' + records.length + ' (' + passed + ' passed, ' + (records.length - passed) + ' failed)');
	console.log('test262: ' + Object.keys(EXPECTED_FAILURES).length + ' known failures allow-listed');

	if (unexpectedPasses.length > 0) {
		console.warn('\ntest262: ' + unexpectedPasses.length + ' allow-listed test(s) now PASS; remove them from EXPECTED_FAILURES in test262.js:');
		unexpectedPasses.forEach(function (file) {
			console.warn('  - ' + file);
		});
	}

	if (unexpectedFailures.length > 0) {
		console.error('\ntest262: ' + unexpectedFailures.length + ' UNEXPECTED failure(s):');
		unexpectedFailures.forEach(function (failure) {
			console.error('  - ' + failure);
		});
		process.exitCode = 1;
		return;
	}

	console.log('\ntest262: no unexpected failures');
}

bundle(function (err, preprocessorPath) {
	if (err) {
		throw err;
	}
	run(preprocessorPath);
});
