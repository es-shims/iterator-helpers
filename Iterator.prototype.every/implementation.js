'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
var IsCallable = require('es-abstract/2022/IsCallable');
var IteratorClose = require('es-abstract/2022/IteratorClose');
var IteratorStep = require('es-abstract/2022/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var ToBoolean = require('es-abstract/2022/ToBoolean');

var GetIteratorDirect = require('../aos/GetIteratorDirect');

module.exports = function every(predicate) {
	var iterated = GetIteratorDirect(this); // step 1

	if (!IsCallable(predicate)) {
		throw new $TypeError('`predicate` must be a function'); // step 2
	}

	var counter = 0; // step 3

	// eslint-disable-next-line no-constant-condition
	while (true) { // step 4
		var next = IteratorStep(iterated['[[Iterator]]']); // step 4.a
		if (!next) {
			return true; // step 4.b
		}
		var value = IteratorValue(next); // step 4.c
		var result;
		try {
			result = Call(predicate, void undefined, [value, counter]); // step 4.d
		} catch (e) {
			// close iterator // step 4.e
			IteratorClose(
				iterated['[[Iterator]]'],
				function () { throw e; }
			);
		} finally {
			counter += 1; // step 4.g
		}
		if (!ToBoolean(result)) {
			return IteratorClose(
				iterated['[[Iterator]]'],
				function () { return false; }
			); // step 4.f
		}
	}
};
