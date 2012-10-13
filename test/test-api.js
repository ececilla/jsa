var sandbox = require("sandboxed-module");
var async = require("async");
	

exports["module exported functions"] = function(test){
		
	var api = require("../lib/api");
		
	test.notEqual(api.remote,undefined);
	test.notEqual(api.remote.create,undefined);
	test.notEqual(api.remote.dispose,undefined);
	test.notEqual(api.remote.join,undefined);
	test.notEqual(api.remote.add,undefined);
	test.notEqual(api.remote.remove,undefined);
	test.notEqual(api.remote.set,undefined);
	test.notEqual(api.remote.push,undefined);
	test.notEqual(api.remote.pop,undefined);
	test.notEqual(api.remote.shift,undefined);
	test.notEqual(api.remote.ack,undefined);
	
	test.notEqual(api.on,undefined);
	test.equal(api.rcpts, null);
	
	test.expect(13);
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
							}
						 },
					"./api":api	 
		}
	});
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"));
		
	//uid missing
	var params = {miss_uid:620793114, doc:{test:"test doc 1"}};
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message: "uid parameter required"});
		
	});
		
	
	//doc missing
	params = {uid:620793114, miss_doc:{test:"test doc 2"}};
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message: "doc parameter required"});
		test.expect(4);
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
							}
						 },
					"./api":api	 
		}
	});
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint("create","user_catalog",sb.constraints.user_catalog);
	  
		
	//uid missing
	var params = {uid:620793114, doc:{test:"test doc 1"}, catalog:"events"};
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-2, message: "No access permission: system catalog"});
		test.expect(2);
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
							}
						 },
					"./api":api	 
		}
	});
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint("create","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("create","param_type",sb.constraints.param_type("doc","object"));	  			
		
	
	//doc wrong type
	
	var params = {uid:620793114, doc:6};
	sb.execute("create", params, function(err,result){
				
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message:"Wrong parameter type: doc not object" });		
		
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
							}
						 },
					"./api":api	 
		}
	});
	
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint("create","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("create","param_type",sb.constraints.param_type("doc","object"));
	  	  		   
				
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
							}
						 },
					"./api":api	 
		}
	});
	
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint("create","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("create","param_type",sb.constraints.param_type("doc","object"));
	  	  		   
				
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
	var ircpts = [620793115];
	
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
	
	api.rcpts = function(doc,ret_handler){
		
		test.notEqual(doc,undefined);		
		ret_handler(ircpts);
	};
	
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
							}
						 },
					"./api":api	 
		}
	});
	
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint("create","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("create","param_type",sb.constraints.param_type("doc","object"));
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(11);
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
	
	var flag2 = 1;
	api.rcpts = function(doc,ret_handler){
		
		flag2 = 0;	
			
		ret_handler(ircpts);
	};
	
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
							}
						 },
					"./api":api	 
		}
	});
	
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint("create","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("create","param_type",sb.constraints.param_type("doc","object"));
	  	  		   
				
	sb.execute("create",params, function(err,val){
				
		test.ok(flag);
		test.ok(flag2);		
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(11);
		test.done();			
	});
				
}


