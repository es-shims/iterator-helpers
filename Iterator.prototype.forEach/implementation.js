'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
var GetIteratorDirect = require('../aos/GetIteratorDirect');
var IsCallable = require('es-abstract/2022/IsCallable');
var IteratorClose = require('../aos/IteratorClose');
var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var ThrowCompletion = require('es-abstract/2022/ThrowCompletion');

module.exports = function forEach(fn) {
	var iterated = GetIteratorDirect(this); // step 1

	if (!IsCallable(fn)) {
		throw new $TypeError('`fn` must be a function'); // step 2
	}

	var counter = 0; // step 3

	// eslint-disable-next-line no-constant-condition
	while (true) { // step 4
		var next = IteratorStep(iterated); // step 4.a
		if (!next) {
			return void undefined; // step 4.b
		}
		var value = IteratorValue(next); // step 4.c
		try {
			Call(fn, void undefined, [value, counter]); // step 4.d
		} catch (e) {
			IteratorClose(
				iterated,
				ThrowCompletion(e)
			); // steps 4.e
			throw e;
		} finally {
			counter += 1; // step 4.f
		}
	}
};
