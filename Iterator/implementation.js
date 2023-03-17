'use strict';

var GetIntrinsic = require('get-intrinsic');
var hasPropertyDescriptors = require('has-property-descriptors')();

var $TypeError = GetIntrinsic('%TypeError%');
var $defineProperty = hasPropertyDescriptors && GetIntrinsic('%Object.defineProperty%', true);

var iterProto = require('iterator.prototype');

var $Iterator = typeof Iterator === 'function' ? Iterator : function Iterator() {
	throw new $TypeError('`Iterator` can not be called directly');
};

if ($Iterator.prototype !== iterProto) {
	$Iterator.prototype = iterProto;
}
$defineProperty($Iterator, 'prototype', { writable: false });

module.exports = $Iterator;
