var sandbox = require("sandboxed-module");

exports["api.remote.dispose: missing params"] = function(test){
		
	
	var flag = 1;
	var doc = {_id:"50187f71556efcbb25000002",uid:620793114,ctime:1350094951092,catalog:"dummy",test:"test"};
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, projection, ret_handler){
								
								if( typeof projection == "function")
									ret_handler = projection;
																														
																														
								ret_handler(null,doc);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{dispose:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_post("dispose","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("dispose","param_uid",sb.constraints.is_required("uid"));
		
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("dispose", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "uid parameter required"});
		
	});
		
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002"};
	sb.execute("dispose", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
		test.expect(4);
		test.done();
	}); 	
		
	
}


exports["api.remote.dispose: valid params, wid not found, not owner"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114};
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25006666"] = {_id:"50187f71556efcbb25006666",uid:620793114,ctime:1350094951092,catalog:"dummy",test:"test"};
		
				
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, projection, ret_handler){
								
								if( typeof projection == "function")
									ret_handler = projection;
								
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									ret_handler(null,dbdocs[id_str]);//return doc
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									ret_handler(null,{_id:620793114, name:"enric",wids:["50187f71556efcbb25006666"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because document not found or constraint not satisfied
								flag = 0;
								ret_handler();	
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{dispose:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_post("dispose","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("dispose","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_pre("dispose","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("dispose","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("dispose","is_owner",sb.constraints.is_owner);		
	
	//wid not found
	var params = {uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("dispose", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000002"});		
		
	}); 
	
	//not owner
	params = {uid:620793115, wid:"50187f71556efcbb25006666"};
	sb.execute("dispose", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-2, message: "No access permission: not owner"});
		test.expect(8);
		test.done();
	});
		
}


//
exports["api.remote.dispose: valid params, default catalog"] = function(test){
	
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114};
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",uid:620793114,ctime:1350094951092,catalog:"docs",test:"test"};
		
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							removeById:function(col_str,id_str,ret_handler){
																
								
								test.equal( col_str, "docs" );																
								test.equal( id_str, "50187f71556efcbb25000001");
																						
								delete dbdocs["50187f71556efcbb25000001"];
																								
								ret_handler(null,1);
																								
							}
						 },
					"./server":{config:{app:{debug:0}}}	 					 
		}
	});
	
	api.on("ev_api_dispose", function(msg, rcpts){
		
		test.equal( msg.ev_type, "ev_api_dispose");
		test.deepEqual(msg.ev_ctx.params,{wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"} );
		
	});
	
	var flag = 1;				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, projection, ret_handler){
								
								if( typeof projection == "function")
									ret_handler = projection;
									
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000001");
									ret_handler(null,dbdocs[id_str]);//return doc
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000001"]});
								}																						
																	
							},
							save:function(col_str,doc,ret_handler){
															
								flag = 0;
								ret_handler();	
							}
						 },
				 "./api":api,
				 "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{dispose:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_post("dispose","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("dispose","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("dispose","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("dispose","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("dispose","is_owner",sb.constraints.is_owner);		
	
		
	sb.execute("dispose", params, function(err,ctx){
		
		test.ok(flag);		
		test.equal(ctx.retval, 1);
		test.expect(9);
		test.done();		
		
	}); 
	
			
}
