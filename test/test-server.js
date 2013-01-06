var sandbox = require("sandboxed-module");


exports["module exported functions"] = function(test){
	
	var flag = 0		
	var _ = sandbox.require("../lib/constants");
	
	var api = {	
				remote:{
					remote_func: function(){
										
						flag  = 1;								
					}
				}			 
		};
	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{remote_func:1}}}}										
				}
		
	});
	
	var server = sandbox.require("../lib/server",{
		
			requires:{"./api":api, "./sandbox":sb}
		});
	server.config.app = {status:1};
	
	test.notEqual( server.init, undefined );	
	test.notEqual( server.init.add, undefined );
	test.notEqual( server.settings, undefined );
	test.notEqual( server.start, undefined );
	test.notEqual( server.stop, undefined );
	test.notEqual( server.events.on, undefined );
	test.notEqual( server.events.emit, undefined );	
	test.notEqual( server.api.remote_func, undefined  );	
	test.notEqual( server.api.config, undefined );
	test.notEqual( server.api.config.enable_procedures, undefined );
	test.notEqual( server.api.config.disable_procedures, undefined );
	test.notEqual( server.api.config.newop, undefined );
	test.notEqual( server.api.config.add_plugin, undefined );
	test.notEqual( server.api.config.add_plugout, undefined );	
	test.notEqual( server.api.config.add_constraint_pre, undefined );
	test.notEqual( server.api.config.add_constraint_post, undefined );	
	test.notEqual( server.api.events, undefined );
	test.notEqual( server.api.events.on, undefined );
	test.notEqual( server.api.events.emit, undefined );
		
	test.notEqual( server.eq.events.on, undefined );	
	test.notEqual( server.db, undefined );
	test.notEqual( server.db.select, undefined);
	test.notEqual( server.db.save, undefined);
	test.notEqual( server.db.criteria, undefined);
	test.notEqual( server.db.connect, undefined);
	test.notEqual( server.db.driver, undefined);
	
	test.notEqual( server.rpc, undefined);
	test.notEqual( server.rpc.config, undefined);
	test.notEqual( server.rpc.config.add_plugin, undefined);
	
	test.notEqual( server.config.system, undefined);
	test.notEqual( server.config.add_output_transformer, undefined );
	
	
	//check exported functions can be invoked.
	server.api.remote_func();
	test.ok(flag);
				
	
	server.settings();
	test.notEqual( server.config.app, undefined);
	
	for(key in sb.constraints){
		
		test.equal(server.api.config.constraints[key], sb.constraints[key]);
	}
	
	for(key in sb.plugins){
		
		test.equal(server.api.config.plugins[key], sb.plugins[key]);
	}
	
	test.expect(48);	
	test.done();
}

exports["server.api.config.disable/enable_procedures"] = function(test){
	
	var server = require("../lib/server");
	//default values
	test.ok( server.api.config.procedures.create );
	test.ok( server.api.config.procedures.dispose );
	test.ok( server.api.config.procedures.register );
	test.ok( server.api.config.procedures.join );
	test.ok( server.api.config.procedures.unjoin );	
	test.ok( server.api.config.procedures.remove );
	test.ok( server.api.config.procedures.set );
	test.ok( server.api.config.procedures.push );
	test.ok( server.api.config.procedures.pop );
	test.ok( server.api.config.procedures.shift );	
	
	//disable procedures
	server.api.config.disable_procedures();
	test.equal( server.api.config.procedures.create,0 );
	test.equal( server.api.config.procedures.dispose,0 );
	test.equal( server.api.config.procedures.register,0 );
	test.equal( server.api.config.procedures.join,0 );
	test.equal( server.api.config.procedures.unjoin,0 );	
	test.equal( server.api.config.procedures.remove,0 );
	test.equal( server.api.config.procedures.set,0 );
	test.equal( server.api.config.procedures.push,0 );
	test.equal( server.api.config.procedures.pop,0 );
	test.equal( server.api.config.procedures.shift,0 );	
	
	//enable procedures
	server.api.config.enable_procedures();		
	test.ok( server.api.config.procedures.create );
	test.ok( server.api.config.procedures.dispose );
	test.ok( server.api.config.procedures.register );
	test.ok( server.api.config.procedures.join );
	test.ok( server.api.config.procedures.unjoin );	
	test.ok( server.api.config.procedures.remove );
	test.ok( server.api.config.procedures.set );
	test.ok( server.api.config.procedures.push );
	test.ok( server.api.config.procedures.pop );
	test.ok( server.api.config.procedures.shift );	
	
	test.expect(30);
	test.done();
	
}


