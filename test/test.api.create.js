var sandbox = require("sandboxed-module");


exports["api.remote.create: missing params"] = function(test){
				
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								
								//this function is not reached
								//save document
								doc._id = "50187f71556efcbb25000002";
								ret_handler(null,doc);	
							}
						 }					 
		}
	});
	
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//this function is not reached because no wid is provided								
								if(col_str == "users"){
									
									test.equal(col_str,"users");																	
									ret_handler(null,{_id:73472834, name:"enric"});	
								}								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{system_catalogs:["timers","events"],default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"));
		
	//uid missing
	var params = {miss_uid:620793114, doc:{test:"test doc 1"}};
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "uid parameter required"});
		
	});
		
	
	//doc missing
	params = {uid:620793114, miss_doc:{test:"test doc 2"}};
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "doc parameter required"});
		test.expect(5);
		test.done();
	}); 		
	
}


exports["api.remote.create: invalid params: catalog=='events'"] = function(test){
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								
								//this function is not reached
								//save document
								doc._id = "50187f71556efcbb25000002";
								ret_handler(null,doc);	
							}
						 }					 
		}
	});
	
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//this function is not reached because no wid is provided								
								if(col_str == "users"){
									
									test.equal(col_str,"users");																
									ret_handler(null,{_id:73472834, name:"enric"});	
								}							
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1}, db:{system_catalogs:["timers","events"],default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"),"events")
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"),"events")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"events");
	  
		
	//uid missing
	var params = {uid:620793114, doc:{test:"test doc 1"}, catalog:"events"};
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-5, message: "No access permission: restricted catalog"});
		test.expect(3);
		test.done();
	});
				 		
				
}

exports["api.remote.create: invalid params: doc!=object"] = function(test){
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																								
								//First time not reached, second time executed twice.
								//save document															
								if(col_str == "docs"){					
									test.equal(col_str,"docs");			
									doc._id = "50187f71556efcbb25000002";
									//ret_handler(null, doc);	
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{ _id: 73472834,name: 'enric',wids: [ '50187f71556efcbb25000002' ] });																		
								}								
										
								ret_handler(null,doc);	
							}
						 }					 
		}
	});
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								if(col_str == "users"){
									ret_handler(null,{_id:73472834, name:"enric",wids:[]});
								}								
																
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox doesn't save document
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1}, db:{system_catalogs:["timers","events"],default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"users")
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"));	  			
		
	
	//doc wrong type
	
	var params = {uid:620793114, doc:6};
	sb.execute("create", params, function(err,result){
				
		test.ok(flag);		
		test.deepEqual(err, {code:-11, message:"Wrong parameter type: doc not object" });		
		
	});
	
	var params2 = {uid:620793114, doc:{test:1}};
	sb.execute("create", params2, function(err,result){
		
			
		test.ok(flag);		
		test.equal(err, null);
		test.expect(7);
		test.done();
		
	});
	
	
	
				
}




exports["api.remote.create: valid params, non init rcpts, default catalog"] = function(test){
		
	var params = {uid:620793114, doc:{test:"test"}};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "docs"){
									test.equal( col_str, "docs" );								
									test.equal( doc.test, params.doc.test );
									test.equal( doc.uid, params.uid );
									
									//because init.rcpts is null the initial rcpts list is [uid]
									test.deepEqual( doc.rcpts, [params.uid]);
									
									test.notEqual(doc.ctime, undefined);
									test.equal(typeof doc.ctime, "number");	
									test.equal(doc.catalog,"docs");
									
									doc._id = "50187f71556efcbb25000002";										
									//save doc to db...
									
									ret_handler(null,doc);
								}else if(col_str == "users"){
									
									test.equal(col_str, "users");
									test.deepEqual(doc,{_id:73472834, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
																								
							}
						 }					 
		}
	});
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//only called for users								
								if(col_str == "users"){
									test.equal(col_str, "users");
									ret_handler(null,{_id:73472834, name:"enric",wids:[]});
								}								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"))
	  .add_plugin("create",sb.plugins.notifying_doc);
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(13);
		test.done();			
	});
		
}


exports["api.remote.create: valid params, non init rcpts, explicit catalog"] = function(test){
	
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "dummy"){
								test.equal( col_str, "dummy" );								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								
								//because init.rcpts is null the initial rcpts list is [uid]
								test.equal( doc.rcpts, undefined);
								
								test.notEqual(doc.ctime, undefined);
								test.equal(typeof doc.ctime, "number");	
								test.equal(doc.catalog,"dummy");
								
								doc._id = "50187f71556efcbb25000002";										
								//save doc to db...
								
								ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:73472834, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
																								
							}
						 }					 
		}
	});
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								if(col_str == "users"){
									test.equal(col_str, "users");
									ret_handler(null,{_id:73472834, name:"enric",wids:[]});
								}							
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1}, db:{system_catalogs:["timers","events"],default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"),"dummy")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"),"dummy");
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(13);
		test.done();			
	});	    
	
				
}

