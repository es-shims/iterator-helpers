'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var OrdinaryHasInstance = require('es-abstract/2022/OrdinaryHasInstance');
var OrdinaryObjectCreate = require('es-abstract/2022/OrdinaryObjectCreate');
var ToObject = require('es-abstract/2022/ToObject');
var Type = require('es-abstract/2022/Type');

var GetIteratorFlattenable = require('../aos/GetIteratorFlattenable');

var $Iterator = require('../Iterator/polyfill')();
var $WrapForValidIteratorPrototype = require('../WrapForValidIteratorPrototype');

var SLOT = require('internal-slot');

module.exports = function from(O) {
	if (this instanceof from) {
		throw new $TypeError('`Iterator.from` is not a constructor');
	}

	if (Type(O) === 'String') {
		// eslint-disable-next-line no-param-reassign
		O = ToObject(O); // step 1
	}

	var iteratorRecord = GetIteratorFlattenable(O); // step 2

	var hasInstance = OrdinaryHasInstance($Iterator, iteratorRecord['[[Iterator]]']); // step 3

	if (hasInstance) { // step 4
		return iteratorRecord['[[Iterator]]']; // step 4.a
	}

	var wrapper = OrdinaryObjectCreate($WrapForValidIteratorPrototype); // , ['[[Iterated]]']); // step 5

	SLOT.set(wrapper, '[[Iterated]]', iteratorRecord); // step 6

	return wrapper; // step 7
};