exports["server.events.on: custom server events"] = function(test){
	
	var server = require("../lib/server");
	var ctx = {params:{test:1}};
	var rcpts = [1,2,3,4];
	server.events.on("ev_srv_start", function( _ctx, _rcpts){
		
		test.deepEqual(_ctx.ev_data.params, {test:1});
		test.deepEqual(_rcpts,[1,2,3,4]);
		test.done();
	});
	
	server.events.emit("ev_srv_start", ctx, rcpts );	
	
}

exports["server.eq.events.on: custom eq events"] = function(test){
	
	var eq = sandbox.require("../lib/evqueue");
	var server = sandbox.require("../lib/server",{requires:{
							"./evqueue":eq
	}});
	
	
	server.eq.events.on("ev_eq_push", function( params, rcpts){
		
		test.deepEqual( params.ev_data, {test:1} );
		test.deepEqual( rcpts,[1,2,3,4]);
		test.done();
	});
	
	eq.emit("ev_eq_push", {test:1}, [1,2,3,4] );	
	
}

exports["server.api.events.on: custom api events"] = function(test){
	
	var server = require("../lib/server");
	var ctx = {params:{test:1}};	
	var rcpts = [1,2,3,4];
	server.api.events.on("ev_api_dummyop", function( _msg, _rcpts ){
		
		test.deepEqual(_msg.ev_ctx.params, {test:1});
		test.deepEqual(_rcpts,[1,2,3,4]);
		test.done();
	});
	
	server.api.events.emit("ev_api_dummyop", ctx, rcpts );	
	
}

exports["server.api.register: internal api events"] = function(test){
	
	var params = {user:{name:"test", email:"test@test.com"}};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for register procedure
							save:function(col_str, user, ret_handler){
																							
								test.equal(col_str,"users");
								test.equal(user.name,"test");
								test.equal(user.email,"test@test.com");
								test.deepEqual(user.wids,[]);
								test.equal(typeof user.ctime, "number");
								//test.deepEqual(user,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000001"]});
								user._id = "50187f71556efcbb25000001";
								ret_handler(null,user);
									
							}							
		}}
	});	
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
				"./api":api,
				"./db": {
							select: function(col_str, id_str, ret_handler){
								
								//no wid, no uid, so no object is loaded from db
								flag = 0;																																			
							}
					},
				"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{register:1}}}}}
		
	});	
				
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
		
	});
	
	server.config.app = {status:1};
	
	//two ev_api_register handlers.				
	server.api.events
				.on("ev_api_register", function(msg){
							
					test.equal(msg.ev_type,"ev_api_register");					
					test.equal(msg.ev_ctx.params.catalog, "users");
					test.equal(msg.ev_ctx.doc.uid, "50187f71556efcbb25000001");									
					
				})				
				.on("ev_api_register",function(msg){
										
					test.equal(msg.ev_type,"ev_api_register");
					
				});
	
	server.api.register(params, function(err,val){
				
		test.ok(flag);
		test.equal(err,undefined);
		test.notEqual(val, undefined);								
				
		test.expect(12);		
		test.done();
	});
					
	
}


exports["server.api.create: internal api events, default catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "docs"){
									test.equal(col_str,"docs");								
									test.equal( doc.test, "test" );
									test.equal( doc.uid,  620793114);
									test.deepEqual( doc.rcpts, [620793114]);
									test.equal(typeof doc.ctime, "number");								
									
									//save doc to db...returns with _id:12345
									doc._id = "50187f71556efcbb25000001";
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000001"]});
									ret_handler(null);
								}	
							}
							
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
				"./api":api,
				"./db": {
							select: function(col_str, id_str, ret_handler){
																														
								if(col_str == "users"){
																																	
									ret_handler(null,{_id:id_str, name:"enric",wids:[]});	
								}							
							}
					},
				"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}}
		
	});
	sb.add_plugin("create",sb.plugins.notifying_catalog("docs"));
				
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
		
	});
	//"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{test:1}}}}
	server.config.app = {status:1};
	
	//two ev_api_create handlers.				
	server.api.events
				.on("ev_api_create", function(msg){
							
					test.equal(msg.ev_type,"ev_api_create");
					test.equal(msg.ev_ctx.params.uid, 620793114);
					test.equal(msg.ev_ctx.params.catalog, "docs");
					//console.log(msg.ev_ctx.doc);				
				})				
				.on("ev_api_create",function(msg){
										
					test.equal(msg.ev_type,"ev_api_create");
					
				});
	
	server.api.create(params, function(err,val){
				
		test.equal(err,undefined);
		test.notEqual(val, undefined);								
				
		test.expect(13);		
		test.done();
	});
					
	
}

