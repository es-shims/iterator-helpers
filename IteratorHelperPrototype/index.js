'use strict';

var setToStringTag = require('es-set-tostringtag');
var hasProto = require('has-proto')();

var CompletionRecord = require('es-abstract/2022/CompletionRecord');
var GeneratorResume = require('../aos/GeneratorResume');
var GeneratorResumeAbrupt = require('../aos/GeneratorResumeAbrupt');

var iterProto = require('iterator.prototype');

var implementation;
if (hasProto) {
	implementation = {
		__proto__: iterProto,
		next: function next() {
			return GeneratorResume(this, void undefined, 'Iterator Helper');
		},
		'return': function () {
			var C = new CompletionRecord('return', void undefined); // step 1
			return GeneratorResumeAbrupt(this, C, 'Iterator Helper');
		}
	};
	setToStringTag(implementation, 'Iterator Helper');
} else {
	var IteratorHelper = function IteratorHelper() {};
	IteratorHelper.prototype = iterProto;
	implementation = new IteratorHelper();
	delete implementation.constructor;
	implementation.next = function next() {
		return GeneratorResume(this, void undefined, 'Iterator Helper');
	};
	implementation['return'] = function () {
		var C = function () {}; // step 1
		return GeneratorResumeAbrupt(this, C, 'Iterator Helper');
	};
}

module.exports = implementation;
