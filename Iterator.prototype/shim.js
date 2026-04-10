'use strict';

var getPolyfill = require('./polyfill');
var define = require('define-properties');
var hasSymbols = require('has-symbols')();
var setToStringTag = require('es-set-tostringtag');

var getIteratorPolyfill = require('../Iterator/polyfill');

module.exports = function shimIteratorFrom() {
	var $Iterator = getIteratorPolyfill();
	var polyfill = getPolyfill();
	define(
		$Iterator,
		{ prototype: polyfill },
		{ prototype: function () { return $Iterator.prototype !== polyfill; } }
	);

	if (hasSymbols && Symbol.toStringTag) {
		setToStringTag(polyfill, 'Iterator');
	}

	return polyfill;
};