exports["api.remote.create: valid params, non init.rcpts, explicit&added catalog"] = function(test){
		
	
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
	
	api.config.add_create_handler(function(params){
		
		return params.catalog == "dummy";
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
							}
						 },
					"./api":api	 
		}
	});
	
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint("create","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("create","param_type",sb.constraints.param_type("doc","object"));
	  	  		   
				
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
	
	api.rcpts = function(doc,ret_handler){
			
			test.notEqual(doc,undefined);							
			setTimeout(function(){ret_handler([620793115])},500);
			
	};
	
	api.config.add_create_handler(function(params){
		
		return params.catalog == "dummy";
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
							}
						 },
					"./api":api	 
		}
	});
	
	sb.add_constraint("create","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("create","param_doc",sb.constraints.is_required("doc"))
	  .add_constraint("create","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("create","param_type",sb.constraints.param_type("doc","object"));
	  	  		   
				
	sb.execute("create",params, function(err,val){
			
		test.ok(flag);				
		test.equal(err,null);
		test.notEqual(val,null);
		test.expect(14);		
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
							}
						 } 
		}
	});
	sb.add_constraint("dispose","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("dispose","param_uid",sb.constraints.is_required("uid"));
		
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("dispose", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message: "uid parameter required"});
		
	});
		
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002"};
	sb.execute("dispose", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message: "wid parameter required"});
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
							}
						 } 
		}
	});
	sb.add_constraint("dispose","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("dispose","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("dispose","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("dispose","is_owner",sb.constraints.is_owner);		
	
	//wid not found
	var params = {uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("dispose", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-7, message: "Document not found: #docs/50187f71556efcbb25000002"});		
		
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
							}
						 },
				 "./api":api 
		}
	});
	
	sb.add_constraint("dispose","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("dispose","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("dispose","usercatalog",sb.constraints.user_catalog)
	  .add_constraint("dispose","is_owner",sb.constraints.is_owner);		
	
		
	sb.execute("dispose", params, function(err,result){
		
		test.ok(flag);		
		test.equal(result, 1);
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
							}
						 } 
		}
	});
	sb.add_constraint("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("join","param_uid",sb.constraints.is_required("uid"));
		
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("join", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message: "uid parameter required"});
		
	});
		
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002"};
	sb.execute("join", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message: "wid parameter required"});
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
															
								test.equal(col_str,"docs");
								test.deepEqual(doc.rcpts, [620793115, 620793117, 620793114]);
																
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,doc);
								},100);	
							}
		}}
	});
	
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
							}
						 },
				 "./api" : api		  
		}
	});
	
	sb.add_constraint("join","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("join","is_joinable",sb.constraints.is_joinable)	
	  .add_constraint("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("join","param_uid",sb.constraints.is_required("uid"));
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001"};//uid not in rcpts
	async.series(
		[function(next){
						
			sb.execute("join", params, function(err,result){
								
				test.ok(flag);				
				test.equal(err,null);		
				test.deepEqual(result.doc.rcpts, [620793115, 620793117, 620793114]);
				test.equal(result.doc._id, undefined);		
				test.equal(result.doc.wid, "50187f71556efcbb25000001");
				test.equal(result.doc.catalog, "docs");		
				test.equal(result.doc.a,1);
				test.equal(result.doc.b,"test1234");		
				next();		
				
			});
			
		},function(next){
			params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid in rcpts
						
			sb.execute("join", params, function(err,result){
								
				test.ok(flag);	
				test.equal(err,null);		
				test.equal(result,1);
				
				test.expect(17);
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
							}
						 }		  
		}
	});
	
	sb.add_constraint("join","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("join","is_joinable",sb.constraints.is_joinable)	
	  .add_constraint("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("join","param_uid",sb.constraints.is_required("uid"));
		
	
	var params = {uid:620793118, wid:"50187f71556efcbb25000001"};//uid not in rcpts
	
				
	sb.execute("join", params, function(err,result){
											
		test.ok(flag);
		test.deepEqual(err,{code:-2, message:"No access permission: not joinable/unjoinable"});		
		
		test.expect(4);
		test.done();	
		
	});
					
}

exports["api.remote.unjoin: missing params"] = function(test){
	
			
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
							}
						 } 
		}
	});
	
	sb.add_constraint("unjoin","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("unjoin","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("unjoin","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("unjoin","is_joinable",sb.constraints.is_joinable)
	  .add_constraint("unjoin","in_rcpts",sb.constraints.in_rcpts);
	  
		
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("unjoin", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message: "uid parameter required"});
		
	});
		
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002"};
	sb.execute("unjoin", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-4, message: "wid parameter required"});		
	}); 
	
	//not in rcpts
	params = {uid:620793119, wid:"50187f71556efcbb25000002"};
	sb.execute("unjoin", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-2, message:"No access permission: not in rcpts"});
			
	}); 
	
	//doc has no rcpts list
	delete dbdocs["50187f71556efcbb25000002"].rcpts;
	params = {uid:620793119, wid:"50187f71556efcbb25000002"};
	sb.execute("unjoin", params, function(err,result){
		
		
		test.ok(flag);		
		test.deepEqual(err, {code:-2, message:"No access permission: not joinable/unjoinable"});
		
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
								
																															
								test.equal(col_str,"docs");
								test.deepEqual(doc.rcpts,[620793115]);
								
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,doc);
								},20);	
									
							}
						 }				 		  
		}
	});
	
	sb.add_constraint("unjoin","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("unjoin","in_rcpts",sb.constraints.in_rcpts)	
	  .add_constraint("unjoin","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("unjoin","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("unjoin","is_joinable",sb.constraints.is_joinable);
		
	
	var params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid not in rcpts	
				
	sb.execute("unjoin", params, function(err,result){
									
		test.equal(err,null);		
		test.equal(result,1);
		
		test.expect(6);
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
						 }				 		  
		}
	});
	
	sb.add_constraint("unjoin","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("unjoin","in_rcpts",sb.constraints.in_rcpts)	
	  .add_constraint("unjoin","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("unjoin","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("unjoin","is_joinable",sb.constraints.is_joinable);
		
	
	var params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid not in rcpts	
				
	sb.execute("unjoin", params, function(err,result){
									
		
		test.deepEqual(err,{"code":-7,"message":"Document not found: #docs/50187f71556efcbb25000001"});		
		test.equal(result,null);
		
		test.expect(4);
		test.done();		
		
	});	
}



exports["api.remote.add: missing & wrong params"] = function(test){
	
	
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, catalog:"dummy", test:"test",z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								test.equal(col_str,"docs");								
								ret_handler(null,dbdocs[id_str]);								
							}
						 } 
		}
	});
	
	sb.add_constraint("add","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("add","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("add","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("add","param_fname",sb.constraints.is_required("fname"))
	  .add_constraint("add","param_value",sb.constraints.is_required("value"))
	  .add_constraint("add","is_reserved",sb.constraints.is_reserved)
	  .add_constraint("add","not_exists",sb.constraints.field_not_exists)
	  .add_constraint("add","in_rcpts",sb.constraints.in_rcpts);
		
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002", fname:"a", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-4, message: "uid parameter required"});
		
	});
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002", fname:"a", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-4, message: "wid parameter required"});
		
	});
	
	//fname missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", miss_fname:"a", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-4, message: "fname parameter required"});
		
	}); 
	
	//value missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"a", miss_value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-4, message: "value parameter required"});
		
	});
	
	//reserved _id as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"_id", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "Reserved word not allowed as field name: _id"});
		
	});
	
	//reserved uid as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"uid", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "Reserved word not allowed as field name: uid"});
		
	});
	
	//reserved rcpts as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"rcpts", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "Reserved word not allowed as field name: rcpts"});		
		
	});
	
	//field not exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"test", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "Already exists: #docs/50187f71556efcbb25000002[test]"});		
		
	});
	
	//inner field not exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.y", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "Already exists: #docs/50187f71556efcbb25000002[z.y]"});		
		
	});
	
	
	//reserved rcpts as field name
	params = {uid:620793999, wid:"50187f71556efcbb25000002", fname:"a", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-2, message: "No access permission: not in rcpts"});		
		
	});
	
	//wid not found
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"a", value:5};
	sb.execute("add", params, function(err,result){
					
		test.deepEqual(err, {code:-7, message: "Document not found: #docs/50187f71556efcbb25000005"});		
		test.done();
		
	});
		
}


