'use strict';

var iterProto = require('iterator.prototype');

var $Iterator = typeof Iterator === 'function' ? Iterator : function Iterator() {};

if ($Iterator.prototype !== iterProto) {
	$Iterator.prototype = iterProto;
}

module.exports = $Iterator;