exports["server.api.create: throw error when no ret_handler handles the error"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	
							save:function(col_str,doc,ret_handler){
																
								test.equal(col_str,"docs");								
								test.equal( doc.test, "test" );
								test.equal( doc.uid, 620793114 );
								test.deepEqual( doc.rcpts, [620793114]);
								
								//save doc to db...returns with _id:12345
								ret_handler({message:"some db error"},null);	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./db":{
								select: function(col_str, id_str, ret_handler){
																														
									if(col_str == "users"){
																																		
										ret_handler(null,{_id:id_str, name:"enric",wids:[]});	
									}							
							}
							},
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
						
				}
		
	});
	sb.add_plugin("create",sb.plugins.notifying_catalog("docs"));
				
	var server = sandbox.require("../lib/server",{
		requires:{"./api":api,"./sandbox":sb}
		
	});
	server.config.app = {status:1};
		
	test.throws( function(){server.api.create(params)} );
		
	test.expect(5);	
	test.done();				
	
}



exports["server.api.create: internal events, explicit catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");								
									test.equal( doc.test, "test" );
									test.equal( doc.uid,  620793114);
									test.deepEqual( doc.rcpts, undefined);
									test.equal(typeof doc.ctime, "number");								
									
									//save doc to db...returns with _id:12345
									doc._id = "50187f71556efcbb25000001";
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000001"]});
									ret_handler(null);
								}	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./db":{
								select: function(col_str, id_str, ret_handler){
																														
									if(col_str == "users"){
																																		
										ret_handler(null,{_id:id_str, name:"enric",wids:[]});	
									}							
								}
							},
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
					}
		
	});
				
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
		
	});
	server.config.app = {status:1};
	
	//two ev_api_create handlers.				
	server.api.events
				.on("ev_api_create", function(msg){
							
					test.equal(msg.ev_type,"ev_api_create");
					test.equal(msg.ev_ctx.params.uid, 620793114);
					test.equal(msg.ev_ctx.params.catalog, "dummy");
					//console.log(msg.ev_ctx.doc);				
				})				
				.on("ev_api_create",function(msg){
										
					test.equal(msg.ev_type,"ev_api_create");
					
				});
	
	server.api.create(params, function(err,val){
				
		test.equal(err,undefined);
		test.notEqual(val, undefined);								
				
		test.expect(13);		
		test.done();
	});
						
}


exports["server.api.create: internal events, added catalog"] = function(test){
	
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
								
								if(col_str == "dummy"){								
									test.equal(col_str,"dummy");								
									test.equal( doc.test, "test" );
									test.equal( doc.uid,  620793114);
									test.deepEqual( doc.rcpts, [620793114, 620793115]);
									test.equal(typeof doc.ctime, "number");								
									
									//save doc to db...returns with _id:12345
									doc._id = "50187f71556efcbb25000001";
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000001"]});
									ret_handler(null);
								}	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./db":{
								select: function(col_str, id_str, ret_handler){
																														
									if(col_str == "users"){
																																		
										ret_handler(null,{_id:id_str, name:"enric",wids:[]});	
									}							
								}
							},
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
				}
		
	});
	sb.add_plugin("create",sb.plugins.notifying_catalog("dummy"))
	  .add_plugin("create", function(ctx,end_handler){
	  		
	  		ctx.params.rcpts.push(620793115);
	  		end_handler();
	  });
				
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
		
	});
	server.config.app = {status:1};	
	
	//two ev_api_create handlers.				
	server.api.events
				.on("ev_api_create", function(msg){
							
					test.equal(msg.ev_type,"ev_api_create");
					test.equal(msg.ev_ctx.params.uid, 620793114);
					test.equal(msg.ev_ctx.params.catalog, "dummy");
					//console.log(msg.ev_ctx.doc);				
				})				
				.on("ev_api_create",function(msg){
										
					test.equal(msg.ev_type,"ev_api_create");
					
				});
	
	
	server.api.create(params, function(err,val){
				
		test.equal(err,undefined);
		test.notEqual(val, undefined);								
				
		test.expect(13);		
		test.done();
	});								
	
}


