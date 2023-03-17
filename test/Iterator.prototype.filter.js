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

var index = require('../Iterator.prototype.filter');
var impl = require('../Iterator.prototype.filter/implementation');

var fnName = 'filter';

var isEnumerable = Object.prototype.propertyIsEnumerable;

var testIterator = require('./helpers/testIterator');

module.exports = {
	tests: function (filter, name, t) {
		forEach(v.primitives.concat(v.objects), function (nonIterator) {
			t['throws'](
				function () { filter(nonIterator); },
				TypeError,
				debug(nonIterator) + ' is not an Object with a callable `next` method'
			);

			var badNext = { next: nonIterator };
			t['throws'](
				function () { filter(badNext); },
				TypeError,
				debug(badNext) + ' is not an Object with a callable `next` method'
			);
		});

		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { filter({ next: function () {} }, nonFunction); },
				TypeError,
				debug(nonFunction) + ' is not a function'
			);
		});

		t.test('actual iteration', { skip: !hasSymbols }, function (st) {
			var arr = [1, 2, 3];
			var iterator = callBind(arr[Symbol.iterator], arr);

			testIterator(iterator(), [1, 2, 3], st, 'original');
			testIterator(filter(iterator(), function () { return false; }), [], st, 'filter for always-false');
			testIterator(filter(iterator(), function () { return true; }), [1, 2, 3], st, 'filter for always-true');
			testIterator(filter(iterator(), function (x, i) { return x === 2 && i === 1; }), [2], st, 'filter returns value for matching value/index');

			st.end();
		});

		t.test('262: test/built-ins/Iterator/prototype/filter/predicate-args', function (st) {
			var g = function g() {
				var arr = ['a', 'b', 'c'];
				var i = 0;
				return {
					next: function () {
						try {
							return {
								value: arr[i],
								done: i >= arr.length
							};
						} finally {
							i += 1;
						}
					}
				};
			};
			var assertionCount = 0;
			var iter = filter(
				g(),
				function (value, count) {
					if (value === 'a') {
						st.equal(count, 0, 'first iteration');
					} else if (value === 'b') {
						st.equal(count, 1, 'second iteration');
					} else if (value === 'c') {
						st.equal(count, 2, 'third iteration');
					} else {
						st.fail('unexpected iteration');
					}
					assertionCount += 1;
					return true;
				}
			);

			st.equal(assertionCount, 0, 'prior to iteration');

			testIterator(iter, ['a', 'b', 'c'], st, 'iteration');

			st.equal(assertionCount, 3);

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
				st['throws'](function () { return Iterator.prototype[fnName].call(undefined, 'a'); }, TypeError, 'undefined is not an object');
				st['throws'](function () { return Iterator.prototype[fnName].call(null, 'a'); }, TypeError, 'null is not an object');
				st.end();
			});

			module.exports.tests(callBind(Iterator.prototype[fnName]), 'Iterator.prototype.' + fnName, t);

			t.end();
		});
	}
};
