var sandbox = require("sandboxed-module");

exports["api.remote.list: missing & wrong params"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, keywords:["test1","test2","test3"], z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",uid:620793116, ctime:1350094951082, keywords:["test1","test2","test5"], z:{y:1}, rcpts:[620793114,620793115]};
	
	var dbusers = {};
	dbusers["50187f71556efcbb25aaaa"] = {_id:"50187f71556efcbb25aaaa",name:"enric",wids:["50187f71556efcbb25000002"]};		
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{list:1}}}} 
		}
	});
	
	sb.init();
	sb.add_constraint_pre("list","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("list","not_catalog",sb.constraints.not_catalog,"events")	
	  .add_constraint_pre("list","user_catalog",sb.constraints.user_catalog)
	  .add_constraint_pre("list","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_pre("list","param_criteria",sb.constraints.is_required("criteria"));	  	  	  	    	  
	  
	  	  							
	//user catalog
	var params = {catalog:"timers", uid:"50187f71556efcbb25aaaa", keyword:"test1"};
	sb.execute("list", params, function(err,result){
					
		test.deepEqual(err, {code:-5, message:"No access permission: restricted catalog"});
				
	});
	
	//uid missing: must be an existing system user.
	params = {miss_uid:"50187f71556efcbb25aaaa", criteria:"test1"};
	sb.execute("list", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uid parameter required"});
				
	});
			
			
	//criteria missing
	params = {uid:"50187f71556efcbb25aaaa", miss_criteria:"test1"};
	sb.execute("list", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "criteria parameter required"});		
		test.done();	
	});			

	
}


exports["api.remote.list: valid params with results"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000003"] = {_id:"50187f71556efcbb25000003",uid:620793114, ctime:1350094951092, name:"enric", z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, name:"enric", z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",uid:620793116, ctime:1350094951082, name:"foo", z:{y:1}, rcpts:[620793114,620793115]};
	
	var dbusers = {};
	dbusers["50187f71556efcbb25aaaa"] = {_id:"50187f71556efcbb25aaaa",name:"enric",wids:["50187f71556efcbb25000002"]};		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							criteria: function(col_str, criteria, order, ret_handler){
																																						
								test.equal(col_str,"docs");
								test.deepEqual(criteria,{ "$and": [ { name: "enric" } ] });
								
								ret_handler(null,[dbdocs["50187f71556efcbb25000003"],dbdocs["50187f71556efcbb25000002"]]);//return both documents									
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{list:1}}}} 
		}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if (col_str == "users"){
									
									test.equal(col_str,"users");
									test.equal(id_str,"50187f71556efcbb25aaaa");
									ret_handler(null,dbusers[id_str]);
								}
																	
							}
						 },
					"./api":api,	 
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{list:1}}}} 
		}
	});
	
	sb.init();
	sb.add_constraint_pre("list","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("list","not_catalog",sb.constraints.not_catalog,"events")	
	  .add_constraint_pre("list","user_catalog",sb.constraints.user_catalog)
	  .add_constraint_pre("list","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_pre("list","param_criteria",sb.constraints.is_required("criteria"));	  	  	  	    	  
	  
	  	  								
	var params = {uid:"50187f71556efcbb25aaaa", criteria:{name:"enric"}, catalog:"docs"};
	sb.execute("list", params, function(err,ctx){
					
		test.equal(err, undefined);
		test.deepEqual(ctx.retval,[{wid:"50187f71556efcbb25000003",uid:620793114, ctime:1350094951092, name:"enric", z:{y:1}, rcpts:[620793114,620793115]},{wid:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, name:"enric", z:{y:1}, rcpts:[620793114,620793115]}])		
		test.expect(6);		
		test.done();
		
				
	});
		
	
}

exports["api.remote.list: valid params with no results"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000003"] = {_id:"50187f71556efcbb25000003",uid:620793114, ctime:1350094951092, name:"enric", z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, name:"enric", z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",uid:620793116, ctime:1350094951082, name:"foo", z:{y:1}, rcpts:[620793114,620793115]};
	
	var dbusers = {};
	dbusers["50187f71556efcbb25aaaa"] = {_id:"50187f71556efcbb25aaaa",name:"enric",wids:["50187f71556efcbb25000002"]};		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							criteria: function(col_str, criteria, order, ret_handler){
																																						
								test.equal(col_str,"docs");
								test.deepEqual(criteria,{ "$and": [ { name: "baaar" } ] });
								
								ret_handler(null,[]);//return both documents									
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{list:1}}}} 
		}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if (col_str == "users"){
									
									test.equal(col_str,"users");
									test.equal(id_str,"50187f71556efcbb25aaaa");
									ret_handler(null,dbusers[id_str]);
								}
																	
							}
						 },
					"./api":api,	 
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{list:1}}}} 
		}
	});
	
	sb.init();
	sb.add_constraint_pre("list","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("list","not_catalog",sb.constraints.not_catalog,"events")	
	  .add_constraint_pre("list","user_catalog",sb.constraints.user_catalog)
	  .add_constraint_pre("list","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_pre("list","param_criteria",sb.constraints.is_required("criteria"));	  	  	  	    	  
	  
	  	  								
	var params = {uid:"50187f71556efcbb25aaaa", criteria:{name:"baaar"}, catalog:"docs"};
	sb.execute("list", params, function(err,ctx){
					
		test.equal(err, undefined);
		test.deepEqual(ctx.retval,[]);		
		test.expect(6);		
		test.done();
		
				
	});
			
}