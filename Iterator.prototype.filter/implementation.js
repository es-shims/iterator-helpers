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
var CreateIteratorFromClosure = require('../aos/CreateIteratorFromClosure');

var iterHelperProto = require('../IteratorHelperPrototype');

var SLOT = require('internal-slot');

module.exports = function filter(predicate) {
	var O = this; // step 1
	if (Type(O) !== 'Object') {
		throw new $TypeError('the receiver (`this` value) must be an Object'); // step 2
	}

	if (!IsCallable(predicate)) {
		throw new $TypeError('`predicate` must be a function'); // step 3
	}

	var iterated = GetIteratorDirect(O); // step 4

	var sentinel = {};
	var closure = function () {
		var counter = 0; // step 5.a
		// eslint-disable-next-line no-constant-condition
		while (true) { // step 5.b
			var next = IteratorStep(iterated); // step 5.b.i
			if (!next) {
				// return void undefined; // step 5.b.ii
				return sentinel;
			}
			var value = IteratorValue(next); // step 5.b.iii
			var selected;
			try {
				selected = Call(predicate, void undefined, [value, counter]); // step 5.b.iv
				// yield mapped // step 5.b.vi
				if (ToBoolean(selected)) {
					return value;
				}
			} catch (e) {
				// close iterator // step 5.b.v, 5.b.vii
				IteratorClose(iterated, true);
				throw e;
			} finally {
				counter += 1; // step 5.b.viii
			}
		}
	};
	SLOT.set(closure, '[[Sentinel]]', sentinel); // for the userland implementation

	var result = CreateIteratorFromClosure(closure, 'Iterator Helper', iterHelperProto, ['[[UnderlyingIterator]]']); // step 6
	SLOT.set(result, '[[UnderlyingIterator]]', iterated); // step 7
	return result; // step 8
};