exports["api.remote.create: valid params, non init rcpts, explicit catalog, notifiable true"] = function(test){
	
		
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy",notifiable:1};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "dummy"){
									test.equal( col_str, "dummy" );								
									test.equal( doc.test, params.doc.test );
									test.equal( doc.uid, params.uid );
																	
									test.deepEqual( doc.rcpts, [620793114, 620793115]);
									
									test.notEqual(doc.ctime, undefined);
									test.equal(typeof doc.ctime, "number");	
									test.equal(doc.catalog,"dummy");
									
									doc._id = "50187f71556efcbb25000002";										
									//save doc to db...
									
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:73472834, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
																								
							}
						 }					 
		}
	});
		
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								if(col_str == "users"){
									test.equal(col_str, "users");
									ret_handler(null,{_id:73472834, name:"enric",wids:[]});
								}								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"),"dummy")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"),"dummy")
	  .add_plugin("create",function(ctx,end_handler){
	  		
	  		ctx.params.rcpts = [ctx.params.uid, 620793115];
	  		end_handler();
	  });
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(13);
		test.done();			
	});
	
					
}

exports["api.remote.create: valid params, non init rcpts, default catalog, notifiable false"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"},notifiable:0};
	var ircpts = [620793115];
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "docs"){
									test.equal( col_str, "docs" );								
									test.equal( doc.test, params.doc.test );
									test.equal( doc.uid, params.uid );
																	
									test.equal( doc.rcpts, undefined);
									
									test.notEqual(doc.ctime, undefined);
									test.equal(typeof doc.ctime, "number");	
									test.equal(doc.catalog,"docs");
									
									doc._id = "50187f71556efcbb25000002";										
									//save doc to db...
									
									ret_handler(null,doc);
								}else if( col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:73472834, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
																								
							}
						 }					 
		}
	});
		
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								if(col_str == "users"){
									test.equal(col_str, "users");
									ret_handler(null,{_id:73472834, name:"enric",wids:[]});
								}								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"))
	  .add_plugin("create", sb.plugins.notifying_doc);
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(13);
		test.done();			
	});
				
}


exports["api.remote.create: valid params, non init rcpts, added catalog"] = function(test){
		
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "dummy"){
									test.equal( col_str, "dummy" );								
									test.equal( doc.test, params.doc.test );
									test.equal( doc.uid, params.uid );
									
									//because init.rcpts is null the initial rcpts list is [uid]
									test.deepEqual( doc.rcpts, [620793114]);
									
									test.notEqual(doc.ctime, undefined);
									test.equal(typeof doc.ctime, "number");	
									test.equal(doc.catalog,"dummy");
									
									doc._id = "50187f71556efcbb25000002";										
									//save doc to db...
									
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:73472834, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
																								
							}
						 }					 
		}
	});	
		
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								if(col_str == "users"){
									test.equal(col_str, "users");
									ret_handler(null,{_id:73472834, name:"enric",wids:[]});
								}							
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs",system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"),"dummy")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"),"dummy")
	  .add_plugin("create", sb.plugins.notifying_catalog("dummy"));
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);				
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(13);
		test.done();			
	});	
	
			
}


exports["api.remote.create: valid params, init rcpts async, added catalog, ev_api_create triggered"] = function(test){
			
		
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "dummy"){
									test.equal( col_str, "dummy" );								
									test.equal( doc.test, params.doc.test );
									test.equal( doc.uid, params.uid );
									
									//because init.rcpts is null the initial rcpts list is [uid]
									test.deepEqual( doc.rcpts, [620793114,620793115]);
									
									test.notEqual(doc.ctime, undefined);
									test.equal(typeof doc.ctime, "number");	
									test.equal(doc.catalog,"dummy");
									
									doc._id = "50187f71556efcbb25000002";										
									//save doc to db...
									
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:73472834, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
																								
							}
						 }					 
		}
	});			
	
	api.on("ev_api_create", function(msg){
				
		test.equal(msg.ev_type,"ev_api_create");
		test.notEqual(msg.ev_tstamp,undefined);
		test.notEqual(msg.ev_ctx,undefined);		
		
	});			
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								if(col_str == "users"){
									test.equal(col_str, "users");
									ret_handler(null,{_id:73472834, name:"enric",wids:[]});
								}						
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"),"dummy")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("create","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"),"dummy")
	  .add_plugin("create",sb.plugins.notifying_catalog("dummy"))
	  .add_plugin("create",function(ctx,end_handler){
	  		
	  		ctx.params.rcpts.push(620793115);
	  		setTimeout(end_handler,500);
	  });
	  	  		   
				
	sb.execute("create",params, function(err,val){
			
		test.ok(flag);				
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(16);		
		test.done();			
	});
		
}
