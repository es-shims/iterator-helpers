'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var AdvanceStringIndex = require('es-abstract/2022/AdvanceStringIndex');
var Call = require('es-abstract/2022/Call');
var GetIteratorDirect = require('./GetIteratorDirect');
var GetV = require('es-abstract/2022/GetV');
var IsArray = require('es-abstract/2022/IsArray');
var IsCallable = require('es-abstract/2022/IsCallable');
var Type = require('es-abstract/2022/Type');

var getIteratorMethod = require('es-abstract/helpers/getIteratorMethod');

module.exports = function GetIteratorFlattenable(obj) {
	if (Type(obj) !== 'Object') {
		throw new $TypeError('obj must be an Object'); // step 1
	}

	var method = void undefined; // step 2

	// method = Get(obj, Symbol.iterator); // step 5.a
	method = getIteratorMethod(
		{
			AdvanceStringIndex: AdvanceStringIndex,
			GetMethod: GetV,
			IsArray: IsArray
		},
		obj
	);

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
