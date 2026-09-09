'use strict';

var defineProperties = require('define-properties');
var test = require('tape');
var callBind = require('call-bind');
var functionsHaveNames = require('functions-have-names')();
var hasStrictMode = require('has-strict-mode')();
var forEach = require('for-each');
var debug = require('object-inspect');
var v = require('es-value-fixtures');
var hasSymbols = require('has-symbols/shams')();

var index = require('../Iterator.prototype.join');
var impl = require('../Iterator.prototype.join/implementation');

var fnName = 'join';

var isEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = {
	tests: function (join, name, t) {
		t['throws'](
			function () { return new join(); }, // eslint-disable-line new-cap
			TypeError,
			'`' + name + '` is not a constructor'
		);

		forEach(v.primitives, function (nonObject) {
			t['throws'](
				function () { join(nonObject); },
				TypeError,
				debug(nonObject) + ' is not an Object'
			);
		});

		t.test('does not close the underlying iterator', { skip: !defineProperties.supportsDescriptors }, function (st) {
			var trackReturn = function (iterator, onGet) {
				Object.defineProperty(iterator, 'return', { get: onGet });
				return iterator;
			};

			st.test('on exhaustion', function (s2t) {
				var nextCalls = 0;
				var gotReturn = false;

				s2t.equal(join(trackReturn({
					next: function () {
						nextCalls += 1;
						return nextCalls > 2 ? { done: true } : { done: false, value: 'ES' };
					}
				}, function () { gotReturn = true; })), 'ES,ES', 'joins until exhaustion');
				s2t.equal(nextCalls, 3, '`next` is called until it reports done');
				s2t.equal(gotReturn, false, '`return` is never looked up');

				s2t.end();
			});

			st.test('when `next` throws', function (s2t) {
				var gotReturn = false;

				s2t['throws'](
					function () {
						join(trackReturn({
							next: function () { throw new EvalError('next threw'); }
						}, function () { gotReturn = true; }));
					},
					EvalError,
					'the error from `next` propagates'
				);
				s2t.equal(gotReturn, false, '`return` is never looked up');

				s2t.end();
			});

			st.test('when the `next` getter throws', function (s2t) {
				var gotReturn = false;
				var iterator = {};
				Object.defineProperty(iterator, 'next', {
					get: function () { throw new EvalError('next getter threw'); }
				});

				s2t['throws'](
					function () { join(trackReturn(iterator, function () { gotReturn = true; })); },
					EvalError,
					'the error from the `next` getter propagates'
				);
				s2t.equal(gotReturn, false, '`return` is never looked up');

				s2t.end();
			});

			st.end();
		});

		t.test('`next` is looked up after ToString(separator)', { skip: !defineProperties.supportsDescriptors }, function (st) {
			var effects = [];
			var nextCalls = 0;

			var separator = {
				toString: function () {
					effects.push('toString');
					return '&&';
				}
			};

			var iterator = {};
			Object.defineProperty(iterator, 'next', {
				get: function () {
					effects.push('get next');
					return function () {
						nextCalls += 1;
						if (nextCalls === 1) {
							return { done: false, value: 'one' };
						}
						if (nextCalls === 2) {
							return { done: false, value: 'two' };
						}
						return { done: true };
					};
				}
			});

			st.equal(join(iterator, separator), 'one&&two', 'the coerced separator is used');
			st.equal(nextCalls, 3, '`next` is called until it reports done');
			st.deepEqual(effects, ['toString', 'get next'], 'the separator is coerced before `next` is looked up');

			st.end();
		});

		t.test('actual iteration', { skip: !hasSymbols }, function (st) {
			var arr = [1, 2, 3];
			var iterator = callBind(arr[Symbol.iterator], arr);

			st.equal(join(iterator()), '1,2,3', 'join() with default separator');
			st.equal(join(iterator(), '-'), '1-2-3', 'join("-")');
			st.equal(join(iterator(), ''), '123', 'join("")');
			st.equal(join(iterator(), ', '), '1, 2, 3', 'join(", ")');

			st.equal(join([][Symbol.iterator]()), '', 'join() of empty iterator');
			st.equal(join([][Symbol.iterator](), '-'), '', 'join("-") of empty iterator');

			st.equal(join([1][Symbol.iterator]()), '1', 'join() of single-element');
			st.equal(join([1][Symbol.iterator](), '-'), '1', 'join("-") of single-element');

			var withNulls = [1, null, undefined, 2];
			var nullIter = callBind(withNulls[Symbol.iterator], withNulls);
			st.equal(join(nullIter()), '1,,,2', 'null and undefined are treated as empty strings');
			st.equal(join(nullIter(), '-'), '1---2', 'null and undefined with separator');

			var strings = ['a', 'b', 'c'];
			var strIter = callBind(strings[Symbol.iterator], strings);
			st.equal(join(strIter()), 'a,b,c', 'join() with strings');

			st.test('ToString(separator) throwing closes iterator', function (s2t) {
				var returnCalls = 0;
				var iter = {
					next: function () { return { done: true }; },
					'return': function () { returnCalls += 1; return { done: true }; }
				};
				iter[Symbol.iterator] = function () { return iter; };

				s2t['throws'](
					function () { join(iter, { toString: function () { throw new EvalError('bad sep'); } }); },
					EvalError,
					'ToString(separator) error propagates'
				);
				s2t.equal(returnCalls, 1, 'return called when separator ToString throws');
				s2t.end();
			});

			st.test('ToString(value) throwing closes iterator', function (s2t) {
				var returnCalls = 0;
				var calls = 0;
				var iter = {
					next: function () {
						calls += 1;
						return calls <= 1 ? { done: false, value: { toString: function () { throw new EvalError('bad val'); } } } : { done: true };
					},
					'return': function () { returnCalls += 1; return { done: true }; }
				};
				iter[Symbol.iterator] = function () { return iter; };

				s2t['throws'](
					function () { join(iter); },
					EvalError,
					'ToString(value) error propagates'
				);
				s2t.equal(returnCalls, 1, 'return called when value ToString throws');
				s2t.end();
			});

			st.end();
		});
	},
	index: function () {
		test('Iterator.prototype.' + fnName + ': index', function (t) {
			module.exports.tests(index, 'Iterator.prototype.' + fnName, t);

			t.end();
		});
	},
	implementation: function () {
		test('Iterator.prototype.' + fnName + ': implementation', function (t) {
			module.exports.tests(callBind(impl), 'Iterator.prototype.' + fnName, t);

			t['throws'](
				function () { return new impl(); }, // eslint-disable-line new-cap
				TypeError,
				'`' + fnName + '` is not a constructor'
			);

			t.end();
		});
	},
	shimmed: function () {
		test('Iterator.prototype.' + fnName + ': shimmed', function (t) {
			t.test('Function name', { skip: !functionsHaveNames }, function (st) {
				st.equal(Iterator.prototype[fnName].name, fnName, 'Iterator#' + fnName + ' has name "' + fnName + '"');
				st.end();
			});

			t.test('enumerability', { skip: !defineProperties.supportsDescriptors }, function (et) {
				et.equal(false, isEnumerable.call(Iterator.prototype, fnName), 'Iterator#' + fnName + ' is not enumerable');
				et.end();
			});

			t.test('bad string/this value', { skip: !hasStrictMode }, function (st) {
				st['throws'](function () { return Iterator.prototype[fnName].call(undefined); }, TypeError, 'undefined is not an object');
				st['throws'](function () { return Iterator.prototype[fnName].call(null); }, TypeError, 'null is not an object');
				st.end();
			});

			t['throws'](
				function () { return new Iterator.prototype[fnName](); },
				TypeError,
				'`' + fnName + '` is not a constructor'
			);

			module.exports.tests(callBind(Iterator.prototype[fnName]), 'Iterator.prototype.' + fnName, t);

			t.end();
		});
	}
};
