'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeError = GetIntrinsic('%TypeError%');

var iterProto = require('iterator.prototype');

var $Iterator = typeof Iterator === 'function' ? Iterator : function Iterator() {
	if (!(this instanceof Iterator)) {
		throw new $TypeError('`Iterator` can only be called with new');
	}
};

if ($Iterator.prototype !== iterProto) {
	$Iterator.prototype = iterProto;
}

module.exports = $Iterator;