exports["server.api.create: internal events, added catalog, ro db"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	var db = {	
							save:function(col_str, doc ,ret_handler){
								
								if(col_str == "dummy"){								
									test.equal(col_str,"dummy");								
									test.equal( doc.test, "test" );
									test.equal( doc.uid, 620793114 );
									test.deepEqual( doc.rcpts, [620793114,620793115]);
									
									
									//save doc to db...
									doc._id = "50187f71556efcbb25000666";
									dbdocs["50187f71556efcbb25000666"] = doc;
									ret_handler(null,doc);	
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000666"]});
									ret_handler(null);
								}
							},
							
							select:function(col_str, id_str, ret_handler){
																															
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
							
	};
		    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./db":{
								select: function(col_str, id_str, ret_handler){
																														
									if(col_str == "users"){
																																		
										ret_handler(null,{_id:id_str, name:"enric",wids:[]});	
									}							
								}
							},
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
				}
	});	
	sb.add_plugin("create",sb.plugins.notifying_catalog("dummy"))
	  .add_plugin("create", function(ctx,end_handler){
	  			  		
	  		server.db.select("dummy","50187f71556efcbb25000002",function(err,val){
			
				test.equal(val.a,2);			
				ctx.params.rcpts.push(val.uid);				
				end_handler();
			});	  		
	  });		
	
	var server = sandbox.require("../lib/server",{
		requires:{"./api":api,"./db":db,"./sandbox":sb}
		
	});
	server.config.app = {status:1};		
					
	server.api.events.on("ev_api_create", function(msg){
		
		test.equal(msg.ev_type,"ev_api_create");
		test.equal(msg.ev_ctx.params.uid, 620793114);
		test.equal(msg.ev_ctx.params.catalog, "dummy");			
				
	});
	
	server.api.create(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val,undefined);						
				
		test.expect(12);		
		test.done();
	});
					
	
}


exports["server.api.dispose: internal events, default catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793114], uid:620793114},
		dbdocs["5678"] = {_id:"5678",a:2, b:"test5678", rcpts:[620793115], uid:620793115};
	    
	var db = {	//db mock module for create procedure
				removeById:function(col_str, id_str, ret_handler){
													
					test.equal(col_str,"docs");																								
					test.equal( id_str, "50187f71556efcbb25000001");
					
					delete dbdocs["50187f71556efcbb25000001"];
					//save doc to db...returns number of removed objects
					setTimeout(function(){//100ms delay deleting document.
						
						ret_handler(null,1);
					},100);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					if( col_str == "docs"){
						test.equal(col_str, "docs");
						test.equal(id_str, "50187f71556efcbb25000001");
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:[]});
					}
				}
	};
		
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api,"./db":db,"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{dispose:1}}}}}		
	});
				
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
						
	server.api.events.on("ev_api_dispose", function(msg){
		
		test.equal(msg.ev_type,"ev_api_dispose");		
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793114);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "docs");							
									
	});
				
	
	server.api.dispose(params, function(err,ctx){
		
		test.equal(err,undefined);
		test.equal(ctx.retval,1);						
				
		test.expect(11);		
		test.done();
	});
							
}



exports["server.api.join: internal events, default catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114};
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115], uid:620793115, catalog:"docs"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115], uid:620793115, catalog:"docs"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "docs"){
						test.equal(col_str,"docs");																								
						test.deepEqual( doc.rcpts, [620793115, 620793114]);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}else if(col_str == "users"){
						test.equal(col_str,"users");
						test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000001"]});
						ret_handler(null);						
					}
				},
				
				select:function(col_str, id_str, ret_handler){
					
					if( col_str == "docs"){
						test.equal(col_str, "docs");
						test.equal(id_str, "50187f71556efcbb25000001");
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:[]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
						
	server.api.events.on("ev_api_join", function(msg){
		
		test.equal(msg.ev_type,"ev_api_join");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, params.uid);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "docs");					
		test.deepEqual(msg.ev_ctx.doc.rcpts, [620793115,620793114]);							
	});
				
	
	server.api.join(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val,undefined);						
				
		test.expect(14);		
		test.done();
	});
						
}


