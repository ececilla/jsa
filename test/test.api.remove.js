var sandbox = require("sandboxed-module");

exports["api.remote.remove: missing & wrong params, anonymous constraints"] = function(test){
	

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, catalog:"docs", test:"test", z:{y:1}, rcpts:[{push_id:"gcm-114",push_type:"gcm"},{push_id:"gcm-115",push_type:"gcm"}]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");																																				
									ret_handler(null,dbdocs[id_str]);//return doc
									
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									if(id_str == 620793114)																		
										ret_handler(null,{_id:id_str, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000002"]});
									else if(id_str == 620793999)
										ret_handler(null,{_id:id_str, push_id:"gcm-999", push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000002"]});
								}else
									ret_handler(null,null);																														
																
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_post("remove","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("remove","not_catalog",sb.constraints.not_catalog,"events") 
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("remove",sb.constraints.is_required("fname"))	//anonymous constraint  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("remove",sb.constraints.field_exists)//anonymous constraint
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined);
			
			
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uid parameter required"});		
		
	});
	
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
			
	});
	
	
	//fname missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", miss_fname:"test"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "fname parameter required"});
		
	}); 
		
	
	//reserved _id as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"_id"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: _id"});
			
	});
	
	//reserved uid as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"uid"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: uid"});
			
	});
	
	//reserved rcpts as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"rcpts"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: rcpts"});		
			
	});
	
	//field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"notexists"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:notexists"});		
			
	});
	
	//inner field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.notexists", value:5};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:z.notexists"});		
		
	});
	
	
	//uid must belong to rcpts
	params = {uid:620793999, wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "No access permission: not joined"});		
		
	});
	
	//wid not found
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"test"};
	sb.execute("remove", params, function(err,result){
					
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000005"});		
		test.done();
		
	});
	
}


exports["api.remote.remove: valid params, existing field, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:"test1234", rcpts:[{push_id:"gcm-114",push_type:"gcm"},{push_id:"gcm-117",push_type:"gcm"}], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if( col_str == "dummy"){																						
									
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.notEqual(dbdocs["50187f71556efcbb25000001"].b, undefined);																																				
									setTimeout(function(){ //db 50ms delay retrieving document
									
										ret_handler(null,dbdocs[id_str]);//return doc
									},50);									
									
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");																		
									ret_handler(null,{_id:id_str, push_id:"gcm-114",push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000001"]});
								}																																																						
																
							},
							save:function(col_str, doc,ret_handler){
															
								if(col_str == "dummy"){
								
									test.equal(col_str,"dummy");
									test.equal(doc.b,undefined);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000001"]});
									ret_handler(null);
								}
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_post("remove","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("remove","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("remove","param_fname",sb.constraints.is_required("fname"),"dummy")	  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("remove","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"b", catalog:"dummy"};

						
	sb.execute("remove", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(10);	
		test.done();		
		
	});
	
					
}

exports["api.remote.remove: valid params, existing inner field, explicit catalog, db async"] = function(test){
					
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{c:1,b:2}, rcpts:[{push_id:"gcm-114",push_type:"gcm"},{push_id:"gcm-117",push_type:"gcm"}], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if(col_str=="dummy"){																						
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.notEqual(dbdocs["50187f71556efcbb25000001"].a.b, undefined);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:id_str,push_id:"gcm-114", push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000001"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(doc.a.b,undefined);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000001"]});
									ret_handler(null);
								}
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_post("remove","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("remove","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("remove","param_fname",sb.constraints.is_required("fname"),"dummy")	  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("remove","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b", catalog:"dummy"};

						
	sb.execute("remove", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(10);	
		test.done();		
		
	});	
		
}


exports["api.remote.remove: valid params, existing inner array field, explicit catalog, db async"] = function(test){
		
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{c:1,b:[4,5,6]}, rcpts:[{push_id:"gcm-114",push_type:"gcm"},{push_id:"gcm-117",push_type:"gcm"}], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if(col_str == "dummy"){																						
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [4,5,6]);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:id_str, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000001"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.deepEqual(doc.a.b,[4,6]);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, push_id:"gcm-114",push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000001"]});
									ret_handler(null);
								}
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_pre("remove","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("remove","not_catalog",sb.constraints.not_catalog,"events") 
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("remove","param_fname",sb.constraints.is_required("fname"),"dummy")	  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("remove","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b.1", catalog:"dummy"};

						
	sb.execute("remove", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(10);	
		test.done();		
		
	});	
		
		
}


exports["api.remote.remove: valid params, non existing array index, explicit catalog, db async"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{c:1,b:3}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b,3);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								
								//will not execute								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs",system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_pre("remove","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("remove","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("remove","param_fname",sb.constraints.is_required("fname"),"dummy")	  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("remove","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b.1", catalog:"dummy"};

						
	sb.execute("remove", params, function(err,result){
						
						
		test.deepEqual(err,{code:-9, message: "Not exists: #dummy/50187f71556efcbb25000001:a.b.1"});		
		test.equal(result,null);	
		test.expect(6);	
		test.done();		
		
	});		
		
}
