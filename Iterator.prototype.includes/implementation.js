'use strict';

var $RangeError = require('es-errors/range');
var $TypeError = require('es-errors/type');

var GetIteratorDirect = require('es-abstract/2025/GetIteratorDirect');
var IteratorClose = require('es-abstract/2025/IteratorClose');
var IteratorStepValue = require('es-abstract/2025/IteratorStepValue');
var NormalCompletion = require('es-abstract/2025/NormalCompletion');
var SameValueZero = require('es-abstract/2025/SameValueZero');

var isInteger = require('math-intrinsics/isInteger');

var isFinite = require('es-abstract/helpers/isFinite');
var isObject = require('es-abstract/helpers/isObject');

module.exports = function includes(searchElement) {
	if (this instanceof includes) {
		throw new $TypeError('`includes` is not a constructor');
	}

	var O = this; // step 1;

	if (!isObject(O)) {
		throw new $TypeError('`this` value must be an Object'); // step 2
	}

	var skippedElements = arguments.length > 1 ? arguments[1] : undefined; // step 3

	var toSkip = 0;
	if (typeof skippedElements !== 'undefined') { // step 4
		if (
			typeof skippedElements !== 'number'
			|| !isFinite(skippedElements)
			|| !isInteger(skippedElements)
		) {
			throw new $TypeError('`skippedElements` must be a finite integral Number'); // step 4.a
		}

		toSkip = skippedElements; // step 4.b
	}

	if (toSkip < 0) {
		throw new $RangeError('`skippedElements` must be >= 0'); // step 5
	}

	var skipped = 0; // step 6

	var iterated = GetIteratorDirect(O); // step 7

	while (true) { // step 8
		var value = IteratorStepValue(iterated); // step 8.a

		if (iterated['[[Done]]']) {
			return false; // step 8.b
		}
		if (skipped < toSkip) { // step 3
			skipped += 1; // step 3.a
		} else {
			// eslint-disable-next-line no-lonely-if
			if (SameValueZero(value, searchElement)) { // step 8.d
				return IteratorClose(
					iterated,
					NormalCompletion(true)
				); // step 8.d.i
			}
		}
	}
};