exports["server.api.unjoin: internal events, default catalog"] = function(test){
	  
	var params = {wid:"50187f71556efcbb25000001", uid:620793116};
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"docs"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"docs"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "docs"){
						test.equal(col_str,"docs");																								
						test.deepEqual( doc.rcpts, [620793115]);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}else if( col_str == "users"){
						
						test.equal(col_str,"users");
						test.deepEqual(doc,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000555"]});
						ret_handler(null);	
					}
				},
				
				select:function(col_str, id_str, ret_handler){
					
					if( col_str == "docs"){
						
						test.equal(col_str, "docs");
						test.equal(id_str, "50187f71556efcbb25000001");
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001","50187f71556efcbb25000555"]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{unjoin:1}}}}}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
						
	server.api.events.on("ev_api_unjoin", function(msg){
		
		test.equal(msg.ev_type,"ev_api_unjoin");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, params.uid);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "docs");					
		test.deepEqual(msg.ev_ctx.doc.rcpts, [620793115]);							
	});
				
	
	server.api.unjoin(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val,undefined);						
				
		test.expect(14);		
		test.done();
	});
						
}


exports["server.api.remove: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"b", catalog:"dummy"};		
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "dummy"){
						test.equal(col_str,"dummy");																								
						test.deepEqual( doc.rcpts, [620793115, 620793116]);
						test.equal(doc.b,undefined);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}else if(col_str == "users"){
						
						test.equal(col_str,"users");
						test.deepEqual(doc,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000001"]});
						ret_handler(null);
					}
				},
				
				select:function(col_str, id_str, ret_handler){
					
					if( col_str == "dummy"){
						test.equal(col_str, "dummy");
						test.equal(id_str, "50187f71556efcbb25000001");
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{remove:1}}}}}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
						
	server.api.events.on("ev_api_remove", function(msg){
		
		test.equal(msg.ev_type,"ev_api_remove");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	});
				
	
	server.api.remove(params, function(err,ctx){
		
		test.equal(err,undefined);
		test.equal(ctx.retval,1);						
				
		test.expect(14);		
		test.done();
	});	
						
}




exports["server.api.set: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", value:5, catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "dummy"){
						test.equal(col_str,"dummy");																								
						test.deepEqual( doc.rcpts, [620793115, 620793116]);
						test.equal(doc.a,5);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}else if(col_str == "users"){
						
						test.equal(col_str,"users");
						test.deepEqual(doc,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000001"]});
						ret_handler(null);
					}
				},
				
				select:function(col_str, id_str, ret_handler){
					
					if( col_str == "dummy"){
						test.equal(col_str, "dummy");
						test.equal(id_str, "50187f71556efcbb25000001");
						test.equal(dbdocs[id_str].a,1);
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1}}}}}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
						
	server.api.events.on("ev_api_set", function(msg){
		
		test.equal(msg.ev_type,"ev_api_set");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	});
				
	
	server.api.set(params, function(err,ctx){
		
		test.equal(err,undefined);
		test.equal(ctx.retval,1);						
				
		test.expect(15);		
		test.done();
	});						
}



exports["server.api.push: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", value:9, catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[4,6], b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "dummy"){
						test.equal(col_str,"dummy");																								
						test.deepEqual( doc.rcpts, [620793115, 620793116]);
						test.deepEqual(doc.a,[4,6,9]);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}else if(col_str == "users"){
						test.equal(col_str,"users");
						test.deepEqual(doc,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000001"]});
						ret_handler(null);
					}
				},
				
				select:function(col_str, id_str, ret_handler){
					
					if( col_str == "dummy"){
						test.equal(col_str, "dummy");
						test.equal(id_str, "50187f71556efcbb25000001");
						test.deepEqual(dbdocs[id_str].a,[4,6]);
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{push:1}}}}}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
	
	var flag = 1;					
	server.api.events.on("ev_api_push", function(msg){
		
		test.equal(msg.ev_type,"ev_api_push");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	}).on("ev_api_set",function(msg){
		
		flag = 0;
	});
				
	
	server.api.push(params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,undefined);
		test.equal(ctx.retval,1);						
				
		test.expect(16);		
		test.done();
	});	
						
}

