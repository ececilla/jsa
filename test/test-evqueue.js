var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var eq = require("../lib/evqueue");
	test.notEqual(eq.remote.subscribe, undefined);
	test.done();
}

exports["evqueue.subscribe: add user"] = function(test){
	
	/*
	var subs = {test:1};	
	var eq = sandbox.require("../lib/evqueue",{		
		globals:{subscribers:subs}		
	});
	*/
	var eq = require("../lib/evqueue");
	
	var flags = [0,0];
	var params = {uid:620793114};
	var http_resp = {   foo:1,
						on:function(){ flags[0] = 1;},
						connection:{
							on:function(){ flags[1] = 1; }
						}
				    }; 
				 
	eq.remote.subscribe(http_resp,params);
	test.ok(flags[0]);
	test.ok(flags[1]);
		
	test.done();				
}




