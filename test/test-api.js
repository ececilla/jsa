var sandbox = require("sandboxed-module");
var async = require("async");
	

exports["module exported functions"] = function(test){
		
	var api = require("../lib/api");
		
	test.notEqual(api.remote,undefined);
	test.notEqual(api.remote.create,undefined);
	test.notEqual(api.remote.dispose,undefined);
	test.notEqual(api.remote.join,undefined);	
	test.notEqual(api.remote.remove,undefined);
	test.notEqual(api.remote.set,undefined);
	test.notEqual(api.remote.push,undefined);
	test.notEqual(api.remote.pop,undefined);
	test.notEqual(api.remote.shift,undefined);
	test.notEqual(api.remote.ack,undefined);
	
	test.notEqual(api.on,undefined);
	test.equal(api.rcpts, null);
	
	test.expect(12);
	test.done();
}

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
	var dbusers = {620793114:{uid:620793114}};
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//this function is not reached because no wid is provided								
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
								
								test.equal(col_str,"users");
								test.deepEqual(criteria,{uid:620793114});								
								ret_handler(null,[dbusers["620793114"]]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
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
		test.expect(6);
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
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
								
								test.equal(col_str,"users");
								test.deepEqual(criteria,{uid:620793114});								
								ret_handler(null,[criteria]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1}, db:{system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_system_catalog",sb.constraints.not_system_catalog);
	  
		
	//uid missing
	var params = {uid:620793114, doc:{test:"test doc 1"}, catalog:"events"};
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-5, message: "No access permission: system catalog"});
		test.expect(4);
		test.done();
	});
				 		
				
}

exports["api.remote.create: invalid params: doc!=object"] = function(test){
	
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
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox doesn't save document
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1}, db:{system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_system_catalog",sb.constraints.not_system_catalog)
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
		test.expect(4);
		test.done();
		
	});
	
	
	
				
}


exports["api.emit:params, no explicit rcpts"] = function(test){
	
	var api = require("../lib/api");				
	var ctx = {params:{foo:1, bar:5}, doc:undefined};
	
	api.on("ev_dummy", function(msg, rcpts){
		
		test.equal(msg.ev_type, "ev_dummy");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(typeof msg.ev_tstamp, "number");
		test.deepEqual(msg.ev_ctx, ctx);
		test.equal(rcpts, undefined);
		test.done();
	});
	
	api.emit("ev_dummy", ctx);
				
}


exports["api.emit:params, explicit rcpts"] = function(test){
	
	var api = require("../lib/api");			
	var ctx = {params:{foo:1, bar:5}, doc:undefined};
	var emit_rcpts = [1,2,3];
	
	api.on("ev_foo", function(msg, rcpts){
		
		test.equal(msg.ev_type, "ev_foo");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(typeof msg.ev_tstamp, "number");
		test.deepEqual(msg.ev_ctx, ctx);
		test.deepEqual(rcpts, emit_rcpts);
		test.done();
	});
	
	api.emit("ev_foo", ctx, emit_rcpts);
				
}



exports["api.remote.create: valid params, non init.rcpts, default catalog"] = function(test){
		
	var params = {uid:620793114, doc:{test:"test"}};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								
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
																								
							}
						 }					 
		}
	});
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//this function is not reached because no wid is provided								
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"))
	  .add_plugin("create",sb.plugins.notifying_doc);
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(10);
		test.done();			
	});
		
}


exports["api.remote.create: valid params, non init.rcpts, explicit catalog"] = function(test){
	
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								
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
																								
							}
						 }					 
		}
	});
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//this function is not reached because no wid is provided								
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1}, db:{system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"));
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(10);
		test.done();			
	});	    
	
				
}

exports["api.remote.create: valid params, non init.rcpts, explicit catalog, notifiable true"] = function(test){
	
		
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy",notifiable:1};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								
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
																								
							}
						 }					 
		}
	});
		
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//this function is not reached because no wid is provided								
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"))
	  .add_plugin("create",function(ctx,end_handler){
	  		
	  		ctx.params.rcpts = [ctx.params.uid, 620793115];
	  		end_handler();
	  });
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(10);
		test.done();			
	});
	
					
}

exports["api.remote.create: valid params, non init.rcpts, default catalog, notifiable false"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"},notifiable:0};
	var ircpts = [620793115];
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								
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
																								
							}
						 }					 
		}
	});
		
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//this function is not reached because no wid is provided								
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"))
	  .add_plugin("create", sb.plugins.notifying_doc);
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(10);
		test.done();			
	});
				
}


