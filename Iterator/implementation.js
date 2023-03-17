'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var iterProto = require('iterator.prototype');

var $Iterator = typeof Iterator === 'function' ? Iterator : function Iterator() {
	throw new $TypeError('`Iterator` can not be called directly');
};

if ($Iterator.prototype !== iterProto) {
	$Iterator.prototype = iterProto;
}

module.exports = $Iterator;
