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

var index = require('../Iterator.prototype.drop');
var impl = require('../Iterator.prototype.drop/implementation');

var fnName = 'drop';

var isEnumerable = Object.prototype.propertyIsEnumerable;

var testIterator = require('./helpers/testIterator');

module.exports = {
	tests: function (drop, name, t) {
		forEach(v.primitives.concat(v.objects), function (nonIterator) {
			t['throws'](
				function () { drop(nonIterator); },
				TypeError,
				debug(nonIterator) + ' is not an Object with a callable `next` method'
			);

			var badNext = { next: nonIterator };
			t['throws'](
				function () { drop(badNext); },
				TypeError,
				debug(badNext) + ' is not an Object with a callable `next` method'
			);
		});

		var iterator = [1, 2, 3];

		t.test('actual iteration', { skip: !hasSymbols }, function (st) {
			st['throws'](
				function () { drop(iterator[Symbol.iterator](), -3); },
				RangeError,
				'-3 is not >= 0'
			);

			testIterator(iterator[Symbol.iterator](), [1, 2, 3], st, 'original');
			testIterator(drop(iterator[Symbol.iterator](), 0), [1, 2, 3], st, 'drop 0');
			testIterator(drop(iterator[Symbol.iterator](), 1), [2, 3], st, 'drop 1');
			testIterator(drop(iterator[Symbol.iterator](), 2), [3], st, 'drop 2');
			testIterator(drop(iterator[Symbol.iterator](), 3), [], st, 'drop 3');
			testIterator(drop(iterator[Symbol.iterator](), Infinity), [], st, 'drop ∞');

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