exports["api.remote.create: valid params, non init.rcpts, added catalog"] = function(test){
		
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								
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
																								
							}
						 }					 
		}
	});	
		
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
														
								//this function is not reached because no wid is provided								
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs",system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"))
	  .add_plugin("create", sb.plugins.notifying_catalog("dummy"));
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);				
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(10);
		test.done();			
	});	
	
			
}


exports["api.remote.create: valid params, init.rcpts async, added catalog, ev_api_create triggered"] = function(test){
			
		
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{							
							save:function(col_str,doc,ret_handler){
																
								
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
														
								//this function is not reached because no wid is provided								
								ret_handler(null,null);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because sandbox not saves document.
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{create:1}}}}	 
		}
	});
	
	sb.add_constraint_post("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint_post("create","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("create","param_type",sb.constraints.param_type("doc","object"))
	  .add_plugin("create",sb.plugins.notifying_catalog("dummy"))
	  .add_plugin("create",function(ctx,end_handler){
	  		
	  		ctx.params.rcpts.push(620793115);
	  		setTimeout(end_handler,500);
	  });
	  	  		   
				
	sb.execute("create",params, function(err,val){
			
		test.ok(flag);				
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(13);		
		test.done();			
	});
		
}


//dispose tests
exports["api.remote.dispose: missing params"] = function(test){
		
	
	var flag = 1;
	var doc = {_id:"50187f71556efcbb25000002",uid:620793114,ctime:1350094951092,catalog:"dummy",test:"test"};
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
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
							select: function(col_str, id_str, ret_handler){
																														
								ret_handler(null,dbdocs[id_str]);//return doc								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because document not found or constraint not satisfied
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{dispose:1}}}} 
		}
	});
	sb.add_constraint_post("dispose","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("dispose","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("dispose","not_system_catalog",sb.constraints.not_system_catalog)
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
		test.expect(4);
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
						 }					 
		}
	});
	
	api.on("ev_api_dispose", function(msg, rcpts){
		
		test.equal( msg.ev_type, "ev_api_dispose");
		test.deepEqual(msg.ev_ctx.params,{wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"} );
		
	});
	
	var flag = 1;				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str, "docs");
								test.equal(id_str,"50187f71556efcbb25000001");
								
								ret_handler(null,dbdocs[id_str]);//return doc								
							},
							save:function(col_str,doc,ret_handler){
															
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
				 "./api":api,
				 "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{dispose:1}}}} 
		}
	});
	
	sb.add_constraint_post("dispose","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("dispose","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("dispose","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("dispose","is_owner",sb.constraints.is_owner);		
	
		
	sb.execute("dispose", params, function(err,ctx){
		
		test.ok(flag);		
		test.equal(ctx.retval, 1);
		test.expect(8);
		test.done();		
		
	}); 
	
			
}


exports["api.remote.join: missing params"] = function(test){
	
		
	var flag = 1;
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, catalog:"dummy", test:"test", rcpts:[620793114]};
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"docs");
								test.equal(id_str,"50187f71556efcbb25000002");
								ret_handler(null,dbdocs["50187f71556efcbb25000002"]);								
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
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}} 
		}
	});
	sb.add_constraint_post("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("join","param_uid",sb.constraints.is_required("uid"));
		
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("join", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "uid parameter required"});
		
	});
		
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002"};
	sb.execute("join", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
		test.expect(6);
		test.done();
	}); 
	
	
}



