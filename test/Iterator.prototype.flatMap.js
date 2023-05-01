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
var StringToCodePoints = require('es-abstract/2022/StringToCodePoints');

var index = require('../Iterator.prototype.flatMap');
var impl = require('../Iterator.prototype.flatMap/implementation');

var fnName = 'flatMap';

var isEnumerable = Object.prototype.propertyIsEnumerable;

var testIterator = require('./helpers/testIterator');

module.exports = {
	tests: function (flatMap, name, t) {
		forEach(v.primitives.concat(v.objects), function (nonIterator) {
			t['throws'](
				function () { flatMap(nonIterator); },
				TypeError,
				debug(nonIterator) + ' is not an Object with a callable `next` method'
			);

			var badNext = { next: nonIterator };
			t['throws'](
				function () { flatMap(badNext); },
				TypeError,
				debug(badNext) + ' is not an Object with a callable `next` method'
			);
		});

		forEach(v.nonFunctions, function (nonFunction) {
			t['throws'](
				function () { flatMap({ next: function () {} }, nonFunction); },
				TypeError,
				debug(nonFunction) + ' is not a function'
			);
		});

		t.test('actual iteration', { skip: !hasSymbols }, function (st) {
			var arr = [1, 2, 3];
			var iterator = callBind(arr[Symbol.iterator], arr);

			testIterator(iterator(), [1, 2, 3], st, 'original');

			var nonIterableFlatMap = flatMap(iterator(), function (x) { return x; });
			st['throws'](
				function () { nonIterableFlatMap.next(); },
				TypeError,
				'non-iterable return value throws'
			);

			forEach(v.strings, function (string) {
				st['throws'](
					function () { flatMap(iterator(), function () { return string; }).next(); },
					TypeError,
					'non-object return value throws even if iterable (' + debug(string) + ')'
				);

				testIterator(
					flatMap(iterator(), function () { return Object(string); }),
					[].concat(StringToCodePoints(string), StringToCodePoints(string), StringToCodePoints(string)),
					st,
					'boxed string (' + debug(string) + ')'
				);
			});

			testIterator(flatMap(iterator(), function (x) { return [x][Symbol.iterator](); }), [1, 2, 3], st, 'identity mapper in array iterator');
			testIterator(flatMap(iterator(), function (x) { return [2 * x][Symbol.iterator](); }), [2, 4, 6], st, 'doubler mapper in array iterator');

			testIterator(flatMap(iterator(), function (x) { return [[x]][Symbol.iterator](); }), [[1], [2], [3]], st, 'identity mapper in nested array iterator');
			testIterator(flatMap(iterator(), function (x) { return [[2 * x]][Symbol.iterator](); }), [[2], [4], [6]], st, 'doubler mapper in nested array iterator');

			testIterator(flatMap([0, 1, 2, 3][Symbol.iterator](), function (value) {
				var result = [];
				for (var i = 0; i < value; ++i) {
					result.push(value);
				}
				return result;
			}), [1, 2, 2, 3, 3, 3], st, 'test262: test/built-ins/Iterator/prototype/flatMap/flattens-iteratable');

			testIterator(flatMap([0, 1, 2, 3][Symbol.iterator](), function (value) {
				var i = 0;
				return {
					next: function () {
						if (i < value) {
							i += 1;
							return {
								value: value,
								done: false
							};
						}
						return {
							value: undefined,
							done: true
						};

					}
				};
			}), [1, 2, 2, 3, 3, 3], st, 'test262: test/built-ins/Iterator/prototype/flatMap/flattens-iterator');

			testIterator(flatMap([0][Symbol.iterator](), function () {
				var n = [0, 1, 2][Symbol.iterator]();

				var ret = {
					next: function next() {
						return n.next();
					}
				};
				ret[Symbol.iterator] = 0;
				return ret;
			}), [0, 1, 2], st, 'test262: test/built-ins/Iterator/prototype/flatMap/iterable-to-iterator-fallback');

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
