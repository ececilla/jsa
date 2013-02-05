var sandbox = require("sandboxed-module");

exports["api.remote.search: missing & wrong params"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, keywords:["test1","test2","test3"], z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",uid:620793116, ctime:1350094951082, keywords:["test1","test2","test5"], z:{y:1}, rcpts:[620793114,620793115]};
	
	var dbusers = {};
	dbusers["50187f71556efcbb25aaaa"] = {_id:"50187f71556efcbb25aaaa",name:"enric",wids:["50187f71556efcbb25000002"]};		
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else if (col_str == "users"){
									ret_handler(null,dbusers[id_str]);
								}
																	
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{search:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_pre("search","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("search","not_catalog",sb.constraints.not_catalog,"events")	
	  .add_constraint_pre("search","user_catalog",sb.constraints.user_catalog)
	  .add_constraint_pre("search","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_pre("search","param_keyword",sb.constraints.is_required("keyword"));	  	  	  	    	  
	  
	  	  							
	//user catalog
	var params = {catalog:"timers", uid:"50187f71556efcbb25aaaa", keyword:"test1"};
	sb.execute("search", params, function(err,result){
					
		test.deepEqual(err, {code:-5, message:"No access permission: restricted catalog"});
				
	});
	
	//uid missing: must be an existing system user.
	params = {miss_uid:"50187f71556efcbb25aaaa", keyword:"test1"};
	sb.execute("search", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uid parameter required"});
				
	});
			
			
	//keyword missing
	params = {uid:"50187f71556efcbb25aaaa", miss_keyword:"test1"};
	sb.execute("search", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "keyword parameter required"});		
		test.done();	
	});			

	
}

exports["api.remote.search: valid params with results"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000003"] = {_id:"50187f71556efcbb25000003",uid:620793114, ctime:1350094951092, keywords:["test1","test4","test3"], z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, keywords:["test1","test2","test3"], z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",uid:620793116, ctime:1350094951082, keywords:["test1","test2","test5"], z:{y:1}, rcpts:[620793114,620793115]};
	
	var dbusers = {};
	dbusers["50187f71556efcbb25aaaa"] = {_id:"50187f71556efcbb25aaaa",name:"enric",wids:["50187f71556efcbb25000002"]};		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							criteria: function(col_str, criteria, order, ret_handler){
																																						
								test.equal(col_str,"docs");
								test.deepEqual(criteria,{$and:[{keywords:"test1"},{keywords:"test2"}]});
								ret_handler(null,[dbdocs["50187f71556efcbb25000001"],dbdocs["50187f71556efcbb25000002"]]);//return both documents									
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{search:1}}}} 
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
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{search:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_pre("search","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("search","not_catalog",sb.constraints.not_catalog,"events")	
	  .add_constraint_pre("search","user_catalog",sb.constraints.user_catalog)
	  .add_constraint_pre("search","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_pre("search","param_keyword",sb.constraints.is_required("keyword"));	  	  	  	    	  
	  
	  	  							
	//user catalog
	var params = {uid:"50187f71556efcbb25aaaa", keyword:["test1","test2"]};
	sb.execute("search", params, function(err,ctx){
					
		test.equal(err, undefined);
		test.equal(ctx.retval.length,2);
		test.expect(6);		
		test.done();
		
				
	});
		
	
}

exports["api.remote.search: valid params with no results"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000003"] = {_id:"50187f71556efcbb25000003",uid:620793114, ctime:1350094951092, keywords:["test8","test4","test3"], z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, keywords:["test7","test5","test1"], z:{y:1}, rcpts:[620793114,620793115]};
	dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",uid:620793116, ctime:1350094951082, keywords:["test6","test0","test5"], z:{y:1}, rcpts:[620793114,620793115]};
	
	var dbusers = {};
	dbusers["50187f71556efcbb25aaaa"] = {_id:"50187f71556efcbb25aaaa",name:"enric",wids:["50187f71556efcbb25000002"]};		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							criteria: function(col_str, criteria, order, ret_handler){
																																						
								test.equal(col_str,"docs");
								test.deepEqual(criteria,{$and:[{keywords:"test1"},{keywords:"test2"}]});
								ret_handler(null,[]);//return both documents									
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{search:1}}}} 
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
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"], user_catalogs:["docs","dummy"]}},api:{config:{procedures:{search:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_pre("search","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("search","not_catalog",sb.constraints.not_catalog,"events")	
	  .add_constraint_pre("search","user_catalog",sb.constraints.user_catalog)
	  .add_constraint_pre("search","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_pre("search","param_keyword",sb.constraints.is_required("keyword"));	  	  	  	    	  
	  
	  	  							
	//user catalog
	var params = {uid:"50187f71556efcbb25aaaa", keyword:["test1","test2"]};
	sb.execute("search", params, function(err,ctx){
					
		test.equal(err, undefined);
		test.equal(ctx.retval.length,0);
		test.expect(6);		
		test.done();
		
				
	});
			
}
