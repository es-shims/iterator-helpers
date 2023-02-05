'use strict';

require('../auto');

var test = require('tape');
var forEach = require('for-each');

var shims = require('../');

forEach(shims, function (shim) {
	var shimTests;
	try {
		shimTests = require('./' + shim); // eslint-disable-line global-require
	} catch (e) {
		test(shim + ': shimmed', { todo: true });
	}
	if (shimTests) {
		shimTests.shimmed();
	}
});