exports["api.remote.add: valid params, non existing field, default catalog, db async"] = function(test){
	
		
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:"test1234", rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"docs");
								test.equal(id_str,"50187f71556efcbb25000001");
								test.equal(dbdocs["50187f71556efcbb25000001"].a, undefined);
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								
								test.equal(doc.a,5);
								test.equal(col_str,"docs");
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								
							}
						 }	  
		}
	});
	
	sb.add_constraint("add","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("add","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("add","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("add","param_fname",sb.constraints.is_required("fname"))
	  .add_constraint("add","param_value",sb.constraints.is_required("value"))
	  .add_constraint("add","is_reserved",sb.constraints.is_reserved)
	  .add_constraint("add","not_exists",sb.constraints.field_not_exists)
	  .add_constraint("add","in_rcpts",sb.constraints.in_rcpts);
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a", value:5};

						
	sb.execute("add", params, function(err,result){
						
						
		test.equal(err,null);		
		test.equal(result,1);	
		test.expect(7);	
		test.done();		
		
	});

		
}


exports["api.remote.add: valid params, non existing inner field, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{c:1}, rcpts:[620793115], uid:620793114};	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							save:function(col_str,doc,ret_handler){
															
								
								test.deepEqual(doc.a,{c:1,b:[4,5]});
								test.equal(col_str,"dummy");
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								
							}
						 }	  
		}
	});
	
	sb.add_constraint("add","user_catalog",sb.constraints.user_catalog)
	  .add_constraint("add","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint("add","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint("add","param_fname",sb.constraints.is_required("fname"))
	  .add_constraint("add","param_value",sb.constraints.is_required("value"))
	  .add_constraint("add","is_reserved",sb.constraints.is_reserved)
	  .add_constraint("add","not_exists",sb.constraints.field_not_exists)
	  .add_constraint("add","in_rcpts",sb.constraints.in_rcpts);
		
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", value:[4,5], catalog:"dummy"}; 	
					
	sb.execute("add", params, function(err,result){
						
						
		test.equal(err,null);		
		test.equal(result,1);	
		test.expect(6);	
		test.done();		
		
	});
		
}


