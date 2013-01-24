var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var eq = require("../lib/evqueue");
	test.notEqual( eq.save, undefined);	
	test.done();
}