exports["server.api.pop: internal events, explicit catalog"] = function(test){	
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[-4,"foo",6], b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "dummy"){
						test.equal(col_str,"dummy");																								
						test.deepEqual( doc.rcpts, [620793115, 620793116]);
						test.deepEqual(doc.a,[-4,"foo"]);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}else if(col_str == "users"){
						test.equal(col_str,"users");
						test.deepEqual(doc,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000001"]});
						ret_handler(null);
					}
				},
				
				select:function(col_str, id_str, ret_handler){
					
					if(col_str == "dummy"){
						test.equal(col_str, "dummy");
						test.equal(id_str, "50187f71556efcbb25000001");
						test.deepEqual(dbdocs[id_str].a,[-4,"foo",6]);
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{pop:1}}}}}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
							
	server.api.events.on("ev_api_pop", function(msg){
		
		test.equal(msg.ev_type,"ev_api_pop");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	});
				
	
	server.api.pop(params, function(err,ctx){
				
		test.equal(err,undefined);
		test.equal(ctx.retval,1);						
				
		test.expect(15);		
		test.done();
	});	
						
}


exports["server.api.shift: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[-4,"foo",6], b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "dummy"){
						test.equal(col_str,"dummy");																								
						test.deepEqual( doc.rcpts, [620793115, 620793116]);
						test.deepEqual(doc.a,["foo",6]);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}else if(col_str == "users"){
						test.equal(col_str,"users");
						test.deepEqual(doc,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000001"]});
						ret_handler(null);
					}
				},
				
				select:function(col_str, id_str, ret_handler){
					
					if( col_str == "dummy"){
						test.equal(col_str, "dummy");
						test.equal(id_str, "50187f71556efcbb25000001");
						test.deepEqual(dbdocs[id_str].a,[-4,"foo",6]);
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{shift:1}}}}}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
							
	server.api.events.on("ev_api_shift", function(msg){
		
		test.equal(msg.ev_type,"ev_api_shift");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	});
				
	
	server.api.shift(params, function(err,ctx){
				
		test.equal(err,undefined);
		test.equal(ctx.retval,1);						
				
		test.expect(15);		
		test.done();
	});
						
}


exports["server.api.events.emit"] = function(test){
	
	var server = require("../lib/server");
	var ctx = {params:{foo:1,bar:"bar"}};	
	var	myrcpts = [1,2,3];
	
	server.api.events.on("ev_bar", function(msg, rcpts){
		
		test.deepEqual( msg.ev_ctx.params, ctx.params );
		test.equal( rcpts, myrcpts );		
		test.done();	
	});
	
	server.api.events.emit("ev_bar", ctx, myrcpts);	
	
}



exports["server.api.config.newop: invocation"] = function(test){
	
	var server = require("../lib/server");	
	var api = require("../lib/api");			
	var myparams = {foo:1, bar:"test"};
	server.config = {app:{status:1}, db:{default_catalog:"docs"}};
	
	var flag = 0;		
	server.api.config.newop("newop", function(ctx, ret_handler){
		
			
		ctx.config.save = 0;
		//As sandbox does not save it's not necessary to assign ctx.config.emit.		
		test.deepEqual(ctx.params, myparams);
		test.deepEqual(ctx.doc,{});		
		server.api.events.emit("ev_api_newop", ctx);		
		ret_handler(null,1);
	});
	server.api.config.newop("echo_x",function(ctx, ret_handler){
		
		ctx.config.save = 0;
		ctx.config.emit = 0;
		ret_handler(null,ctx.params.x);//echo param x
		
	}).add_constraint_pre(function(ctx){
		
		ctx.params.x = 5;//fake param x=1 with param x=5
	}).add_constraint_pre(function(ctx){
		
		flag = 1;
	});
	
	test.notEqual(server.api.newop, undefined);
	test.notEqual( api.remote["newop"], undefined );
	test.notEqual(server.api.echo_x, undefined);
	test.notEqual( api.remote["echo_x"], undefined );
	
	server.api.events.on("ev_api_newop", function(msg, rcpts){
		
		
		test.deepEqual(msg.ev_ctx.params, myparams);
		test.equal( rcpts, undefined );
					
	});
				
	//make invocation
	server.api.newop( myparams, function(err,ctx){
	
		
		test.equal(ctx.retval,1);
		test.equal(err,null);	
				
	});
	
	server.api.echo_x({x:1},function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,5);
		test.expect(13);
		test.done();
	})
		
}


