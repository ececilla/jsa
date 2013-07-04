var sandbox = require("sandboxed-module");


exports["api.remote.register: missing params"] = function(test){
				
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str, user, ret_handler){
																
								//Not executed								
								user._id = "50187f71556efcbb25000002";
								ret_handler(null,doc);	
							}
						 }					 
		}
	});
	
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								//Not executed because uid is not provided at register operation.
								flag = 0;
								ret_handler();
															
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{system_catalogs:["timers","events"],default_catalog:"docs"}},api:{config:{procedures:{register:1}}}}	 
		}
	});
	sb.init();
	sb.add_constraint_pre("register","param_user",sb.constraints.is_required("user"))
	  .add_constraint_pre("register","user_type",sb.constraints.param_type("user","object"));
		
	//user missing
	var params = {miss_user:{name:"dummy", email:"dummy@foobar.com"}};
	sb.execute("register", params, function(err,ctx){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "user parameter required"});
		test.expect(2)
		test.done();
		
	});
 			
}


exports["api.remote.register: invalid params: user != object"] = function(test){
				
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str, user, ret_handler){
																
								//Not executed								
								user._id = "50187f71556efcbb25000002";
								ret_handler(null,doc);	
							}
						 }					 
		}
	});
	
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								//Not executed because uid is not provided at register operation.
								flag = 0;
								ret_handler();
															
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{system_catalogs:["timers","events"],default_catalog:"docs"}},api:{config:{procedures:{register:1}}}}	 
		}
	});
	sb.init();
	sb.add_constraint_pre("register","param_user",sb.constraints.is_required("user"))
	  .add_constraint_pre("register","user_type",sb.constraints.param_type("user","object"));
		
	//user missing
	var params = {user:"wrong type user"};
	sb.execute("register", params, function(err,ctx){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-11, message: "Wrong parameter type: user not object"});
		test.expect(2)
		test.done();
		
	});
 		
	
}


exports["api.remote.register: valid params"] = function(test){
				
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str, user, ret_handler){
																
								//Not executed
								test.equal(col_str,"users");								
								test.equal( typeof user.ctime, "number" );
																
								user._id = "50187f71556efcbb25000002";
								ret_handler(null,user);	
							}
						 },
					"./server":{config:{app:{debug:0}}}	 					 
		}
	});
	
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								//Not executed because uid is not provided at register operation.
								flag = 0;
								ret_handler();
															
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{system_catalogs:["timers","events"],default_catalog:"docs"}},api:{config:{procedures:{register:1}}}}	 
		}
	});
	sb.init();
	sb.add_constraint_pre("register","param_user",sb.constraints.is_required("user"))
	  .add_constraint_pre("register","user_type",sb.constraints.param_type("user","object"));
	  
	api.on("ev_api_register",function(msg,rcpts){
				
		test.equal(msg.ev_type,"ev_api_register");
		test.notEqual(msg.ev_tstamp,undefined);
		test.equal(msg.ev_ctx.payload.name,"dummy");
		test.equal(msg.ev_ctx.payload.email,"dummy@foobar.com");
		test.equal(msg.ev_ctx.payload.password,"rL0Y20zC+Fzt72VPzMSk2A==");
		test.equal(msg.ev_ctx.payload.uid,"50187f71556efcbb25000002");
	}) 
		
	//user missing
	var params = {user:{name:"dummy", email:"dummy@foobar.com", password:"foo"}};
	sb.execute("register", params, function(err,ctx){
		
		test.ok(flag);				
		test.equal(ctx.retval._id, undefined);
		test.equal(ctx.retval.wids, undefined);
		test.equal(ctx.retval.uid,"50187f71556efcbb25000002");
		test.expect(12);		
		test.done();
		
	});
 		
	
}