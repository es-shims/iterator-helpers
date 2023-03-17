'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
var CreateIteratorFromClosure = require('../aos/CreateIteratorFromClosure');
var GetIteratorDirect = require('../aos/GetIteratorDirect');
var GetIteratorFlattenable = require('../aos/GetIteratorFlattenable');
var IsCallable = require('es-abstract/2022/IsCallable');
var IteratorClose = require('../aos/IteratorClose');
var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var ThrowCompletion = require('es-abstract/2022/ThrowCompletion');

var iterHelperProto = require('../IteratorHelperPrototype');

var SLOT = require('internal-slot');

module.exports = function flatMap(mapper) {
	var iterated = GetIteratorDirect(this); // step 1

	if (!IsCallable(mapper)) {
		throw new $TypeError('`mapper` must be a function'); // step 2
	}

	var sentinel = {};
	var counter = 0; // step 3.a
	var closure = function () {
		// while (true) { // step 3.b
		var next = IteratorStep(iterated); // step 3.b.i
		if (!next) {
			// return void undefined; // step 3.b.ii
			return sentinel;
		}
		var value = IteratorValue(next); // step 3.b.iii
		var mapped;
		var innerIterator;
		try {
			try {
				mapped = Call(mapper, void undefined, [value, counter]); // step 3.b.iv
				// yield mapped // step 3.b.vi
				innerIterator = GetIteratorFlattenable(mapped, 'sync'); // step 3.b.vi
			} catch (e) {
				IteratorClose(
					iterated,
					ThrowCompletion(e)
				); // steps 3.b.v, 3.b.vii
			}
			var innerAlive = true; // step 3.b.viii
			while (innerAlive) { // step 3.b.ix
				try {
					var innerNext = IteratorStep(innerIterator); // step 3.b.ix.1
				} catch (e) {
					IteratorClose(
						iterated,
						ThrowCompletion(e)
					); // step 3.b.ix.2
				}
				if (!innerNext) {
					innerAlive = false; // step 3.b.ix.3.a
				} else { // step 3.b.ix.4
					var innerValue;
					try {
						innerValue = IteratorValue(innerNext); // step 3.b.ix.4.a
					} catch (e) {
						IteratorClose(
							iterated,
							ThrowCompletion(e)
						); // step 3.b.ix.4.b
					}
					return innerValue; // step 3.b.ix.4.c
				}
			}
		} finally {
			counter += 1; // step 3.b.x
		}
		// }
		return void undefined;
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation

	return CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto); // step 4
};
