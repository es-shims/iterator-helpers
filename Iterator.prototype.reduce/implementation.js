'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
var IsCallable = require('es-abstract/2022/IsCallable');
var IteratorClose = require('../aos/IteratorClose');
var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var Type = require('es-abstract/2022/Type');

var GetIteratorDirect = require('../aos/GetIteratorDirect');

module.exports = function reduce(reducer) {
	var O = this; // step 1
	if (Type(O) !== 'Object') {
		throw new $TypeError('the receiver (`this` value) must be an Object'); // step 2
	}

	if (!IsCallable(reducer)) {
		throw new $TypeError('`reducer` must be a function'); // step 3
	}

	var iterated = GetIteratorDirect(O); // step 4

	var accumulator;
	var counter;
	var next;
	if (arguments.length < 2) { // step 5
		next = IteratorStep(iterated); // step 5.a
		if (!next) {
			throw new $TypeError('Reduce of empty iterator with no initial value'); // step 5.b
		}
		accumulator = IteratorValue(next); // step 5.c
		counter = 1;
	} else { // step 6
		accumulator = arguments[1]; // step 6.a
		counter = 0;
	}

	// eslint-disable-next-line no-constant-condition
	while (true) { // step 7
		next = IteratorStep(iterated); // step 7.a
		if (!next) {
			return accumulator; // step 7.b
		}
		var value = IteratorValue(next); // step 7.c
		try {
			var result = Call(reducer, void undefined, [accumulator, value, counter]); // step 7.d
			accumulator = result; // step 7.f
		} catch (e) {
			// close iterator // step 7.e
			IteratorClose(
				iterated,
				function () { throw e; }
			);
		}
		counter += 1; // step 7.g
	}
};