exports["api.remote.join: valid params, default catalog, db async"] = function(test){
	
		
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793115, a:1, b:"test1234", rcpts:[620793115,620793117], catalog:"docs"};
		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure							
							save:function(col_str,doc,ret_handler){
								
								if(col_str == "docs"){							
								
									test.equal(col_str,"docs");
									test.deepEqual(doc.rcpts, [620793115, 620793117, 620793114]);
																	
									//save doc to db...returns with _id:12345
									setTimeout(function(){//100ms delay saving document
										
										ret_handler(null,doc);
									},100);	
								}else if(col_str == "users"){
									console.log("usersssssssss");
								}
							}
		}}
	});
	var dbusers = {620793114:{wids:["50187f71556efcbb25000001"]}, 620793117:{wids:[]}};
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"docs");
								test.equal(id_str,"50187f71556efcbb25000001");
								
								ret_handler(null,dbdocs["50187f71556efcbb25000001"]);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because join saves document itself
								flag = 0;
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																								
								test.equal(col_str,"users");
								if(criteria.uid == 620793114)
									test.deepEqual(dbusers["620793114"].wids,["50187f71556efcbb25000001"]);
								else if(criteria.uid == 620793117)
									test.deepEqual(dbusers["620793117"].wids,[]);
																	
								ret_handler(null,[dbusers["" + criteria.uid]]);
							}
						 },
				 "./api" : api,
				 "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{join:1}}}}		  
		}
	});
	
	sb.add_constraint_post("join","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("join","is_joinable",sb.constraints.is_joinable)	
	  .add_constraint_post("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("join","param_uid",sb.constraints.is_required("uid"));
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001"};//uid not in rcpts
	async.series(
		[function(next){
						
			sb.execute("join", params, function(err,ctx){
								
				test.ok(flag);				
				test.equal(err,null);		
				test.deepEqual(ctx.retval.rcpts, [620793115, 620793117, 620793114]);
				test.equal(ctx.retval._id, undefined);		
				test.equal(ctx.retval.wid, "50187f71556efcbb25000001");
				test.equal(ctx.retval.catalog, "docs");		
				test.equal(ctx.retval.a,1);
				test.equal(ctx.retval.b,"test1234");		
				next();		
				
			});
			
		},function(next){
			params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid in rcpts
						
			sb.execute("join", params, function(err,ctx){
								
				test.ok(flag);	
				test.equal(err,null);		
				test.equal(ctx.retval,1);
				
				test.expect(21);
				test.done();
				next();
				
			});
			
		}]);				
		
}



exports["api.remote.join: valid params, no rcpts, explicit catalog"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793115, a:1, b:"test1234", catalog:"docs"};
				
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"docs");
								test.equal(id_str,"50187f71556efcbb25000001");
								
								ret_handler(null,dbdocs["50187f71556efcbb25000001"]);								
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint joinable is not satisfied.
								flag = 0;								
								ret_handler();	
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[criteria]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{join:1}}}}		  
		}
	});
	
	sb.add_constraint_post("join","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("join","is_joinable",sb.constraints.is_joinable)	
	  .add_constraint_post("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("join","param_uid",sb.constraints.is_required("uid"));
		
	
	var params = {uid:620793118, wid:"50187f71556efcbb25000001"};//uid not in rcpts
	
				
	sb.execute("join", params, function(err,result){
											
		test.ok(flag);
		test.deepEqual(err,{code:-7, message:"No access permission: not joinable/unjoinable"});		
		
		test.expect(4);
		test.done();	
		
	});
					
}

exports["api.remote.unjoin: missing & wrong params"] = function(test){
	
			
	var flag = 1;
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, catalog:"dummy", test:"test", rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								test.equal(col_str,"docs");
								test.equal(id_str,"50187f71556efcbb25000002");
								ret_handler(null,dbdocs["50187f71556efcbb25000002"]);								
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
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{unjoin:1}}}} 
		}
	});
	
	sb.add_constraint_post("unjoin","not_system_catalog",sb.constraints.not_system_catalog)
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
		
		test.expect(14);
		test.done();
	});			
	
}