exports["api.remote.remove: missing params"] = function(test){
	
	var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b"};
	
	api.remote.remove(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.remove(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.remove(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	test.done();
}


exports["api.remote.remove: invalid params: wid not hexstr"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"wrongwid", uid:620793114, fname:"b", value:0};
	api.remote.remove(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});				
	
}


exports["api.remote.remove: invalid params, wid.length != 24"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"50187f71556efcbb2500000", uid:620793114, fname:"b", value:[]};
	api.remote.remove(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});					
	
}


exports["api.remote.remove: invalid params, reserved word: _id"] = function(test){
	 
	var api = require("../lib/api");		
		
	var params = {wid:"50187f71556efcbb25000002", uid:620793114, fname:"_id", value:[]};
	api.remote.remove(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Reserved word for field name: _id"});
		test.done();				
	});					
	
}


exports["api.remote.remove: invalid params, reserved word: rcpts"] = function(test){
	
	var api = require("../lib/api");		
		
	var params = {wid:"50187f71556efcbb25000002", uid:620793114, fname:"rcpts", value:[]};
	api.remote.remove(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Reserved word for field name: rcpts"});
		test.done();				
	});					
	
}


exports["api.remote.remove: invalid params, reserved word: uid"] = function(test){
	
	var api = require("../lib/api");		
		
	var params = {wid:"50187f71556efcbb25000002", uid:620793114, fname:"uid", value:[]};
	api.remote.remove(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Reserved word for field name: uid"});
		test.done();				
	});					
	
}


exports["api.remote.remove: valid params, existing field, explicit catalog, db async"] = function(test){
	
var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:2, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for remove procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								
								setTimeout(function(){ //db 500ms delay retrieving document
								
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");
								
								//field fname removed
								test.equal(doc[params.fname], undefined);								
								
								setTimeout(function(){//db 500ms delay saving document
																									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(8);
		test.done();
		
	});
		
		
}

exports["api.remote.remove: valid params, existing inner field, explicit catalog, db async"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{c:1,b:2}, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for remove procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								
								setTimeout(function(){ //db 500ms delay retrieving document
								
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");
								
								//field fname removed
								test.equal(doc.a.b, undefined);
								test.deepEqual(doc.a,{c:1});								
								
								setTimeout(function(){//db 500ms delay saving document
																									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
		
}


exports["api.remote.remove: valid params, existing inner array field, explicit catalog, db async"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", index:1};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{c:1,b:[4,5,6]}, rcpts:[620793114], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for remove procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								
								setTimeout(function(){ //db 500ms delay retrieving document
								
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");
								
								//array index removed								
								test.deepEqual(doc.a.b,[4,6]);								
								
								setTimeout(function(){//db 500ms delay saving document
																									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(8);
		test.done();
		
	});
		
		
}

exports["api.remote.remove: valid params, non existing inner array field, explicit catalog, db async"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", index:1};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{c:1,b:1}, rcpts:[620793114], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for remove procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								
								setTimeout(function(){ //db 500ms delay retrieving document
								
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save: function(){
								 
								 flag = 0;
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.ok(flag);
		test.equal(val,null);
		test.deepEqual(err,{code:-3, message:"Cannot index"});		
		
		test.expect(7);		
		test.done();
		
	});
		
		
}


exports["api.remote.remove: valid params, wid not found"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b"}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:50187f71556efcbb25000001" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}

exports["api.remote.remove: valid params, uid not joined"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793119, fname:"a", value:[]}; //initialize field 'b' to an empty array.
	var dbdocs = {};
				
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because uid not joined
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);		
		test.deepEqual(err,{ code: -3, message: "620793119 has no access @docs:50187f71556efcbb25000001, must join first" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.remove: valid params, nonexisting field"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for remove procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @docs:50187f71556efcbb25000001"})
		test.ok(flag);
		test.expect(7);
		test.done();
	});
				
		
}

exports["api.remote.remove: valid params, nonexisting inner field"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:{c:1}, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for remove procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str].a.b, undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'a.b' not exists @docs:50187f71556efcbb25000001"})
		test.ok(flag);
		test.expect(7);
		test.done();
	});
				
		
}


exports["api.remote.set: missing params"] = function(test){
	
	var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b", value:3};
	
	api.remote.set(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b", value:3};
	api.remote.set(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b", value:3};
	api.remote.set(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	
	//value missing
	params = {wid:"12345", uid:620793114, fname:"b", miss_value:3};
	api.remote.set(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	test.done();
}


exports["api.remote.set: invalid params: wid not hexstr"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"wrongwid", uid:620793114, fname:"b", value:0};
	api.remote.set(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});				
	
}


exports["api.remote.set: invalid params, wid.length != 24"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"50187f71556efcbb2500000", uid:620793114, fname:"b", value:[]};
	api.remote.set(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});					
	
}


exports["api.remote.set: invalid params, reserved word: _id"] = function(test){
	 
	var api = require("../lib/api");		
		
	var params = {wid:"50187f71556efcbb25000002", uid:620793114, fname:"_id", value:[]};
	api.remote.set(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Reserved word for field name: _id"});
		test.done();				
	});					
	
}

exports["api.remote.set: invalid params, reserved word: rcpts"] = function(test){
	
	var api = require("../lib/api");		
		
	var params = {wid:"50187f71556efcbb25000002", uid:620793114, fname:"rcpts", value:[]};
	api.remote.set(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Reserved word for field name: rcpts"});
		test.done();				
	});					
	
}


