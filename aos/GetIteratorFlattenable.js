'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var Call = require('es-abstract/2022/Call');
// var CreateAsyncFromSyncIterator = require('es-abstract/2022/CreateAsyncFromSyncIterator');
var Get = require('es-abstract/2022/Get');
var GetIterator = require('es-abstract/2022/GetIterator');
var IsCallable = require('es-abstract/2022/IsCallable');
var Type = require('es-abstract/2022/Type');

var hasSymbols = require('has-symbols/shams')();

module.exports = function GetIteratorFlattenable(obj, hint) {
	if (Type(obj) !== 'Object') {
		throw new $TypeError('obj must be an Object'); // step 1
	}

	var alreadyAsync = false; // step 2

	var method = void undefined; // step 3

	if (hint === 'async') { // step 4
		method = hasSymbols && Symbol.asyncIterator && obj[Symbol.asyncIterator]; // step 4.a
		alreadyAsync = true; // step 4.b
	}

	if (!IsCallable(method)) { // step 5
		// method = Get(obj, Symbol.iterator); // step 5.a
		method = function () {
			return GetIterator(obj);
		};
		alreadyAsync = false; // step 5.b
	}

	var iterator;
	if (!IsCallable(method)) { // step 6
		iterator = obj; // step 6.a
		alreadyAsync = true; // step 6.b
	} else { // step 7
		iterator = Call(method, obj); // step 7.a
	}

	if (Type(iterator) !== 'Object') {
		throw new $TypeError('iterator must be an Object'); // step 8
	}
	var nextMethod = Get(iterator, 'next'); // step 9

	if (!IsCallable(nextMethod)) {
		throw new $TypeError('nextMethod must be a function'); // step 10
	}

	var iteratorRecord = { '[[Iterator]]': iterator, '[[NextMethod]]': nextMethod, '[[Done]]': false }; // step 11

	if (hint === 'async' && !alreadyAsync) { // step 12
		// return CreateAsyncFromSyncIterator(iteratorRecord); // step 12.a
	}

	return iteratorRecord;
};