exports["api.remote.unjoin: valid params, uid in rcpts, default catalog, db async"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793115, a:1, b:"test1234", rcpts:[620793115,620793117], catalog:"docs"};
				
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"docs");
								test.equal(id_str,"50187f71556efcbb25000001");
								
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},10);									
																
							},
							save:function(col_str,doc,ret_handler){
								
								if(col_str == "docs"){	//autosaving doc.																						
									test.equal(col_str,"docs");
									test.deepEqual(doc.rcpts,[620793115]);
									
									setTimeout(function(){//100ms delay saving document
										
										ret_handler(null,doc);
									},20);	
								}else if(col_str == "users"){ //autosaving user.
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{wids:[]});
									ret_handler(null,doc);
								}
									
							},
							criteria:function(col_str,criteria,order,ret_handler){
																							
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{unjoin:1}}}}				 		  
		}
	});
	
	sb.add_constraint_post("unjoin","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("unjoin","has_joined",sb.constraints.has_joined)	
	  .add_constraint_post("unjoin","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("unjoin","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("unjoin","is_joinable",sb.constraints.is_joinable);
		
	
	var params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid not in rcpts	
				
	sb.execute("unjoin", params, function(err,ctx){
									
		test.equal(err,null);		
		test.equal(ctx.retval,1);
		
		test.expect(8);
		test.done();		
		
	});				
		
}


exports["api.remote.unjoin: valid params, wid not found"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002", uid:620793115, a:1, b:"test1234", rcpts:[620793115,620793117], catalog:"docs"};
				
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"docs");
								test.equal(id_str,"50187f71556efcbb25000001");
								
								setTimeout(function(){//100ms delay saving documentdoc not found
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},10);									
																
							}							
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{unjoin:1}}}}				 		  
		}
	});
	
	sb.add_constraint_post("unjoin","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("unjoin","has_joined",sb.constraints.has_joined)	
	  .add_constraint_post("unjoin","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("unjoin","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("unjoin","is_joinable",sb.constraints.is_joinable);
		
	
	var params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid not in rcpts	
				
	sb.execute("unjoin", params, function(err,result){
									
		
		test.deepEqual(err,{"code":-1,"message":"Document not found: #docs/50187f71556efcbb25000001"});		
		test.equal(result,null);
		
		test.expect(4);
		test.done();		
		
	});	
}


//remove tests
exports["api.remote.remove: missing & wrong params, anonymous constraints"] = function(test){
	

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, catalog:"docs", test:"test", z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else
									ret_handler(null,null);								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}} 
		}
	});
	
	sb.add_constraint_post("remove","not_system_catalog",sb.constraints.not_system_catalog)
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
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:"test1234", rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.notEqual(dbdocs["50187f71556efcbb25000001"].b, undefined);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
								
									test.equal(col_str,"dummy");
									test.equal(doc.b,undefined);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if( col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}}	  
		}
	});
	
	sb.add_constraint_post("remove","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("remove","param_fname",sb.constraints.is_required("fname"))	  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("remove","exists",sb.constraints.field_exists)
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"b", catalog:"dummy"};

						
	sb.execute("remove", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});
	
					
}

exports["api.remote.remove: valid params, existing inner field, explicit catalog, db async"] = function(test){
					
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{c:1,b:2}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.notEqual(dbdocs["50187f71556efcbb25000001"].a.b, undefined);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
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
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}}	  
		}
	});
	
	sb.add_constraint_post("remove","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("remove","param_fname",sb.constraints.is_required("fname"))	  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("remove","exists",sb.constraints.field_exists)
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b", catalog:"dummy"};

						
	sb.execute("remove", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});	
		
}


exports["api.remote.remove: valid params, existing inner array field, explicit catalog, db async"] = function(test){
		
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{c:1,b:[4,5,6]}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [4,5,6]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
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
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}}	  
		}
	});
	
	sb.add_constraint_post("remove","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("remove","param_fname",sb.constraints.is_required("fname"))	  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("remove","exists",sb.constraints.field_exists)
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b.1", catalog:"dummy"};

						
	sb.execute("remove", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});	
		
		
}


exports["api.remote.remove: valid params, non existing array index, explicit catalog, db async"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{c:1,b:3}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b,3);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								
								//will not execute								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs",system_catalogs:["timers","events"]}},api:{config:{procedures:{remove:1}}}}	  
		}
	});
	
	sb.add_constraint_post("remove","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("remove","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("remove","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("remove","param_fname",sb.constraints.is_required("fname"))	  
	  .add_constraint_post("remove","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("remove","exists",sb.constraints.field_exists)
	  .add_constraint_post("remove","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b.1", catalog:"dummy"};

						
	sb.execute("remove", params, function(err,result){
						
						
		test.deepEqual(err,{code:-9, message: "Not exists: #dummy/50187f71556efcbb25000001:a.b.1"});		
		test.equal(result,null);	
		test.expect(5);	
		test.done();		
		
	});		
		
}


//set test functions.
exports["api.remote.set: missing & wrong params"] = function(test){
	
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, test:"test", z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else
									ret_handler(null,null);								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}} 
		}
	});
	
	sb.add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog)
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
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.equal(dbdocs["50187f71556efcbb25000001"].b, 2);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
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
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	
	sb.add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"))	
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"))  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("set","exists",sb.constraints.field_exists)
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"b",value:5, catalog:"dummy"};

						
	sb.execute("set", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});
			
}


