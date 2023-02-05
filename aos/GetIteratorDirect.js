'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Get = require('es-abstract/2022/Get');
var IsCallable = require('es-abstract/2022/IsCallable');
var Type = require('es-abstract/2022/Type');

module.exports = function GetIteratorDirect(obj) {
	if (Type(obj) !== 'Object') {
		throw new $TypeError('`obj` must be an Object'); // step 1
	}

	var nextMethod = Get(obj, 'next'); // step 2

	if (!IsCallable(nextMethod)) {
		throw new $TypeError('`nextMethod` must be a function'); // step 3
	}

	var iteratorRecord = { '[[Iterator]]': obj, '[[NextMethod]]': nextMethod, '[[Done]]': false }; // step 4

	return iteratorRecord; // step 5
};
