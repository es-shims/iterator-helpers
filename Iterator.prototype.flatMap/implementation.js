'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
var CompletionRecord = require('es-abstract/2022/CompletionRecord');
var CreateIteratorFromClosure = require('../aos/CreateIteratorFromClosure');
var GetIteratorDirect = require('../aos/GetIteratorDirect');
var GetIteratorFlattenable = require('../aos/GetIteratorFlattenable');
var IsCallable = require('es-abstract/2022/IsCallable');
var IteratorClose = require('../aos/IteratorClose');
var IteratorStep = require('../aos/IteratorStep');
var IteratorValue = require('es-abstract/2022/IteratorValue');
var ThrowCompletion = require('es-abstract/2022/ThrowCompletion');
var Type = require('es-abstract/2022/Type');

var iterHelperProto = require('../IteratorHelperPrototype');

var SLOT = require('internal-slot');

module.exports = function flatMap(mapper) {
	var O = this; // step 1
	if (Type(O) !== 'Object') {
		throw new $TypeError('`this` value must be an Object'); // step 2
	}

	if (!IsCallable(mapper)) {
		throw new $TypeError('`mapper` must be a function'); // step 3
	}

	var iterated = GetIteratorDirect(O); // step 4

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
	var counter = 0; // step 6.a
	var closure = function () {
		// while (true) { // step 6.b
		var next = IteratorStep(iterated); // step 6.b.i
		if (!next) {
			// return void undefined; // step 6.b.ii
			return sentinel;
		}
		var value = IteratorValue(next); // step 6.b.iii
		var mapped;
		var innerIterator;
		try {
			try {
				mapped = Call(mapper, void undefined, [value, counter]); // step 6.b.iv
				// yield mapped // step 6.b.vi
				innerIterator = GetIteratorFlattenable(mapped, 'sync'); // step 6.b.vi
			} catch (e) {
				closeIfAbrupt(ThrowCompletion(e)); // steps 6.b.v, 6.b.vii
			}
			var innerAlive = true; // step 6.b.viii
			while (innerAlive) { // step 6.b.ix
				try {
					var innerNext = IteratorStep(innerIterator); // step 6.b.ix.1
				} catch (e) {
					closeIfAbrupt(ThrowCompletion(e)); // step 6.b.ix.2
				}
				if (!innerNext) {
					innerAlive = false; // step 6.b.ix.3.a
				} else { // step 6.b.ix.4
					var innerValue;
					try {
						innerValue = IteratorValue(innerNext); // step 6.b.ix.4.a
					} catch (e) {
						closeIfAbrupt(ThrowCompletion(e)); // step 6.b.ix.4.b
					}
					return innerValue; // step 6.b.ix.4.c
				}
			}
		} finally {
			counter += 1; // step 6.b.x
		}
		// }
		return void undefined;
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation
	SLOT.set(closure, '[[CloseIfAbrupt]]', closeIfAbrupt); // for the userland implementation

	var result = CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto, ['[[UnderlyingIterator]]']); // step 7

	SLOT.set(result, '[[UnderlyingIterator]]', iterated); // step 8

	return result; // step 9
};