exports["server.api.config.newop: event custom params"] = function(test){
		
	var rcpts = [5,6,7,8];
	var myparams = {foo:1, bar:"test"};
	var db = {
				
		save:function(col_str, msg, ret_handler){
										
			test.equal(col_str,"events");																
			test.equal(msg.ev_type, "ev_api_dummy");
			test.deepEqual( msg.ev_data, {foo:1, bar:"test",catalog:"docs"});
			
			//save doc to db & return object					
			ret_handler(null,msg);	
		}	
		
	};
					
	var api = require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{ "./db":db, "./api":api }
	});
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{ "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{dummy:1}}}},"./api":api }
	});
	
	var server = sandbox.require("../lib/server",{
		requires:{ "./evqueue":eq, "./sandbox":sb, "./api":api }
	});						
	
	server.api.config.newop("dummy", function(ctx, ret_handler){
		
		ctx.config.save = 0;		
		test.deepEqual(ctx.params, {foo:1, bar:"test", catalog:"docs"});
		ctx.payload = ctx.params;		
		server.api.events.emit("ev_api_dummy",ctx, rcpts);
		
		ret_handler(null,1);
		
	});
	
	//eq.on is firstly executed before this event handler.	
	server.api.events.on("ev_api_dummy", function(msg, rcpts){
						
		test.deepEqual(msg.ev_ctx.payload,msg.ev_ctx.params);
		test.deepEqual(rcpts,[5,6,7,8]);				
					
	});
		
	test.notEqual( api.remote["dummy"], undefined );	
	test.notEqual( server.api["dummy"], undefined );
	server.api["dummy"](myparams, function(err,ctx){
		
		test.equal(err,null);
		test.equal(ctx.retval,1);
		test.expect(10);
		test.done();		
	});
			
}



exports["server.api.config.newop: create based op"] = function(test){
	
	var myparams = {uid:620793114, doc:{test:"test"}};
		    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							save:function(col_str, doc, ret_handler){
								
								if(col_str == "docs"){
									test.equal(col_str,"docs");	
																
									test.equal( doc.test, myparams.doc.test );
									test.equal( doc.uid, myparams.uid );
									//beacause init.rcpts is null the initial rcpts list is [uid]
									test.deepEqual( doc.rcpts, [myparams.uid]);
									
									doc._id="50187f71556efcbb25000001"
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["66667f71556efcbb25000008","50187f71556efcbb25000001"]});
									ret_handler(null);
								}	
							}
		}}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{	"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1, newop1:1}}}},
				 	"./db":{				
								select:function(col_str, id_str, ret_handler){
					
									if( col_str == "users"){
										
										ret_handler(null,{_id:id_str, name:"enric",wids:["66667f71556efcbb25000008"]});
									}
								}
							}
				 }
	});
	sb.add_plugin("create",sb.plugins.notifying_catalog("docs"));
	
	var server = sandbox.require("../lib/server",{
		requires:{"./api":api,"./sandbox":sb}
	});
	server.config.app = {status:1};		
	
	
	server.api.config.newop("newop1", function(ctx, ret_handler){
				
		
		test.deepEqual(ctx.params, myparams);
		test.deepEqual(ctx.doc, {});	
										
		ctx.doc.y = 1;//this value will be overwritten by params.doc
		ctx.params.another = 5;			
		ctx.config.emit = 0;
					
		server.api.create( ctx, function(err, val){
							
			ctx.payload = ctx.doc;
			server.api.events.emit("ev_api_newop1",ctx);
			ret_handler(err,val);				
		});	
						
	});
	test.notEqual( api.remote["newop1"], undefined );
	test.notEqual( server.api.newop1, undefined );		
	
	var flag = 1;
	server.api.events.on("ev_api_newop1", function(msg, rcpts){
					
		
		test.deepEqual( msg.ev_ctx.params, {uid:620793114, doc:{test:"test"},catalog:"docs", another:5, rcpts:[620793114]} );		
				
			
	}).on("ev_api_create", function(params, rcpts){
				
		flag = 0;
	});
	
	
	server.api.newop1(myparams, function(err,val){
		
		
		test.ok(flag);
		test.equal(err,undefined);
		test.notEqual(val, undefined)
		test.expect(14);
		test.done();	
	});
					
}


