var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var router = require("../lib/router");
	
	test.notEqual( router.route, undefined );	
	test.done();
	
}


exports["router.route: routing '/something'"] = function(test){
	
	var router = require("../lib/router");
	var flag = 0;
	var router = sandbox.require("../lib/router",{
		requires:{"./endpoint":{ //mock for endpoint module	
														
							something:function(http_resp, data){
																
								test.deepEqual( http_resp, {dummy:1} );
								test.equal(data, "message");								
								flag = 1;					
							}							
		}}
	});
		
	router.route("/something", {dummy:1}, "message");
	test.ok(flag);
	test.expect(3);
	test.done();
}

exports["router.route: routing '/somethingnotfound'"] = function(test){
	
	var router = require("../lib/router");
	var functionflag = 1;
	var router = sandbox.require("../lib/router",{
		requires:{"./endpoint":{ //mock for endpoint module	
														
							something:function(http_resp, data){
																															
								functionflag = 0; //will not call this function					
							}							
		}}
	});
	
	var endflag = 0;
	var http_resp = { writeHead:function(code, http_header){
								
						test.equal(code,404);
					 },
					  write: function(str){
					  	
					  	test.equal(str,"404 Not Found.");
					 },
					 end: function(str){
						
						endflag = 1; 	
					 }			
					};			
								
	router.route("/somethingnotfound", http_resp , "message");
	
	test.ok(functionflag);
	test.ok(endflag)
	test.expect(4);
	test.done();
}






