var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var time = require("../lib/time");
	test.notEqual(time.now, undefined);	
	test.done();
}

