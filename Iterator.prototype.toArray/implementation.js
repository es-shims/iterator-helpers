'use strict';

var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');

var GetIteratorDirect = require('../aos/GetIteratorDirect');

var callBound = require('call-bind/callBound');

var $push = callBound('Array.prototype.push');

module.exports = function toArray() {
	var iterated = GetIteratorDirect(this); // step 1

	var items = []; // step 2

	// eslint-disable-next-line no-constant-condition
	while (true) { // step 3
		var next = IteratorStep(iterated); // step 3.a
		if (!next) {
			return items; // step 3.b
		}
		var value = IteratorValue(next); // step 3.c
		$push(items, value); // step 3.d
	}
};
