'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var GeneratorStart = require('./GeneratorStart');
var IsArray = require('es-abstract/2022/IsArray');
var IsCallable = require('es-abstract/2022/IsCallable');
var OrdinaryObjectCreate = require('es-abstract/2022/OrdinaryObjectCreate');
var Type = require('es-abstract/2022/Type');

var every = require('es-abstract/helpers/every');

var callBound = require('call-bind/callBound');
var SLOT = require('internal-slot');

var $concat = callBound('Array.prototype.concat');

var isString = function isString(slot) {
	return Type(slot) === 'String';
};

module.exports = function CreateIteratorFromClosure(closure, generatorBrand, proto) {
	if (!IsCallable(closure)) {
		throw new $TypeError('`closure` must be a function');
	}
	if (Type(generatorBrand) !== 'String') {
		throw new $TypeError('`generatorBrand` must be a string');
	}
	var extraSlots = arguments.length > 3 ? arguments[3] : [];
	if (arguments.length > 3) {
		if (!IsArray(extraSlots) || !every(extraSlots, isString)) {
			throw new $TypeError('`extraSlots` must be a List of String internal slot names');
		}
	}
	var internalSlotsList = $concat(extraSlots, ['[[GeneratorContext]]', '[[GeneratorBrand]]', '[[GeneratorState]]']); // step 3
	var generator = OrdinaryObjectCreate(proto, internalSlotsList); // steps 4, 6
	SLOT.set(generator, '[[GeneratorBrand]]', generatorBrand); // step 5

	SLOT.assert(closure, '[[Sentinel]]'); // our userland slot
	SLOT.set(generator, '[[Sentinel]]', SLOT.get(closure, '[[Sentinel]]')); // our userland slot
	SLOT.assert(closure, '[[CloseIfAbrupt]]'); // our second userland slot
	SLOT.set(generator, '[[CloseIfAbrupt]]', SLOT.get(closure, '[[CloseIfAbrupt]]')); // our second userland slot

	GeneratorStart(generator, closure); // step 13

	return generator; // step 15
};
