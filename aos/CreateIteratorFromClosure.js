'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var callBound = require('call-bind/callBound');

var $concat = callBound('Array.prototype.concat');

var IsArray = require('es-abstract/2022/IsArray');
var IsCallable = require('es-abstract/2022/IsCallable');
var OrdinaryObjectCreate = require('es-abstract/2022/OrdinaryObjectCreate');
var Type = require('es-abstract/2022/Type');

var every = require('es-abstract/helpers/every');

var GeneratorStart = require('./GeneratorStart');

var SLOT = require('internal-slot');

var isString = function (slot) {
	return Type(slot) === 'String';
};

module.exports = function CreateIteratorFromClosure(closure, generatorBrand, generatorPrototype) {
	if (!IsCallable(closure)) {
		throw new $TypeError('Assertion failed: `closure` must be a function');
	}
	if (Type(generatorBrand) !== 'String') {
		throw new $TypeError('Assertion failed: `generatorBrand` must be a String or `undefined` (to represent ~empty~)');
	}
	if (Type(generatorPrototype) !== 'Object') {
		throw new $TypeError('Assertion failed: `generatorPrototype` must be an Object');
	}

	var extraSlots = arguments.length > 3 ? arguments[3] : []; // step 2
	if (!IsArray(extraSlots) || !every(extraSlots, isString)) {
		throw new $TypeError('Assertion failed: `extraSlots` must be an Array of Strings');
	}

	var internalSlotsList = $concat(extraSlots, ['[[GeneratorContext]]', '[[GeneratorBrand]]', '[[GeneratorState]]']); // step 3

	var generator = OrdinaryObjectCreate(generatorPrototype, internalSlotsList); // step 4
	SLOT.set(generator, '[[GeneratorBrand]]', generatorBrand); // step 5

	SLOT.assert(closure, '[[Sentinel]]'); // our userland slot
	SLOT.set(generator, '[[Sentinel]]'); // our userland slot

	GeneratorStart(generator, closure); // step 13

	return generator; // step 15
};
