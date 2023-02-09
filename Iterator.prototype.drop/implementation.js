'use strict';

var GetIntrinsic = require('get-intrinsic');

var $RangeError = GetIntrinsic('%RangeError%');

var IteratorClose = require('../aos/IteratorClose');
var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var ToIntegerOrInfinity = require('es-abstract/2022/ToIntegerOrInfinity');
var ToNumber = require('es-abstract/2022/ToNumber');

var GetIteratorDirect = require('../aos/GetIteratorDirect');
var CreateIteratorFromClosure = require('../aos/CreateIteratorFromClosure');

var iterHelperProto = require('../IteratorHelperPrototype');

var isNaN = require('es-abstract/helpers/isNaN');

var SLOT = require('internal-slot');

module.exports = function drop(limit) {
	var iterated = GetIteratorDirect(this); // step 1

	var numLimit = ToNumber(limit); // step 2
	if (isNaN(numLimit)) {
		throw new $RangeError('`limit` must be a non-NaN number'); // step 3
	}

	var integerLimit = ToIntegerOrInfinity(numLimit); // step 4
	if (integerLimit < 0) {
		throw new $RangeError('`limit` must be a >= 0'); // step 5
	}

	var sentinel = {};
	var remaining = integerLimit; // step 6.a
	var closure = function () { // step 6
		var next;
		while (remaining > 0) { // step 6.b
			if (remaining !== Infinity) { // step 6.b.i
				remaining -= 1; // step 6.b.i.1
			}

			next = IteratorStep(iterated); // step 6.b.ii
			if (!next) {
				// return void undefined; // step 6.b.iii
				return sentinel;
			}
		}
		// while (true) { // step 6.c
		next = IteratorStep(iterated); // step 6.c.i
		if (!next) {
			// return void undefined; // step 6.c.ii
			return sentinel;
		}
		try {
			var value = IteratorValue(next); // step 6.c.iii
			return value; // step 6.c.iii
		} catch (e) {
			// close iterator // step 6.c.icv
			IteratorClose(
				iterated,
				function () { throw e; }
			);
		}
		// }
		return void undefined;
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation

	return CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto); // step 4
};