exports["api.remote.set: invalid params, reserved word: uid"] = function(test){
	
	var api = require("../lib/api");		
		
	var params = {wid:"50187f71556efcbb25000002", uid:620793114, fname:"uid", value:[]};
	api.remote.set(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Reserved word for field name: uid"});
		test.done();				
	});					
	
}


exports["api.remote.set: valid params, existing field, explicit catalog, db async"] = function(test){
	
var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b", value:3, catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:2, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for set procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.equal(dbdocs[id_str][params.fname], 2); //b:2
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname set
								test.equal(doc[params.fname], params.value);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		
	});
	
	test.done();	
		
}


exports["api.remote.set: valid params, existing inner field, explicit catalog, db async"] = function(test){
	
var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", value:3, catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:2,c:1}, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for set procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								test.equal(dbdocs[id_str].a.b, 2); //b:2
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname set
								test.equal(doc.a.b, 3);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		
	});
	
	test.done();	
		
}


exports["api.remote.set: valid params, existing inner array field, explicit catalog, db async"] = function(test){
	
var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", value:66, index:3, catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:[1,2,3],c:1}, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for set procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								test.deepEqual(dbdocs[id_str].a.b, [1,2,3]); //a.b:[1,2,3]
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname set
								test.deepEqual(doc.a.b, [1,2,3,66]);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		
		test.done();
	});
		
		
}

exports["api.remote.set: valid params,non existing inner array field, explicit catalog, db async"] = function(test){
	
var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.c", value:66, index:3, catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:[1,2,3],c:1}, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for set procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
																
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.ok(flag);
		test.equal(val,null);
		test.deepEqual(err,{code:-3,message:"Cannot index"});
		
		test.expect(6);
		test.done();
		
	});
		
		
}


exports["api.remote.set: valid params, wid not found"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:50187f71556efcbb25000001" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}

exports["api.remote.set: valid params, uid not joined"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793119, fname:"a", value:[]}; //initialize field 'b' to an empty array.
	var dbdocs = {};
				
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because uid not joined
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);		
		test.deepEqual(err,{ code: -3, message: "620793119 has no access @docs:50187f71556efcbb25000001, must join first" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.set: valid params, non existing field"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b", value:3};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for set procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @docs:50187f71556efcbb25000001"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
				
}

exports["api.remote.set: valid params, non existing inner field"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.z", value:3};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:{b:1,c:2}, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for set procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str].a.z, undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'a.z' not exists @docs:50187f71556efcbb25000001"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
				
}


