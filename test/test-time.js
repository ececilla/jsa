var sandbox = require("sandboxed-module");

exports["time.now"] = function(test){
	
	var time = require("../lib/time");
	test.equal( new Date().getTime(), time.now() );
	test.done();
}