exports["api.remote.set: valid params, existing inner field, explicit catalog, db async"] = function(test){
	

	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114,a:{b:2}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.equal(dbdocs["50187f71556efcbb25000001"].a.b, 2);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
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
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	
	sb.add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"))	
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"))  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("set","exists",sb.constraints.field_exists)
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b",value:5, catalog:"dummy"};

						
	sb.execute("set", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});
		
}


exports["api.remote.set: valid params, existing inner array field, explicit catalog, db async"] = function(test){
	
			
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114,a:{b:[1,2,3],c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [1,2,3]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
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
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	
	sb.add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"))	
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"))  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("set","exists",sb.constraints.field_exists)
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b.1",value:5, catalog:"dummy"};

						
	sb.execute("set", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});		
		
}

exports["api.remote.set: valid params,non existing inner array field, explicit catalog, db async"] = function(test){


	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114,a:{b:[1,2,3],c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [1,2,3]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								
								//not executed because operation went wrong					
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}	  
		}
	});
	
	sb.add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("set","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("set","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("set","param_fname",sb.constraints.is_required("fname"))	
	  .add_constraint_post("set","param_value",sb.constraints.is_required("value"))  
	  .add_constraint_post("set","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("set","exists",sb.constraints.field_exists)
	  .add_constraint_post("set","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.c.1",value:5, catalog:"dummy"};

						
	sb.execute("set", params, function(err,result){
						
						
		test.deepEqual(err,{code:-9, message:"Not exists: #dummy/50187f71556efcbb25000001:a.c.1"});		
		test.equal(result,null);	
		test.expect(5);	
		test.done();		
		
	});			
		
}


//push test functions
exports["api.remote.push: missing & wrong params"] = function(test){
	
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, test:[4,5,6], z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else
									ret_handler(null,null);								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{push:1}}}} 
		}
	});
	
	sb.add_constraint_post("push","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("push","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("push","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("push","param_fname",sb.constraints.is_required("fname"))
	  .add_constraint_post("push","param_value",sb.constraints.is_required("value"))	  
	  .add_constraint_post("push","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("push","exists",sb.constraints.field_exists)
	  .add_constraint_post("push","has_joined",sb.constraints.has_joined)
	  .add_constraint_post("push","field_type",sb.constraints.field_type("array"));
			
			
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002", fname:"test", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uid parameter required"});		
		
	});
	
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002", fname:"test", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
				
	});
	
	
	//fname missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", miss_fname:"test", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "fname parameter required"});
		
	}); 
	
		
	//value missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"test", miss_value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "value parameter required"});
		
	}); 	
	
	//reserved _id as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"_id", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: _id"});
			
	});
	
	//reserved uid as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"uid", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: uid"});
			
	});
	
	//reserved rcpts as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"rcpts", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: rcpts"});		
			
	});
	
	//field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"notexists", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:notexists"});		
			
	});
	
	//inner field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.notexists", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:z.notexists"});		
		
	});
	
	
	//uid must belong to rcpts
	params = {uid:620793999, wid:"50187f71556efcbb25000002", fname:"test", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "No access permission: not joined"});		
		
	});
	
	//document exists
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"test", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000005"});				
		
	});
	
	//field is array
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-10, message: "Wrong type: #docs/50187f71556efcbb25000002:z not array"});				
		
	});
	
	//inner field is array
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.y", value:5};
	sb.execute("push", params, function(err,result){
					
		test.deepEqual(err, {code:-10, message: "Wrong type: #docs/50187f71556efcbb25000002:z.y not array"});		
		test.done();
		
	});
	
}


