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

module.exports = function forEach(fn) {
	var O = this; // step 1
	if (Type(O) !== 'Object') {
		throw new $TypeError('the receiver (`this` value) must be an Object'); // step 2
	}

	if (!IsCallable(fn)) {
		throw new $TypeError('`fn` must be a function'); // step 2
	}

	var iterated = GetIteratorDirect(O); // step 3

	var counter = 0; // step 4

	// eslint-disable-next-line no-constant-condition
	while (true) { // step 5
		var next = IteratorStep(iterated); // step 5.a
		if (!next) {
			return void undefined; // step 5.b
		}
		var value = IteratorValue(next); // step 5.c
		try {
			Call(fn, void undefined, [value, counter]); // step 5.d
		} catch (e) {
			IteratorClose(
				iterated,
				function () { throw e; }
			); // steps 5.e
			throw e;
		} finally {
			counter += 1; // step 5.f
		}
	}
};
