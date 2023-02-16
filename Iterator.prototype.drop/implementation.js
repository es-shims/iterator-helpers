'use strict';

var GetIntrinsic = require('get-intrinsic');

var $RangeError = GetIntrinsic('%RangeError%');
var $TypeError = GetIntrinsic('%TypeError%');

var IteratorClose = require('../aos/IteratorClose');
var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var ToIntegerOrInfinity = require('es-abstract/2022/ToIntegerOrInfinity');
var ToNumber = require('es-abstract/2022/ToNumber');
var Type = require('es-abstract/2022/Type');

var GetIteratorDirect = require('../aos/GetIteratorDirect');
var CreateIteratorFromClosure = require('../aos/CreateIteratorFromClosure');

var iterHelperProto = require('../IteratorHelperPrototype');

var isNaN = require('es-abstract/helpers/isNaN');

var SLOT = require('internal-slot');

module.exports = function drop(limit) {
	var O = this; // step 1
	if (Type(O) !== 'Object') {
		throw new $TypeError('the receiver (`this` value) must be an Object'); // step 2
	}

	var numLimit = ToNumber(limit); // step 3
	if (isNaN(numLimit)) {
		throw new $RangeError('`limit` must be a non-NaN number'); // step 4
	}

	var integerLimit = ToIntegerOrInfinity(numLimit); // step 5
	if (integerLimit < 0) {
		throw new $RangeError('`limit` must be a >= 0'); // step 6
	}

	var iterated = GetIteratorDirect(O); // step 7

	var sentinel = {};
	var remaining = integerLimit; // step 8.a
	var closure = function () { // step 8
		var next;
		while (remaining > 0) { // step 8.b
			if (remaining !== Infinity) { // step 8.b.i
				remaining -= 1; // step 8.b.i.1
			}

			next = IteratorStep(iterated); // step 8.b.ii
			if (!next) {
				// return void undefined; // step 8.b.iii
				return sentinel;
			}
		}
		// while (true) { // step 8.c
		next = IteratorStep(iterated); // step 8.c.i
		if (!next) {
			// return void undefined; // step 8.c.ii
			return sentinel;
		}
		try {
			var value = IteratorValue(next); // step 8.c.iii
			return value; // step 8.c.iii
		} catch (e) {
			// close iterator // step 8.c.icv
			IteratorClose(
				iterated,
				function () { throw e; }
			);
		}
		// }
		return void undefined;
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation

	var result = CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto, ['[[UnderlyingIterator]]']); // step 9
	SLOT.set(result, '[[UnderlyingIterator]]', iterated); // step 10
	return result; // step 11
};
