'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
var IsCallable = require('es-abstract/2022/IsCallable');
var IteratorClose = require('es-abstract/2022/IteratorClose');
var IteratorStep = require('es-abstract/2022/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');

var GetIteratorDirect = require('../aos/GetIteratorDirect');

module.exports = function reduce(reducer) {
	var iterated = GetIteratorDirect(this); // step 1

	if (!IsCallable(reducer)) {
		throw new $TypeError('`reducer` must be a function'); // step 2
	}

	var accumulator;
	var counter;
	var next;
	if (arguments.length < 2) { // step 3
		next = IteratorStep(iterated['[[Iterator]]']); // step 3.a
		if (!next) {
			throw new $TypeError('Reduce of empty iterator with no initial value'); // step 3.b
		}
		accumulator = IteratorValue(next); // step 3.c
		counter = 1;
	} else { // step 4
		accumulator = arguments[1]; // step 4.a
		counter = 0;
	}

	// eslint-disable-next-line no-constant-condition
	while (true) { // step 5
		next = IteratorStep(iterated['[[Iterator]]']); // step 5.a
		if (!next) {
			return accumulator; // step 5.b
		}
		var value = IteratorValue(next); // step 5.c
		try {
			var result = Call(reducer, void undefined, [accumulator, value, counter]); // step 5.d
			accumulator = result; // step 5.f
		} catch (e) {
			// close iterator // step 5.e
			IteratorClose(
				iterated['[[Iterator]]'],
				function () { throw e; }
			);
		}
		counter += 1; // step 5.g
	}
};
