var sandbox = require("sandboxed-module");

exports["api.remote.unjoin: missing & wrong params"] = function(test){
	
			
	var flag = 1;
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, catalog:"dummy", test:"test", rcpts:[{push_id:"gcm-114",push_type:"gcm"},{push_id:"gcm-115",push_type:"gcm"}]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str,projection, ret_handler){
								
								if( typeof projection == "function")
									ret_handler = projection;
								
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000002");
									ret_handler(null,dbdocs[id_str]);//return doc
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000002"]});
								}																																																							
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied
								flag = 0;
								ret_handler();	
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{unjoin:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_post("unjoin","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("unjoin","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("unjoin","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("unjoin","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("unjoin","is_joinable",sb.constraints.is_joinable)
	  .add_constraint_post("unjoin","has_joined",sb.constraints.has_joined);
	  
		
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("unjoin", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "uid parameter required"});
		
	});
		
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002"};
	sb.execute("unjoin", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "wid parameter required"});		
	}); 
	
	//not in rcpts
	params = {uid:620793119, wid:"50187f71556efcbb25000002"};
	sb.execute("unjoin", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-3, message:"No access permission: not joined"});
			
	}); 
	
	//doc has no rcpts list
	delete dbdocs["50187f71556efcbb25000002"].rcpts;
	params = {uid:620793119, wid:"50187f71556efcbb25000002"};
	sb.execute("unjoin", params, function(err,result){
		
		
		test.ok(flag);		
		test.deepEqual(err, {code:-7, message:"No access permission: not joinable/unjoinable"});
		
		test.expect(17);
		test.done();
	});			
	
}



exports["api.remote.unjoin: valid params, uid in rcpts, default catalog, db async"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793115, a:1, b:"test1234", rcpts:[{push_id:"gcm-115",push_type:"gcm"},{push_id:"gcm-117",push_type:"gcm"}], catalog:"docs"};
				
	var api = sandbox.require("../lib/api",{
		requires:{
					"./server":{config:{app:{debug:0}}}
		}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str,projection, ret_handler){
								
								if( typeof projection == "function")
									ret_handler = projection;
								
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000001");
									setTimeout(function(){//10ms delay loading data document
									
										ret_handler(null,dbdocs[id_str]);//return doc
									},10);
																		
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									setTimeout(function(){//10ms delay loading user document
									
										ret_handler(null,{_id:620793114, push_id:"gcm-117", push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000001"]});
									},10);																		
								}																																																																															
							},
							save:function(col_str,doc,ret_handler){
								
								if(col_str == "docs"){	//autosaving doc.																						
									test.equal(col_str,"docs");
									test.deepEqual(doc.rcpts,[{push_id:"gcm-115",push_type:"gcm"}]);
									
									setTimeout(function(){//100ms delay saving document
										
										ret_handler(null,doc);
									},20);	
								}else if(col_str == "users"){ //autosaving user.
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114,push_id:"gcm-117",push_type:"gcm", name:"enric",wids:[]});
									ret_handler(null,doc);
								}
									
							}
						 },
					"./api":api,	 
					"./server":{config:{app:{status:1,debug:0},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{unjoin:1}}}}				 		  
		}
	});
	sb.init();
	sb.add_constraint_post("unjoin","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("unjoin","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("unjoin","has_joined",sb.constraints.has_joined)	
	  .add_constraint_post("unjoin","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("unjoin","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("unjoin","is_joinable",sb.constraints.is_joinable);
		
	
	var params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid not in rcpts	
				
	sb.execute("unjoin", params, function(err,ctx){
									
		test.equal(err,null);		
		test.equal(ctx.retval,1);
		
		test.expect(9);
		test.done();		
		
	});				
		
}


exports["api.remote.unjoin: valid params, wid not found"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002", uid:620793115, a:1, b:"test1234", rcpts:[620793115,620793117], catalog:"docs"};
				
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, projection, ret_handler){
								
								if( typeof projection == "function")
									ret_handler = projection;
								
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000001");
									
									setTimeout(function(){//100ms delay saving documentdoc not found
									
									ret_handler(null,dbdocs[id_str]);//return doc
									},10);
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									test.equal(id_str,620793117);									
									ret_handler(null,{_id:620793117, name:"enric",wids:["50187f71556efcbb25000002"]});
								}																																																															
																
							}							
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{unjoin:1}}}}				 		  
		}
	});
	sb.init();
	sb.add_constraint_post("unjoin","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("unjoin","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("unjoin","has_joined",sb.constraints.has_joined)	
	  .add_constraint_post("unjoin","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("unjoin","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("unjoin","is_joinable",sb.constraints.is_joinable);
		
	
	var params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid not in rcpts	
				
	sb.execute("unjoin", params, function(err,result){
									
		
		test.deepEqual(err,{"code":-1,"message":"Document not found: #docs/50187f71556efcbb25000001"});		
		test.equal(result,null);
		
		test.expect(6);
		test.done();		
		
	});	
}
