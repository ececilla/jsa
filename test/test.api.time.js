var sandbox = require("sandboxed-module");

exports["api.remote.time:"] = function(test){
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{				  
				  "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{time:1}}}} 
		}
	});
	sb.init();
	  	  								
	var params = {};
						
	sb.execute("time", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.notEqual(ctx.retval,undefined);
		test.equal(typeof ctx.retval,"number");		
		test.expect(3);	
		test.done();		
		
	});
		
	
}