exports["api.remote.push: valid params, existing field as array, explicit catalog, db async"] = function(test){
	

	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].b, [4,5,6]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].b, [4,5,6,9]);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{push:1}}}}	  
		}
	});
	
	sb.add_constraint_post("push","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("push","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("push","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("push","param_fname",sb.constraints.is_required("fname"))
	  .add_constraint_post("push","param_value",sb.constraints.is_required("value"))	  
	  .add_constraint_post("push","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("push","exists",sb.constraints.field_exists)
	  .add_constraint_post("push","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"b",value:9, catalog:"dummy"};

						
	sb.execute("push", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});	
	
}

exports["api.remote.push: valid params, existing inner field as array, explicit catalog, db async"] = function(test){
	
		
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{b:[4,5,6],c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [4,5,6]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [4,5,6,9]);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if( col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{push:1}}}}	  
		}
	});
	
	sb.add_constraint_post("push","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("push","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("push","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("push","param_fname",sb.constraints.is_required("fname"))
	  .add_constraint_post("push","param_value",sb.constraints.is_required("value"))	  
	  .add_constraint_post("push","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("push","exists",sb.constraints.field_exists)
	  .add_constraint_post("push","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b",value:9, catalog:"dummy"};

						
	sb.execute("push", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});					
	
}


exports["api.remote.pop: missing & wrong params"] = function(test){
	
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, test:[4,5,6], z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else
									ret_handler(null,null);								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{pop:1}}}} 
		}
	});
	
	sb.add_constraint_post("pop","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("pop","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("pop","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("pop","param_fname",sb.constraints.is_required("fname"))	    
	  .add_constraint_post("pop","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("pop","exists",sb.constraints.field_exists)
	  .add_constraint_post("pop","has_joined",sb.constraints.has_joined)
	  .add_constraint_post("pop","field_type",sb.constraints.field_type("array"));
			
			
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uid parameter required"});		
		
	});
	
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
				
	});
	
	
	//fname missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", miss_fname:"test"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "fname parameter required"});
		
	}); 		
	
	//reserved _id as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"_id"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: _id"});
			
	});
	
	//reserved uid as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"uid"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: uid"});
			
	});
	
	//reserved rcpts as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"rcpts"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: rcpts"});		
			
	});
	
	//field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"notexists"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:notexists"});		
			
	});
	
	//inner field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.notexists"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:z.notexists"});		
		
	});
	
	
	//uid must belong to rcpts
	params = {uid:620793999, wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "No access permission: not joined"});		
		
	});
	
	//document exists
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"test"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000005"});				
		
	});
	
	//field is array
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-10, message: "Wrong type: #docs/50187f71556efcbb25000002:z not array"});				
		
	});
	
	//inner field is array
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.y"};
	sb.execute("pop", params, function(err,result){
					
		test.deepEqual(err, {code:-10, message: "Wrong type: #docs/50187f71556efcbb25000002:z.y not array"});		
		test.done();
		
	});
		
}


exports["api.remote.pop: valid params, existing field as array, explicit catalog, db async"] = function(test){
	

	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].b, [4,5,6]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].b, [4,5]);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{pop:1}}}}	  
		}
	});
	
	sb.add_constraint_post("pop","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("pop","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("pop","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("pop","param_fname",sb.constraints.is_required("fname"))	  
	  .add_constraint_post("pop","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("pop","exists",sb.constraints.field_exists)
	  .add_constraint_post("pop","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"b", catalog:"dummy"};

						
	sb.execute("pop", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});
		
}

exports["api.remote.pop: valid params, existing inner field as array, explicit catalog, db async"] = function(test){
	

	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{b:[4,5,6],c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [4,5,6]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [4,5]);								
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,doc);
									},50);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{pop:1}}}}	  
		}
	});
	
	sb.add_constraint_post("pop","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("pop","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("pop","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("pop","param_fname",sb.constraints.is_required("fname"))	  	  
	  .add_constraint_post("pop","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("pop","exists",sb.constraints.field_exists)
	  .add_constraint_post("pop","has_joined",sb.constraints.has_joined)
	  .add_constraint_post("pop","field_type",sb.constraints.field_type("array"));
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b", catalog:"dummy"};

						
	sb.execute("pop", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});	
	
}



exports["api.remote.shift: missing & wrong params"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, test:[4,5,6], z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else
									ret_handler(null,null);								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{shift:1}}}} 
		}
	});
	
	sb.add_constraint_post("shift","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("shift","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("shift","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("shift","param_fname",sb.constraints.is_required("fname"))	    
	  .add_constraint_post("shift","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("shift","exists",sb.constraints.field_exists)
	  .add_constraint_post("shift","has_joined",sb.constraints.has_joined)
	  .add_constraint_post("shift","field_type",sb.constraints.field_type("array"));
			
			
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uid parameter required"});		
		
	});
	
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
				
	});
	
	
	//fname missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", miss_fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "fname parameter required"});
		
	}); 		
	
	//reserved _id as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"_id"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: _id"});
			
	});
	
	//reserved uid as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"uid"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: uid"});
			
	});
	
	//reserved rcpts as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"rcpts"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: rcpts"});		
			
	});
	
	//field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"notexists"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:notexists"});		
			
	});
	
	//inner field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.notexists"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:z.notexists"});		
		
	});
	
	
	//uid must belong to rcpts
	params = {uid:620793999, wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "No access permission: not joined"});		
		
	});
	
	//document exists
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000005"});				
		
	});
	
	//field is array
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-10, message: "Wrong type: #docs/50187f71556efcbb25000002:z not array"});				
		
	});
	
	//inner field is array
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.y"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-10, message: "Wrong type: #docs/50187f71556efcbb25000002:z.y not array"});		
		test.done();
		
	});

	
}


