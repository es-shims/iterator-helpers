'use strict';

var GetIntrinsic = require('get-intrinsic');

var $RangeError = GetIntrinsic('%RangeError%');
var $TypeError = GetIntrinsic('%TypeError%');

var CompletionRecord = require('es-abstract/2022/CompletionRecord');
var CreateIteratorFromClosure = require('../aos/CreateIteratorFromClosure');
var GetIteratorDirect = require('../aos/GetIteratorDirect');
var IteratorClose = require('../aos/IteratorClose');
var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var NormalCompletion = require('es-abstract/2022/NormalCompletion');
var ToIntegerOrInfinity = require('es-abstract/2022/ToIntegerOrInfinity');
var ToNumber = require('es-abstract/2022/ToNumber');

var iterHelperProto = require('../IteratorHelperPrototype');

var isNaN = require('es-abstract/helpers/isNaN');

var SLOT = require('internal-slot');

module.exports = function take(limit) {
	var iterated = GetIteratorDirect(this); // step 1

	var numLimit = ToNumber(limit); // step 2
	if (isNaN(numLimit)) {
		throw new $RangeError('`limit` must be a non-NaN number'); // step 3
	}

	var integerLimit = ToIntegerOrInfinity(numLimit); // step 4
	if (integerLimit < 0) {
		throw new $RangeError('`limit` must be a >= 0'); // step 5
	}

	var closeIfAbrupt = function (abruptCompletion) {
		if (!(abruptCompletion instanceof CompletionRecord)) {
			throw new $TypeError('`abruptCompletion` must be a Completion Record');
		}
		IteratorClose(
			iterated,
			abruptCompletion
		);
	};

	var sentinel = {};
	var remaining = integerLimit; // step 6.a
	var closure = function () { // step 6
		// while (true) { // step 6.b
		if (remaining === 0) { // step 6.b.i
			return IteratorClose( // step 6.b.i.1
				iterated,
				NormalCompletion(sentinel)
			);
		}
		if (remaining !== Infinity) { // step 6.b.ii
			remaining -= 1; // step 6.b.ii.1
		}

		var next = IteratorStep(iterated); // step 6.b.iii
		if (!next) {
			// return void undefined; // step 6.b.iv
			return sentinel;
		}

		var value = IteratorValue(next); // step 3.b.iii
		return value; // step 3.b.iv
		// }
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation
	SLOT.set(closure, '[[CloseIfAbrupt]]', closeIfAbrupt); // for the userland implementation

	var result = CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto, ['[[UnderlyingIterator]]']); // step 4

	SLOT.set(result, '[[UnderlyingIterator]]', iterated); // step 5

	return result; // step 6
};
