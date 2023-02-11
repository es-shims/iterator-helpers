'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
var IsCallable = require('es-abstract/2022/IsCallable');
var IteratorClose = require('../aos/IteratorClose');
var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var ToBoolean = require('es-abstract/2022/ToBoolean');
var Type = require('es-abstract/2022/Type');

var GetIteratorDirect = require('../aos/GetIteratorDirect');

module.exports = function some(predicate) {
	var O = this; // step 1
	if (Type(O) !== 'Object') {
		throw new $TypeError('the receiver (`this` value) must be an Object'); // step 2
	}

	if (!IsCallable(predicate)) {
		throw new $TypeError('`predicate` must be a function'); // step 3
	}

	var iterated = GetIteratorDirect(O); // step 4

	var counter = 0; // step 5

	// eslint-disable-next-line no-constant-condition
	while (true) { // step 6
		var next = IteratorStep(iterated); // step 6.a
		if (!next) {
			return false; // step 6.b
		}
		var value = IteratorValue(next); // step 6.c
		var result;
		try {
			result = Call(predicate, void undefined, [value, counter]); // step 6.d
		} catch (e) {
			// close iterator // step 6.e
			IteratorClose(
				iterated,
				function () { throw e; }
			);
		} finally {
			counter += 1; // step 6.g
		}
		if (ToBoolean(result)) {
			return IteratorClose(
				iterated,
				function () { return true; }
			); // step 6.f
		}
	}
};
