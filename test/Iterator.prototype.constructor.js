'use strict';

var defineProperties = require('define-properties');
var test = require('tape');

var Index = require('../Iterator.prototype.constructor');
var Impl = require('../Iterator.prototype.constructor/implementation');

var $Iterator = require('../Iterator/polyfill')();

var isEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = {
	tests: function (t, constructor, name) {
		t.equal(constructor, $Iterator, name + ' is Iterator');
	},
	index: function () {
		test('Iterator.prototype.constructor: index', function (t) {
			t.notEqual(Index, $Iterator, 'index is not Iterator itself');
			t.equal(typeof Index, 'function', 'index is a function');

			t.ok(new Index() instanceof $Iterator, 'new index() instanceof Iterator');

			t.end();
		});
	},
	implementation: function () {
		test('Iterator.prototype.constructor: implementation', function (t) {
			t.equal(Impl, $Iterator, 'implementation is Iterator itself');
			module.exports.tests(t, Impl, 'Iterator.prototype.constructor');

			t.end();
		});
	},
	shimmed: function () {
		test('Iterator.prototype.constructor: shimmed', function (t) {
			module.exports.tests(t, Iterator.prototype.constructor, 'Iterator.prototype.constructor');

			t.test('enumerability', { skip: !defineProperties.supportsDescriptors }, function (et) {
				et.equal(false, isEnumerable.call(Iterator.prototype, 'constructor'), 'Iterator#constructor is not enumerable');
				et.end();
			});

			t.end();
		});
	}
};