exports["api.remote.push: missing params"] = function(test){
	
var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b", value:5 };
	
	api.remote.push(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b", value:5};
	api.remote.push(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b", value:5};
	api.remote.push(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	
	//value missing
	params = {wid:"12345", uid:620793114, fname:"b", miss_value:5};
	api.remote.push(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	
	test.done();	
	
}


exports["api.remote.push: invalid params: wid not hexstr"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"wrongwid", uid:620793114, fname:"b", value:0};
	api.remote.push(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});				
	
}


exports["api.remote.push: invalid params, wid.length != 24"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"50187f71556efcbb2500000", uid:620793114, fname:"b", value:[]};
	api.remote.push(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});					
	
}



exports["api.remote.push: valid params, existing field as array, explicit catalog, db async"] = function(test){
	

	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b", value:5, catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:[1,2,3,4], rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.deepEqual(dbdocs[id_str][params.fname], [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to decrement
								test.deepEqual(doc[params.fname], [1,2,3,4,5]);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
	
}

exports["api.remote.push: valid params, existing inner field as array, explicit catalog, db async"] = function(test){
	

	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", value:5, catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:[1,2,3,4],c:1}, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								test.deepEqual(dbdocs[id_str].a.b, [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to decrement
								test.deepEqual(doc.a.b, [1,2,3,4,5]);
								test.deepEqual(doc.a,{b:[1,2,3,4,5],c:1});								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(10);
		test.done();
		
	});
		
	
}


exports["api.remote.push: valid params, existing field as nonarray"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b", value:5};
	var dbdocs = {};
		
		//document WITH b non-array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"this is not an array", rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.notEqual(typeof dbdocs[id_str][params.fname], "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'b' not an array"});
		test.expect(7);
		test.done();
		
	});
	
	
}

exports["api.remote.push: valid params, existing inner field as nonarray"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", value:5};
	var dbdocs = {};
		
		//document WITH a.b non-array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:"this is not an array",c:1}, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								test.notEqual(typeof dbdocs[id_str].a.b, "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'a.b' not an array"});
		test.expect(7);
		test.done();
		
	});
	
	
}

exports["api.remote.push: valid params, wid not found"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:[1], rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:50187f71556efcbb25000001" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}

exports["api.remote.push: valid params, uid not joined"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793119, fname:"a", value:0}; //initialize field 'b' to an empty array.
	var dbdocs = {};
				
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1], rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because uid not joined
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);		
		test.deepEqual(err,{ code: -3, message: "620793119 has no access @docs:50187f71556efcbb25000001, must join first" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.push: valid params, non existing field"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b", value:5};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field.
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @docs:50187f71556efcbb25000001"});
		test.ok(flag);
		test.expect(7);
		test.done();
	});			
		
}

exports["api.remote.push: valid params, non existing inner field"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", value:5};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:{c:1}, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str].a.b, undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field.
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'a.b' not exists @docs:50187f71556efcbb25000001"});
		test.ok(flag);
		test.expect(7);
		test.done();
	});			
		
}


exports["api.remote.pop: missing params"] = function(test){
	
var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b"};
	
	api.remote.pop(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.pop(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.pop(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
		
	
	test.done();	
	
	
}


exports["api.remote.pop: invalid params: wid not hexstr"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"wrongwid", uid:620793114, fname:"b", value:0};
	api.remote.pop(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});				
	
}


exports["api.remote.pop: invalid params, wid.length != 24"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"50187f71556efcbb2500000", uid:620793114, fname:"b", value:[]};
	api.remote.pop(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});					
	
}



exports["api.remote.pop: valid params, existing field as array, explicit catalog, db async"] = function(test){
	

	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b", catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:[1,2,3,4], rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.deepEqual(dbdocs[id_str][params.fname], [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to pop
								test.deepEqual(doc[params.fname], [1,2,3]);								
																								
								setTimeout(function(){//db 500ms saving document
									
									ret_handler(null,doc);
								},500);
									
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
	
}

exports["api.remote.pop: valid params, existing inner field as array, explicit catalog, db async"] = function(test){
	

	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:[1,2,3,4],c:1}, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								test.deepEqual(dbdocs[id_str].a.b, [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to pop
								test.deepEqual(doc.a.b, [1,2,3]);
								test.deepEqual(doc.a, {b:[1,2,3],c:1} );								
																								
								setTimeout(function(){//db 500ms saving document
									
									ret_handler(null,doc);
								},500);
									
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(10);
		test.done();
		
	});
		
	
}

exports["api.remote.pop: valid params, existing field as nonarray"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITH b non-array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"this is not an array", rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.notEqual(typeof dbdocs[id_str][params.fname], "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because field not array
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'b' not an array"});
		test.ok(flag);
		test.expect(8);
		test.done();
		
	});
		
		
}

