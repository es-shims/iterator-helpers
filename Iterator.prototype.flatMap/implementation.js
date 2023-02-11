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
var CreateIteratorFromClosure = require('../aos/CreateIteratorFromClosure');

var GetIteratorFlattenable = require('../aos/GetIteratorFlattenable');
var iterHelperProto = require('../IteratorHelperPrototype');

var SLOT = require('internal-slot');

module.exports = function flatMap(mapper) {
	var O = this; // step 1
	if (Type(O) !== 'Object') {
		throw new $TypeError('the receiver (`this` value) must be an Object'); // step 2
	}

	if (!IsCallable(mapper)) {
		throw new $TypeError('`mapper` must be a function'); // step 3
	}

	var iterated = GetIteratorDirect(O); // step 4

	var sentinel = {};
	var counter = 0; // step 5.a
	var closure = function () {
		// while (true) { // step 5.b
		var next = IteratorStep(iterated); // step 5.b.i
		if (!next) {
			// return void undefined; // step 5.b.ii
			return sentinel;
		}
		var value = IteratorValue(next); // step 5.b.iii
		var mapped;
		var innerIterator;
		try {
			try {
				mapped = Call(mapper, void undefined, [value, counter]); // step 5.b.iv
				// yield mapped // step 5.b.vi
				innerIterator = GetIteratorFlattenable(mapped, 'sync'); // step 5.b.vi
			} catch (e) {
				IteratorClose(
					iterated,
					function () { throw e; }
				); // steps 5.b.v, 5.b.vii
			}
			var innerAlive = true; // step 5.b.viii
			while (innerAlive) { // step 5.b.ix
				try {
					var innerNext = IteratorStep(innerIterator); // step 5.b.ix.1
				} catch (e) {
					IteratorClose(
						iterated,
						function () { throw e; }
					); // step 5.b.ix.2
				}
				if (!innerNext) {
					innerAlive = false; // step 5.b.ix.5.a
				} else { // step 5.b.ix.4
					var innerValue;
					try {
						innerValue = IteratorValue(innerNext); // step 5.b.ix.4.a
					} catch (e) {
						IteratorClose(
							iterated,
							function () { throw e; }
						); // step 5.b.ix.4.b
					}
					return innerValue; // step 5.b.ix.4.c
				}
			}
		} finally {
			counter += 1; // step 5.b.x
		}
		// }
		return void undefined;
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation

	return CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto); // step 6
};
