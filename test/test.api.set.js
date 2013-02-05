var sandbox = require("sandboxed-module");

exports["api.remote.set: missing & wrong params"] = function(test){
	
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, test:"test", z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000002"]});
								}else
									ret_handler(null,null);								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"))
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"))	  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("set","exists",sb.constraints.field_exists)
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined);
			
			
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002", fname:"test", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uid parameter required"});		
		
	});
	
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002", fname:"test", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
				
	});
	
	
	//fname missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", miss_fname:"test", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "fname parameter required"});
		
	}); 
	
		
	//value missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"test", miss_value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "value parameter required"});
		
	}); 	
	
	//reserved _id as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"_id", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: _id"});
			
	});
	
	//reserved uid as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"uid", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: uid"});
			
	});
	
	//reserved rcpts as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"rcpts", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: rcpts"});		
			
	});
	
	//field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"notexists", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:notexists"});		
			
	});
	
	//inner field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.notexists", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:z.notexists"});		
		
	});
	
	
	//uid must belong to rcpts
	params = {uid:620793999, wid:"50187f71556efcbb25000002", fname:"test", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "No access permission: not joined"});		
		
	});
	
	//wid not found
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"test", value:5};
	sb.execute("set", params, function(err,result){
					
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000005"});		
		test.done();
		
	});
		
}


exports["api.remote.set: valid params, existing field, explicit catalog, db async"] = function(test){

	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:2, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if(col_str == "dummy"){
																															
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.equal(dbdocs["50187f71556efcbb25000001"].b, 2);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000002"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(dbdocs["50187f71556efcbb25000001"].b, 5);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"),"dummy")	
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"),"dummy")  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("set","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"b",value:5, catalog:"dummy"};

						
	sb.execute("set", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(10);	
		test.done();		
		
	});
			
}


exports["api.remote.set: valid params, existing inner field, explicit catalog, db async"] = function(test){
	

	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114,a:{b:2}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.equal(dbdocs["50187f71556efcbb25000001"].a.b, 2);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000002"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(dbdocs["50187f71556efcbb25000001"].a.b, 5);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if( col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"),"dummy")	
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"),"dummy")  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("set","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b",value:5, catalog:"dummy"};

						
	sb.execute("set", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(10);	
		test.done();		
		
	});
		
}


exports["api.remote.set: valid params, existing inner array field, explicit catalog, db async"] = function(test){
	
			
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114,a:{b:[1,2,3],c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [1,2,3]);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000002"]});
								}
								
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [1,5,3]);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if( col_str == "users"){
									test.equal(col_str, "users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("set","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"),"dummy")	
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"),"dummy")  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("set","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b.1",value:5, catalog:"dummy"};

						
	sb.execute("set", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(10);	
		test.done();		
		
	});		
		
}

exports["api.remote.set: valid params, existing inner fields as array, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6],a:"test",c:{d:1}, rcpts:[620793114,620793117], catalog:"dummy"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str, obj, ret_handler){
								
								test.equal(col_str,"dummy");
								test.deepEqual(obj,{_id:"50187f71556efcbb25000001", uid:620793114, b:[0,5,6],a:0,c:{d:0}, rcpts:[620793114,620793117], catalog:"dummy"});
								ret_handler();
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	sb.init();			  	  	  	    	  	  	 		
	
	var params = {catalog:"dummy",wid:"50187f71556efcbb25000001",fname:["b.0","a","c.d"],value:0};

						
	sb.execute("set", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);					
		test.expect(6);	
		test.done();		
		
	});
		
	
}

exports["api.remote.set: valid params,non existing inner array field, explicit catalog, db async"] = function(test){


	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114,a:{b:[1,2,3],c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [1,2,3]);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000002"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								
								//not executed because operation went wrong					
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"),"dummy")	
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"),"dummy")  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("set","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.c.1",value:5, catalog:"dummy"};

						
	sb.execute("set", params, function(err,result){
						
						
		test.deepEqual(err,{code:-9, message:"Not exists: #dummy/50187f71556efcbb25000001:a.c.1"});		
		test.equal(result,null);	
		test.expect(6);	
		test.done();		
		
	});			
		
}