exports["api.remote.pop: valid params, existing inner field as nonarray"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b"};
	var dbdocs = {};
		
		//document WITH b non-array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:"this is not an array"}, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								test.notEqual(typeof dbdocs[id_str].a.b, "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because field not array
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'a.b' not an array"});
		test.ok(flag);
		test.expect(8);
		test.done();
		
	});
		
		
}


exports["api.remote.pop: valid params, wid not found"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:[1], rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:50187f71556efcbb25000001" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}

exports["api.remote.pop: valid params, uid not joined"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793119, fname:"a", value:0}; //initialize field 'b' to an empty array.
	var dbdocs = {};
				
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1], rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because uid not joined
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);		
		test.deepEqual(err,{ code: -3, message: "620793119 has no access @docs:50187f71556efcbb25000001, must join first" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.pop: valid params, non existing field"] = function(test){
	

	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @docs:50187f71556efcbb25000001"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
			
	
}

exports["api.remote.pop: valid params, non existing inner field"] = function(test){
	

	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:{c:1}, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str].a.b, undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'a.b' not exists @docs:50187f71556efcbb25000001"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
			
	
}



exports["api.remote.shift: missing params"] = function(test){
	
var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b"};
	
	api.remote.shift(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.shift(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.shift(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
		
	
	test.done();
	
}


exports["api.remote.shift: invalid params: wid not hexstr"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"wrongwid", uid:620793114, fname:"b", value:0};
	api.remote.shift(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});				
	
}


exports["api.remote.shift: invalid params, wid.length != 24"] = function(test){
	
	var api = require("../lib/api");		
	
	//wid missing
	var params = {wid:"50187f71556efcbb2500000", uid:620793114, fname:"b", value:[]};
	api.remote.shift(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,undefined);
		test.deepEqual(err,{code:-2, message:"Identifier wid has wrong type"});
		test.done();				
	});					
	
}


exports["api.remote.shift: valid params, existing field as array, explicit catalog, db async"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b", catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:[1,2,3,4], rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.deepEqual(dbdocs[id_str][params.fname], [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to shift
								test.deepEqual(doc[params.fname], [2,3,4]);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.shift(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
	
}

exports["api.remote.shift: valid params, existing inner field as array, explicit catalog, db async"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b", catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:[1,2,3,4],c:1}, rcpts:[620793115], uid:620793114};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								test.deepEqual(dbdocs[id_str].a.b, [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to shift
								test.deepEqual(doc.a.b, [2,3,4]);
								test.deepEqual(doc.a, {b:[2,3,4],c:1});								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.shift(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(10);
		test.done();
		
	});
		
	
}


exports["api.remote.shift: valid params, existing field as nonarray"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITH b non-array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"this is not an array", rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for shift procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.notEqual(typeof dbdocs[id_str][params.fname], "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.shift(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'b' not an array"});
		test.ok(flag);
		test.expect(8);
		test.done();
		
	});
		
	
}

exports["api.remote.shift: valid params, existing inner field as nonarray"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b"};
	var dbdocs = {};
		
		//document WITH b non-array field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:{b:"this is not an array"}, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for shift procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str].a.b, undefined);
								test.notEqual(typeof dbdocs[id_str].a.b, "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.shift(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'a.b' not an array"});
		test.ok(flag);
		test.expect(8);
		test.done();
		
	});
		
	
}


exports["api.remote.shift: valid params, wid not found"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:[1], rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.shift(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:50187f71556efcbb25000001" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}

exports["api.remote.shift: valid params, uid not joined"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793119, fname:"a", value:0}; //initialize field 'b' to an empty array.
	var dbdocs = {};
				
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:[1], rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because uid not joined
							}
		}}
	});
	
	api.remote.shift(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);		
		test.deepEqual(err,{ code: -3, message: "620793119 has no access @docs:50187f71556efcbb25000001, must join first" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.shift: valid params, non existing field"] = function(test){
	
var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for shift procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field
							}
		}}
	});
	
	api.remote.shift(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @docs:50187f71556efcbb25000001"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
				
	
}

exports["api.remote.shift: valid params, non existing inner field"] = function(test){
	
var params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a.b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:{c:1}, rcpts:[620793115], uid:620793114};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for shift procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str].a.b, undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field
							}
		}}
	});
	
	api.remote.shift(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'a.b' not exists @docs:50187f71556efcbb25000001"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
					
}
