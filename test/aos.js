'use strict';

var test = require('tape');
var forEach = require('for-each');
var debug = require('object-inspect');
var v = require('es-value-fixtures');

var NormalCompletion = require('es-abstract/2025/NormalCompletion');
var ThrowCompletion = require('es-abstract/2025/ThrowCompletion');
var GetOptionsObject = require('../aos/GetOptionsObject');
var IfAbruptCloseIterators = require('../aos/IfAbruptCloseIterators');
var IteratorCloseAll = require('../aos/IteratorCloseAll');

test('GetOptionsObject', function (t) {
	t.test('undefined returns null-prototype object', function (st) {
		var result = GetOptionsObject(void undefined);
		st.equal(typeof result, 'object', 'returns an object');
		st.equal(Object.getPrototypeOf(result), null, 'prototype is null');
		st.end();
	});

	t.test('object returns itself', function (st) {
		var obj = { a: 1 };
		st.equal(GetOptionsObject(obj), obj, 'returns the same object');
		st.end();
	});

	t.test('non-object, non-undefined throws TypeError', function (st) {
		forEach(v.primitives, function (primitive) {
			if (typeof primitive !== 'undefined') {
				st['throws'](
					function () { GetOptionsObject(primitive); },
					TypeError,
					debug(primitive) + ' throws TypeError'
				);
			}
		});
		st.end();
	});

	t.end();
});

test('IfAbruptCloseIterators', function (t) {
	t.test('normal completion returns value', function (st) {
		var result = IfAbruptCloseIterators(NormalCompletion(42), []);
		st.equal(result, 42, 'returns unwrapped value');
		st.end();
	});

	t.test('throw completion closes iterators and throws', function (st) {
		var closeCalled = false;
		var iterRecord = {
			'[[Iterator]]': {
				next: function () { return { done: true }; },
				'return': function () { closeCalled = true; return { done: true }; }
			},
			'[[NextMethod]]': function () { return { done: true }; },
			'[[Done]]': false
		};

		st['throws'](
			function () { IfAbruptCloseIterators(ThrowCompletion(new EvalError('test')), [iterRecord]); },
			EvalError,
			'throws the error'
		);
		st.equal(closeCalled, true, 'iterator was closed');
		st.end();
	});

	t.test('non-CompletionRecord throws TypeError', function (st) {
		st['throws'](
			function () { IfAbruptCloseIterators(42, []); },
			TypeError,
			'non-CompletionRecord throws'
		);
		st.end();
	});

	t.end();
});

test('IteratorCloseAll', function (t) {
	t.test('closes all iterators in reverse order', function (st) {
		var closed = [];
		var makeIter = function (name) {
			return {
				'[[Iterator]]': {
					next: function () { return { done: true }; },
					'return': function () { closed.push(name); return { done: true }; }
				},
				'[[NextMethod]]': function () { return { done: true }; },
				'[[Done]]': false
			};
		};

		st['throws'](
			function () { IteratorCloseAll([makeIter('a'), makeIter('b'), makeIter('c')], ThrowCompletion(new EvalError('test'))); },
			EvalError,
			'throws the completion'
		);
		st.deepEqual(closed, ['c', 'b', 'a'], 'closed in reverse order');
		st.end();
	});

	t.test('close error replaces normal completion', function (st) {
		var iter = {
			'[[Iterator]]': {
				next: function () { return { done: true }; },
				'return': function () { throw new SyntaxError('close error'); }
			},
			'[[NextMethod]]': function () { return { done: true }; },
			'[[Done]]': false
		};

		st['throws'](
			function () { IteratorCloseAll([iter], NormalCompletion(void undefined)); },
			SyntaxError,
			'close error replaces normal completion'
		);
		st.end();
	});

	t.test('original throw completion wins over close error', function (st) {
		var iter = {
			'[[Iterator]]': {
				next: function () { return { done: true }; },
				'return': function () { throw new SyntaxError('close error'); }
			},
			'[[NextMethod]]': function () { return { done: true }; },
			'[[Done]]': false
		};

		st['throws'](
			function () { IteratorCloseAll([iter], ThrowCompletion(new EvalError('original'))); },
			EvalError,
			'original throw completion takes precedence'
		);
		st.end();
	});

	t.test('normal completion after successful close returns undefined', function (st) {
		var iter = {
			'[[Iterator]]': {
				next: function () { return { done: true }; },
				'return': function () { return { done: true }; }
			},
			'[[NextMethod]]': function () { return { done: true }; },
			'[[Done]]': false
		};

		var result = IteratorCloseAll([iter], NormalCompletion(void undefined));
		st.equal(result, void undefined, 'returns undefined');
		st.end();
	});

	t.test('validation', function (st) {
		st['throws'](
			function () { IteratorCloseAll('not an array', NormalCompletion(void undefined)); },
			TypeError,
			'non-array iters throws'
		);
		st['throws'](
			function () { IteratorCloseAll([], 'not a completion'); },
			TypeError,
			'non-CompletionRecord throws'
		);
		st.end();
	});

	t.end();
});