/*
exports["server.api.config.newop: db raw access based op"] = function(test){
	
	var myparams = {uid:620793114, catalog:"users"};	
	var dbusers = {};
		
		//document WITH b field.
		dbusers["620793114"] = {uid:"620793114",name:"Enric", surname:"Cecilla"};    
	
	var db = {
		
		select: function(col_str, id_str, ret_handler){
								
			test.equal(col_str, "users");
			test.equal(id_str, myparams.uid);
			test.notEqual(dbusers[id_str], undefined);								
																			
			setTimeout(function(){//db 50ms delay retrieving document
				
				ret_handler(null,dbusers[id_str]);
			},50);
			
		},
		save: function(col_str, doc, ret_handler){
			
			test.equal(col_str,"users");											
			test.equal( doc.name, "Enric" );
			test.equal( doc.newfield, 999);					
			
			//save doc to db...returns with _id:12345			
			ret_handler(null,doc);	
		}	
		
	},
	
	api = sandbox.require("../lib/api",{
		requires:{ "./db":db }
	}),
	
	server = sandbox.require("../lib/server",{
		requires:{
					"./api":api,
					"./db":db
				}		
	});
				
	
	server.api.config.newop("newop3", function(params, ret_handler){
				
		test.deepEqual(params, myparams); 		
		
		//recuperamos un usuario
		server.db.select(params.catalog, ""+params.uid, function(err,user){
			
			user.newfield = 999;
			
			server.db.save(params.catalog, user, function(err,val){
				
				server.api.events.ev_api_newop3.params = {dummy:1};						
				ret_handler(err,val);
			});
			
		});	
																	
	});	
	
	//ev_newop3 will be emitted by default.
	server.api.events.on("ev_api_newop3", function(params, rcpts){
					
		test.deepEqual( params.ev_data, {dummy:1} );			
		test.done();	
			
	});
				
	
	api.remote["newop3"](myparams, function(err,val){
				
		test.equal(err,null);	
				
	});
		
}



exports["server.api.config.newop: wid based op"] = function(test){
	
		
	var myparams = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:3, catalog:"dummy"};	
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:2, rcpts:[ 620793114, 620793115 ], uid:620793114};    
	
	var db = {
		select: function(col_str, id_str, ret_handler){
								
			test.equal(col_str, "dummy");
			test.equal(id_str, myparams.wid);
			test.notEqual(dbdocs[id_str], undefined);								
																										
			ret_handler(null,dbdocs[id_str]);
						
		},		
		save:function(col_str, doc, ret_handler){
												
			//save doc to db...returns with _id:12345			
			ret_handler(null,doc);	
		}	
		
	};
			
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
				  "./db":{
				  		
				  		save:function(col_str, doc, ret_handler){
				  			
				  			test.equal(col_str, "events");
				  			test.equal(doc.ev_rcpt, 620793115);
				  			test.equal(doc.ev_msg.ev_type,"ev_api_foo1");
				  			test.equal(doc.ev_msg.ev_data.doc, undefined);
				  			test.deepEqual(doc.ev_msg.ev_data,myparams);
				  			ret_handler();
				  		}
				  	}	
				  }
	});
		
	var server = sandbox.require("../lib/server",{
		requires:{ "./db":db, "./api":api, "./evqueue":eq }
	});
						
	
	server.api.config.newop("foo1", function(params, ret_handler){
						
		test.notEqual(params.doc, undefined);	
		test.deepEqual(params.doc, dbdocs["50187f71556efcbb25000001"] );	
		test.deepEqual(params, myparams);
		
		//operacion set hecha desde newop
		params.doc[params.fname] = params.value;	
		ret_handler(null,1);
		
	});
		
	server.api.events.on("ev_api_foo1", function(params, rcpts){
		
		test.equal(rcpts,undefined);
		test.equal(params.ev_type, "ev_api_foo1");
		test.deepEqual(params.ev_data.doc,dbdocs["50187f71556efcbb25000001"]);		
						
		test.done();			
	});
		
	
	test.notEqual( api.remote["foo1"], undefined );
	test.notEqual( server.api["foo1"], undefined );
	api.remote["foo1"](myparams, function(err,val){
		
		test.equal(err,null);
		test.ok(val);		
	});
	
		
}

*/




