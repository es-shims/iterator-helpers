'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var IsCallable = require('es-abstract/2022/IsCallable');
var OrdinaryObjectCreate = require('es-abstract/2022/OrdinaryObjectCreate');

var GeneratorStart = require('./GeneratorStart');

var SLOT = require('internal-slot');

module.exports = function CreateIteratorFromClosure(closure, brand, proto) {
	if (!IsCallable(closure)) {
		throw new $TypeError('`closure` must be a function');
	}
	var generator = OrdinaryObjectCreate(proto, ['[[GeneratorContext]]', '[[GeneratorBrand]]', '[[GeneratorState]]']); // steps 3, 5
	SLOT.set(generator, '[[GeneratorBrand]]', brand); // step 4

	SLOT.assert(closure, '[[Sentinel]]'); // our userland slot
	SLOT.set(generator, '[[Sentinel]]'); // our userland slot
	SLOT.assert(closure, '[[CloseIfAbrupt]]'); // our second userland slot
	SLOT.set(generator, '[[CloseIfAbrupt]]', SLOT.get(closure, '[[CloseIfAbrupt]]')); // our second userland slot

	GeneratorStart(generator, closure); // step 13

	return generator; // step 15
};
