'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
var GetIterator = require('es-abstract/2022/GetIterator');
var GetIteratorDirect = require('./GetIteratorDirect');
var IsCallable = require('es-abstract/2022/IsCallable');
var Type = require('es-abstract/2022/Type');

module.exports = function GetIteratorFlattenable(obj) {
	if (Type(obj) !== 'Object') {
		throw new $TypeError('obj must be an Object'); // step 1
	}

	var method = void undefined; // step 2

	// method = Get(obj, Symbol.iterator); // step 5.a
	method = function () {
		return GetIterator(obj);
	};

	var iterator;
	if (!IsCallable(method)) { // step 3
		iterator = obj; // step 3.a
	} else { // step 4
		iterator = Call(method, obj); // step 4.a
	}

	if (Type(iterator) !== 'Object') {
		throw new $TypeError('iterator must be an Object'); // step 5
	}
	return GetIteratorDirect(iterator); // step 6
};