exports["api.remote.shift: valid params, existing field as array, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].b, [4,5,6]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
								test.equal(col_str,"dummy");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].b, [5,6]);								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{shift:1}}}}	  
		}
	});
	
	sb.add_constraint_post("shift","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("shift","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("shift","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("shift","param_fname",sb.constraints.is_required("fname"))	  
	  .add_constraint_post("shift","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("shift","exists",sb.constraints.field_exists)
	  .add_constraint_post("shift","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"b", catalog:"dummy"};

						
	sb.execute("shift", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});
		
	
}

exports["api.remote.shift: valid params, existing inner field as array, explicit catalog, db async"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{b:[4,5,6],c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [4,5,6]);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								
								if(col_str == "dummy"){
								test.equal(col_str,"dummy");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [5,6]);								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{wids:[]});
									ret_handler(null);
								}
								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{shift:1}}}}	  
		}
	});
	
	sb.add_constraint_post("shift","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("shift","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("shift","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("shift","param_fname",sb.constraints.is_required("fname"))	  	  
	  .add_constraint_post("shift","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("shift","exists",sb.constraints.field_exists)
	  .add_constraint_post("shift","has_joined",sb.constraints.has_joined);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b", catalog:"dummy"};

						
	sb.execute("shift", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});	
			
}

exports["api.remote.get: missing & wrong params"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, test:[4,5,6], z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else
									ret_handler(null,null);								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{get:1}}}} 
		}
	});
	
	sb.add_constraint_pre("get","not_system_catalog",sb.constraints.not_system_catalog)	
	  .add_constraint_pre("get","param_wid",sb.constraints.is_required("wid"))	  	  	    	  
	  .add_constraint_post("get","exists",sb.constraints.field_exists);
	  	  							
	//user catalog
	var params = {catalog:"timers", wid:"50187f71556efcbb25000002"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-5, message:"No access permission: system catalog"});
				
	});
	
	//wid missing
	params = {miss_wid:"50187f71556efcbb25000002"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
				
	});
			
			
	//field exists
	params = {wid:"50187f71556efcbb25000002", fname:"notexists"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:notexists"});		
			
	});
	
	//inner field exists
	params = {wid:"50187f71556efcbb25000002", fname:"z.notexists"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:z.notexists"});		
		
	});			
	
	//document exists
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"test"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000005"});				
		test.done();
	});				

	
}


exports["api.remote.get: valid params, existing doc, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"dummy"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{get:1}}}}	  
		}
	});
	
	sb.add_constraint_pre("get","not_system_catalog",sb.constraints.not_system_catalog)	
	  .add_constraint_pre("get","param_wid",sb.constraints.is_required("wid"))	  	  	    	  
	  .add_constraint_post("get","exists",sb.constraints.field_exists)
	  .add_plugin("get","url_transform", sb.plugins.url_transform);
		
	
	var params = {url:"#dummy/50187f71556efcbb25000001"};

						
	sb.execute("get", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.deepEqual(ctx.retval,{wid:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"dummy"});	
		test.expect(4);	
		test.done();		
		
	});
		
	
}

exports["api.remote.get: valid params, existing inner field, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{get:1}}}}	  
		}
	});
	
	sb.add_constraint_pre("get","not_system_catalog",sb.constraints.not_system_catalog)	
	  .add_constraint_pre("get","param_wid",sb.constraints.is_required("wid"))	  	  	    	  
	  .add_constraint_post("get","exists",sb.constraints.field_exists)
	  .add_plugin("get","url_transform", sb.plugins.url_transform);
		
	
	var params = {url:"#dummy/50187f71556efcbb25000001:b"};

						
	sb.execute("get", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.deepEqual(ctx.retval,[4,5,6]);	
		test.expect(4);	
		test.done();		
		
	});
		
	
}

