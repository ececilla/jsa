var sandbox = require("sandboxed-module");
var async = require("async");


var CONST = require("../lib/constants");
var time = require("../lib/time");

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
	sb.init();
	
	var server = sandbox.require("../lib/server",{
		
			requires:{"./api":api, "./sandbox":sb}
		});
	server.config.app = {status:1};
	test.notEqual( server.add_http_plugin, undefined );
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
	test.notEqual( server.api.config.add_plugin_in, undefined );
	test.notEqual( server.api.config.add_plugin_out, undefined );	
	test.notEqual( server.api.config.add_constraint_pre, undefined );
	test.notEqual( server.api.config.add_constraint_post, undefined );	
	test.notEqual( server.api.events, undefined );
	test.notEqual( server.api.events.on, undefined );
	test.notEqual( server.api.events.remote_func.on, undefined );	
	test.notEqual( server.api.events.emit, undefined );
			
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
	
	test.expect(52);	
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
	test.ok( server.api.config.procedures.get );
	test.ok( server.api.config.procedures.search );
		
	
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
	test.equal( server.api.config.procedures.get,0 );
	test.equal( server.api.config.procedures.search,0 );	
	
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
	test.ok( server.api.config.procedures.get );
	test.ok( server.api.config.procedures.search );	
	
	test.expect(36);
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

exports["server.add_http_plugin: custom plugin"] = function(test){
	
	var server = require("../lib/server");
	
	server.add_http_plugin("authentication",function(request, data){
				
	});
			
	
	test.done();	
	
}

exports["server.api.register: internal api events"] = function(test){
	
	var params = {user:{name:"test", email:"test@test.com"}};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for register procedure
							save:function(col_str, user, ret_handler){
																							
								test.equal(col_str,"users");
								test.equal(user.name,"test");
								test.equal(user.email,"test@test.com");								
								test.equal(typeof user.ctime, "number");
								//test.deepEqual(user,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000001"]});
								user._id = "50187f71556efcbb25000001";
								ret_handler(null,user);
									
							}																				
						},
						"./server":{config:{app:{debug:0}}}					
		}
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
	sb.init();			
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
		
	});
	
	server.config.app = {status:1,debug:0};
	
	//two ev_api_register handlers.				
	server.api.events
				.on("ev_api_register", function(msg){
							
					test.equal(msg.ev_type,"ev_api_register");										
					test.equal(msg.ev_ctx.doc.uid, "50187f71556efcbb25000001");									
					
				})				
				.on("ev_api_register",function(msg){
										
					test.equal(msg.ev_type,"ev_api_register");
					
				});
	
	server.api.register(params, function(err,val){
				
		test.ok(flag);
		test.equal(err,undefined);
		test.notEqual(val, undefined);								
				
		test.expect(10);		
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
									test.deepEqual( doc.rcpts, [{uid:"620793114", push_id:"gcm-114", push_type:"gcm"}]);
									test.equal(typeof doc.ctime, "number");								
									
									//save doc to db...returns with _id:12345
									doc._id = "50187f71556efcbb25000001";
									ret_handler(null,doc);
								}	
							}
							
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
				"./api":api,
				"./db": {
							select: function(col_str, id_str, projection, ret_handler){
																													
								if(col_str == "users"){
									
									test.deepEqual(projection,{_id:1,push_id:1, push_type:1, wids:1});																									
									ret_handler(null,{_id:id_str, push_id:"gcm-114", push_type:"gcm",wids:[]});	
								}							
							}
					},
				"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}}
		
	});
	
	sb.init();
	sb.add_plugin_in("create","notif_catalog",sb.plugins.notifying_catalog,"docs");
				
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
				
		test.expect(12);		
		test.done();
	});
						
}


exports["server.api.create: internal api events, custom rcpts plugin, default catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "docs"){
									test.equal(col_str,"docs");								
									test.equal( doc.test, "test" );
									test.equal( doc.uid,  620793114);
									test.deepEqual( doc.rcpts, [{uid:"620793114", push_id:"gcm-114", push_type:"gcm"}]);									
									test.equal(typeof doc.ctime, "number");								
									
									//save doc to db...returns with _id:12345
									doc._id = "50187f71556efcbb25000001";
									ret_handler(null,doc);
								}	
							}
							
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
				"./api":api,
				"./db": {
							select: function(col_str, id_str, projection, ret_handler){
																														
								if(col_str == "users"){
																																	
									ret_handler(null,{_id:id_str, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:[]});	
								}							
							}
					},
				"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}}
		
	});
	sb.init();
	sb.add_plugin_in("create",sb.plugins.notifying_doc);
	sb.add_plugin_in("create",function(ctx,next){
		
		ctx.config.rcpts = [{push_id:"gcm-999", push_type:"gcm"}];
		next();
	});
				
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
					test.deepEqual( msg.ev_ctx.config.rcpts,[{push_id:"gcm-999",push_type:"gcm"}]);
					//console.log(msg.ev_ctx.doc);				
				})				
				.on("ev_api_create",function(msg){
										
					test.equal(msg.ev_type,"ev_api_create");
					
				});
	
	server.api.create(params, function(err,val){
				
		test.equal(err,undefined);
		test.notEqual(val, undefined);								
				
		test.expect(12);		
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
								test.deepEqual( doc.rcpts, [{uid:"620793114", push_id:"gcm-114", push_type:"gcm"}]);
								
								//save doc to db...returns with _id:12345
								ret_handler({message:"some db error"},null);	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./db":{
								select: function(col_str, id_str, projection, ret_handler){
																														
									if(col_str == "users"){
																																		
										ret_handler(null,{_id:id_str, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:[]});	
									}							
							}
							},
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
						
				}
		
	});
	sb.init();
	sb.add_plugin_in("create","notif_plugins",sb.plugins.notifying_catalog,"docs");
				
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
								}	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./db":{
								select: function(col_str, id_str,projection, ret_handler){
																														
									if(col_str == "users"){
																																		
										ret_handler(null,{_id:id_str, name:"enric",wids:[]});	
									}							
								}
							},
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
					}
		
	});
	sb.init();
				
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
				
		test.expect(11);		
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
									test.deepEqual( doc.rcpts, [{uid:"620793114", push_id:"gcm-114", push_type:"gcm"}, {uid:"620793115", push_id:"gcm-115", push_type:"gcm"}]);
									test.equal(typeof doc.ctime, "number");								
									
									//save doc to db...returns with _id:12345
									doc._id = "50187f71556efcbb25000001";
									ret_handler(null,doc);
								}	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./db":{
								select: function(col_str, id_str, projection, ret_handler){
																														
									if(col_str == "users"){
																																		
										ret_handler(null,{_id:id_str,push_id:"gcm-114", push_type:"gcm", name:"enric",wids:[]});	
									}							
								}
							},
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
				}
		
	});
	
	sb.init();
	sb.add_plugin_in("create","notif_catalog",sb.plugins.notifying_catalog,"dummy")
	  .add_plugin_in("create","custom_plugin", function(ctx,end_handler){
	  		
	  		ctx.params.rcpts.push({uid:"620793115", push_id:"gcm-115", push_type:"gcm"});
	  		end_handler();
	  },"dummy");
				
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
				
		test.expect(11);		
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
									test.deepEqual( doc.rcpts, [{uid:"620793114", push_id:"gcm-114", push_type:"gcm"},{uid:111, push_id:620793115, push_type:"foo"}]);
									
									
									//save doc to db...
									doc._id = "50187f71556efcbb25000666";
									dbdocs["50187f71556efcbb25000666"] = doc;
									ret_handler(null,doc);	
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
								select: function(col_str, id_str,projection, ret_handler){
																														
									if(col_str == "users"){
																																		
										ret_handler(null,{_id:id_str, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:[]});	
									}							
								}
							},
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
				}
	});	
	
	sb.init();
	sb.add_plugin_in("create","notif_plugin",sb.plugins.notifying_catalog,"dummy")
	  .add_plugin_in("create","custom_plugin", function(ctx,end_handler){
	  			  		
	  		server.db.select("dummy","50187f71556efcbb25000002",function(err,val){
			
				test.equal(val.a,2);			
				ctx.params.rcpts.push({uid:111,push_id:val.uid, push_type:"foo"});				
				end_handler();
			});	  		
	  },"dummy");		
	
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
				
		test.expect(10);		
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
				
				select:function(col_str, id_str, projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
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
	sb.init();
				
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
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[{uid:"620793115", push_id:"gcm-115",push_type:"gcm"}], uid:620793115, catalog:"docs"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[{uid:"620793115", push_id:"gcm-115",push_type:"gcm"}], uid:620793115, catalog:"docs"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "docs"){
						test.equal(col_str,"docs");																								
						test.deepEqual( doc.rcpts, [{uid:"620793115",push_id:"gcm-115",push_type:"gcm"},{uid:"620793114", push_id:"gcm-114",push_type:"gcm"}]);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}
				},
				
				select:function(col_str, id_str, projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
					if( col_str == "docs"){
						test.equal(col_str, "docs");
						test.equal(id_str, "50187f71556efcbb25000001");
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:[]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}}		
	});
	sb.init();
					
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
		test.deepEqual(msg.ev_ctx.doc.rcpts, [{uid:"620793115", push_id:"gcm-115",push_type:"gcm"},{uid:"620793114", push_id:"gcm-114",push_type:"gcm"}]);							
	});
				
	
	server.api.join(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val,undefined);						
				
		test.expect(12);		
		test.done();
	});
						
}


exports["server.api.unjoin: internal events, default catalog"] = function(test){
	  
	var params = {wid:"50187f71556efcbb25000001", uid:620793116};
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[{push_id:"gcm-115",push_type:"gcm"},{push_id:"gcm-116",push_type:"gcm"}], uid:620793115, catalog:"docs"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[{push_id:"gcm-115",push_type:"gcm"},{push_id:"gcm-116",push_type:"gcm"}], uid:620793115, catalog:"docs"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					if(col_str == "docs"){
						test.equal(col_str,"docs");																								
						test.deepEqual( doc.rcpts, [{push_id:"gcm-115", push_type:"gcm"}]);
											
						setTimeout(function(){
							
							ret_handler(null,doc);
						},50);	
					}
				},
				
				select:function(col_str, id_str, projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
					if( col_str == "docs"){
						
						test.equal(col_str, "docs");
						test.equal(id_str, "50187f71556efcbb25000001");
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, push_id:"gcm-116", push_type:"gcm", name:"enric",wids:["50187f71556efcbb25000001","50187f71556efcbb25000555"]});
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{unjoin:1}}}}}		
	});
	sb.init();
					
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
		test.deepEqual(msg.ev_ctx.doc.rcpts, [{push_id:"gcm-115", push_type:"gcm"}]);							
	});
				
	
	server.api.unjoin(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val,undefined);						
				
		test.expect(12);		
		test.done();
	});
						
}


exports["server.api.remove: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"b", catalog:"dummy"};		
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {	
				
				select:function(col_str, id_str,projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
					if( col_str == "dummy"){
						test.equal(col_str, "dummy");
						test.equal(id_str, "50187f71556efcbb25000001");
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}else if( col_str == "users"){
						
						ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
					}
				},
				update: function(col_str, id_str, criteria, ret_handler){
					
					test.equal(col_str,"dummy");
					test.equal(id_str,"50187f71556efcbb25000001");
					test.deepEqual(criteria,{$unset:{b:1}});
					ret_handler(null);
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{remove:1}}}}}		
	});
	sb.init();
					
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
				
		test.expect(12);		
		test.done();
	});	
						
}




exports["server.api.set: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", value:5, catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {					
				
				select:function(col_str, id_str, projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
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
				},
				
				update: function(col_str, id_str, criteria, ret_handler){
					
					test.equal(col_str,"dummy");
					test.equal(id_str,"50187f71556efcbb25000001");
					test.deepEqual(criteria,{$set:{a:5}});
					ret_handler(null);
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1}}}}}		
	});
	sb.init();
					
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
				
		test.expect(13);		
		test.done();
	});						
}



exports["server.api.push: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", value:9, catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[4,6], b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {					
				
				select:function(col_str, id_str, projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
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
				},
				
				update: function(col_str,id_str,criteria,ret_handler){
					
					test.equal(col_str,"dummy");
					test.equal(id_str,"50187f71556efcbb25000001");
					test.deepEqual(criteria,{$push:{a:9}});
					ret_handler(null,1);
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{push:1}}}}}		
	});
	sb.init();
					
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
				
		test.expect(14);		
		test.done();
	});	
						
}

exports["server.api.pop: internal events, explicit catalog"] = function(test){	
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[-4,"foo",6], b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {					
				
				select:function(col_str, id_str, projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
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
				},
				update: function(col_str, id_str, criteria, ret_handler){
					
					test.equal(col_str,"dummy");
					test.equal(id_str,"50187f71556efcbb25000001");
					test.deepEqual(criteria,{$pop:{a:1}});
					ret_handler(null);
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{pop:1}}}}}		
	});
	sb.init();
					
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
				
		test.expect(13);		
		test.done();
	});	
						
}


exports["server.api.shift: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[-4,"foo",6], b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {					
				
				select:function(col_str, id_str, projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
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
				},
				
				update: function(col_str,id_str,criteria,ret_handler){
					
					test.equal(col_str,"dummy");
					test.equal(id_str,"50187f71556efcbb25000001");
					test.deepEqual(criteria,{$pop:{a:-1}});
					ret_handler(null);
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{shift:1}}}}}		
	});
	sb.init();
					
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
				
		test.expect(13);		
		test.done();
	});
						
}

exports["server.api.get: internal events, explicit catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", fname:"a", catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[-4,"foo",6], b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var db =  {					
				
				select:function(col_str, id_str, projection, ret_handler){
					
					if( typeof projection == "function")
						ret_handler = projection;
					
					if( col_str == "dummy"){
						
						test.equal(col_str, "dummy");
						test.equal(id_str, "50187f71556efcbb25000001");											
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,dbdocs[id_str]);
						},50);	
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
			
			select: function(col_str, id_str, projection, ret_handler){
				
				test.equal(col_str,"dummy");
				test.equal(id_str,"50187f71556efcbb25000001");
				test.deepEqual(projection,{_id:0, a:1});
				ret_handler(null,dbdocs[id_str].a);
			}
		}}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{get:1}}}}}		
	});
	sb.init();
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
							
	server.api.events.on("ev_api_get", function(msg){
				
		test.equal(msg.ev_type,"ev_api_get");
		test.notEqual(msg.ev_tstamp, undefined);		
		test.deepEqual(msg.ev_ctx.params, {wid:"50187f71556efcbb25000001", fname:"a", catalog:"dummy"});							
															
	});
	
	server.api.events.get.on(function(msg){
		
		test.equal(msg.ev_type,"ev_api_get");
		test.notEqual(msg.ev_tstamp, undefined);		
		test.deepEqual(msg.ev_ctx.params, {wid:"50187f71556efcbb25000001", fname:"a", catalog:"dummy"});
		
			
	});
				
	
	server.api.get(params, function(err,ctx){
				
		test.equal(err,null);
		test.deepEqual(ctx.retval,[-4,"foo",6]);
		test.expect(13);
		test.done();												
	});
						
}



exports["server.api.search: internal events, explicit catalog"] = function(test){
	
	var params = {criteria:{name:"foo"}, catalog:"dummy"};			
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", name:"foo", catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555", name:"bar", catalog:"dummy"}
	
	var db =  {					
				
				criteria:function(col_str, criteria, order, projection, ret_handler){
					
					if( col_str == "dummy"){
						
						test.equal(col_str, "dummy");
						test.deepEqual(criteria,{name:"foo"});						
						
						setTimeout(function(){//50ms delay retrieving document
							
							ret_handler(null,[dbdocs["50187f71556efcbb25000001"]]);
						},50);	
					}
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{search:1}}}}}		
	});
	sb.init();
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	server.config.app = {status:1};
							
	server.api.events.on("ev_api_search", function(msg){
				
		test.equal(msg.ev_type,"ev_api_search");
		test.notEqual(msg.ev_tstamp, undefined);		
		test.deepEqual(msg.ev_ctx.params, {criteria:{name:"foo"}, projection:{}, catalog:"dummy"});							
															
	});
	
	server.api.events.search.on(function(msg){
		
		test.equal(msg.ev_type,"ev_api_search");
		test.notEqual(msg.ev_tstamp, undefined);		
		test.deepEqual(msg.ev_ctx.params, {criteria:{name:"foo"}, projection:{}, catalog:"dummy"});
					
	});
				
	
	server.api.search(params, function(err,ctx){
				
		test.equal(err,null);
		test.deepEqual(ctx.retval,[{wid:"50187f71556efcbb25000001", name:"foo", catalog:"dummy"}]);
						
		test.expect(10);
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
		test.expect(2);	
		test.done();	
	});
	
	server.api.events.emit("ev_bar", ctx, myrcpts);	
	
}

exports["server.api.events.emit, explicit tag"] = function(test){
	
	var server = require("../lib/server");
	var ctx = {params:{foo:1,bar:"bar"}};	
	var	myrcpts = [1,2,3];
	
	server.api.events.on("ev_foo5", function(msg, rcpts){
		
		test.deepEqual( msg.ev_ctx.params, ctx.params );
		test.equal( rcpts, myrcpts );		
		test.equal( msg.ev_tag,"mytag");
		test.expect(3);
		test.done();	
	});
	
	server.api.events.emit("ev_foo5", ctx, myrcpts,"mytag");	
	
}


exports["server.api.config.newop: invocation"] = function(test){
	
	var api = sandbox.require("../lib/api");
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{newop:1,echo_x:1}}}},
					"./api":api
				}		
	});	
	sb.init();
		
	
	var server = sandbox.require("../lib/server",{
		
		requires:{"./sandbox":sb,"./api":api}		
	});
		
				
	var myparams = {foo:1, bar:"test"};
	server.config = {app:{status:1}, db:{default_catalog:"docs"}};
	
	var flag = 0;		
	server.api.config.newop("newop", function(ctx, ret_handler){
		
			
		ctx.config.save = 0;
		ctx.config.emit = 1;
		ctx.config.tag = "salary_ok";
		//As sandbox does not save it's not necessary to assign ctx.config.emit.		
		test.deepEqual(ctx.params, myparams);
		test.deepEqual(ctx.doc,{});		
		//server.api.events.emit("ev_api_newop", ctx);		
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
	
	server.api.events.newop.on(function(msg, rcpts){
		
		
		test.deepEqual(msg.ev_ctx.params, myparams);
		test.equal(msg.ev_ctx.config.tag,"salary_ok");
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
		test.expect(14);
		test.done();
	})
		
}


exports["server.api.config.newop: event custom params"] = function(test){
		
	var rcpts = [{push_id:5, push_type:"web"},{push_id:6, push_type:"web"},{push_id:7, push_type:"web"},{push_id:8, push_type:"web"}];
	var myparams = {foo:1, bar:"test"};	
					
	var api = require("../lib/api");
	
	var evmngr = sandbox.require("../lib/evmngr",{
		requires:{ "./api":api,
				   "./evqueue":{
						save:function(ev_msg, ret_handler){
							
							
							test.equal(ev_msg.ev_type,"ev_api_dummy");
							test.deepEqual(ev_msg.ev_data,{ foo:1, bar:"test", catalog:"docs" });
							ret_handler();
						}
				  },
				  "./server":{config:{app:{ev_journal:1}}}
		}
	});
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{ "./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{dummy:1}}}},"./api":api }
	});
	sb.init();
	
	var server = sandbox.require("../lib/server",{
		requires:{ "./evmngr":evmngr, "./sandbox":sb, "./api":api }
	});						
	
	server.api.config.newop("dummy", function(ctx, ret_handler){
		
		ctx.config.save = 0;
		ctx.config.emit = 0;		
		test.deepEqual(ctx.params, {foo:1, bar:"test", catalog:"docs"});
		ctx.payload = ctx.params;		
		server.api.events.emit("ev_api_dummy",ctx, rcpts);
		
		ret_handler(null,1);
		
	});
	
	//eq.on is firstly executed before this event handler.	
	server.api.events.on("ev_api_dummy", function(msg, rcpts){
							
		test.deepEqual(msg.ev_ctx.payload,msg.ev_ctx.params);
		test.deepEqual(rcpts,[{push_id:5, push_type:"web"},{push_id:6, push_type:"web"},{push_id:7, push_type:"web"},{push_id:8, push_type:"web"}]);				
					
	});
	
	//Another way to intercept the ev_api_dummy event.
	server.api.events.dummy.on(function(msg){
		
		test.deepEqual(msg.ev_ctx.payload,msg.ev_ctx.params);
		test.deepEqual(rcpts,[{push_id:5, push_type:"web"},{push_id:6, push_type:"web"},{push_id:7, push_type:"web"},{push_id:8, push_type:"web"}]);
	});
		
	test.notEqual( api.remote["dummy"], undefined );	
	test.notEqual( server.api["dummy"], undefined );
	server.api["dummy"](myparams, function(err,ctx){
		
		test.equal(err,null);
		test.equal(ctx.retval,1);
		test.expect(11);
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
									test.deepEqual( doc.rcpts, [{uid:"620793114", push_id:"gcm-114", push_type:"gcm"}]);
									
									doc._id="50187f71556efcbb25000001"
									ret_handler(null,doc);
								}
							}
		}}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{	"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1, newop1:1}}}},
				 	"./db":{				
								select:function(col_str, id_str, projection, ret_handler){
					
									if( col_str == "users"){
										
										test.equal(col_str,"users");
										test.equal(id_str,"620793114");										
										test.deepEqual(projection,{_id:1,push_id:1,push_type:1,name:1,wids:1});
										ret_handler(null,{_id:id_str, push_id:"gcm-114", push_type:"gcm", name:"enric",wids:["66667f71556efcbb25000008"]});
									}
								}
							}
				 }
	});
	sb.init();
	sb.add_plugin_in("create","notif_plugin", sb.plugins.notifying_catalog,"docs");
	
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
						
	}).add_user_load_fields({_id:1,push_id:1,push_type:1,name:1,wids:1});
	
	test.notEqual( api.remote["newop1"], undefined );
	test.notEqual( server.api.newop1, undefined );		
	
	var flag = 1;
	server.api.events.on("ev_api_newop1", function(msg, rcpts){
					
		
		test.deepEqual( msg.ev_ctx.params, {uid:620793114, doc:{test:"test"},catalog:"docs", another:5, rcpts:[{uid:"620793114", push_id:"gcm-114", push_type:"gcm"}]} );		
						
	}).on("ev_api_create", function(params, rcpts){
				
		flag = 0;
	});
	
	server.api.events.newop1.on(function(msg){
		
		test.deepEqual( msg.ev_ctx.params, {uid:620793114, doc:{test:"test"},catalog:"docs", another:5, rcpts:[{uid:"620793114", push_id:"gcm-114", push_type:"gcm"}]} );
	});
	
	
	server.api.newop1(myparams, function(err,val){
		
		
		test.ok(flag);
		test.equal(err,undefined);
		test.notEqual(val, undefined)
		test.expect(16);
		test.done();	
	});
					
}


exports["server.api.config.newop: get based op"] = function(test){
	
	var myparams = {wid:"50187f71556efcbb25000001", fname:"a", uid:620793115, catalog:"dummy"};
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[{c:1},{c:1},{c:2},{c:1},{c:3}], b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"dummy"};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
						select: function(col_str, id_str, projection, ret_handler){
			
							test.equal(col_str,"dummy");
							test.equal(id_str,"50187f71556efcbb25000001");
							test.deepEqual(projection,{_id:0, a:1});
							ret_handler(null,dbdocs["50187f71556efcbb25000001"].a);
						}
				}
		}
	});
		    		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{	"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{get:1, newop1:1}}}},
				 	"./db":{				
								select:function(col_str, id_str, projection, ret_handler){
									
									if( typeof projection == "function")
										ret_handler = projection;
									
									if(col_str == "dummy"){
										
										test.equal(col_str,"dummy");
										ret_handler(null,dbdocs[id_str]);
									}
								}
							}
				 }
	});	
	sb.init();
	
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
	});	
	
	
	server.api.config.newop("newop1", function(ctx, ret_handler){
				
		
		test.deepEqual(ctx.params, myparams);
		test.deepEqual(ctx.doc, dbdocs["50187f71556efcbb25000001"]);															
		ctx.config.emit = CONST.DISABLE(); 
					
		server.api.get( ctx, function(err){
			
			for(i=0; i < ctx.retval.length;){
				if(ctx.retval[i].c == 2 )
					ctx.retval.splice(i,1);
				else
					i++;
			}	
			server.api.events.emit("ev_api_newop1",ctx);																	
			ret_handler(err,ctx.retval);				
		});	
						
	});	
	test.notEqual(api.remote.newop1, undefined);
	test.notEqual( server.api.newop1, undefined );
	
	var not_get_event_flag = 1;
	server.api.events.get.on(function(msg){
		
		not_get_event_flag = 0;
	});
	server.api.events.newop1.on(function(msg){
		
		test.equal(msg.ev_type,"ev_api_newop1");
		//intercept ctx.retval
		msg.ev_ctx.retval = 5;//cannot intercept ctx, can only read		
	});		
	
	
	server.api.newop1(myparams, function(err,ctx){
					
		test.ok(not_get_event_flag);
		test.equal(err,undefined);
		test.deepEqual(ctx.retval, [{c:1},{c:1},{c:1},{c:3}]);
		test.expect(12);
		test.done();	
	});
					
}


exports["server.api.config.newop:public reply"] = function(test){
	
	var ObjectID = require('mongodb').ObjectID;
	var myparams = {wid:"50187f71556efcbb25000001", txt:"This is a reply", uid:"50187f71556efcbb25004444", catalog:"dummy"};
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:new ObjectID("50187f71556efcbb25000001"),replies:[], uid:"50187f71556efcbb25005555", catalog:"dummy"};
	var dbusers = {};
		dbusers["50187f71556efcbb25005555"] = {_id:new ObjectID("50187f71556efcbb25005555"), name:"enric", karma:5, wids:["50187f71556efcbb25000001"]};	
		dbusers["50187f71556efcbb25004444"] = {_id:new ObjectID("50187f71556efcbb25004444"), name:"peter", karma:60, wids:[]};
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
			
			select: function(col_str, id_str, projection, ret_handler){
			
							test.equal(col_str,"users");
							test.equal(id_str,"50187f71556efcbb25005555");
							test.deepEqual(projection,{_id:0, karma:1});
							ret_handler(null,dbusers["50187f71556efcbb25005555"].karma);
			},
			
			update: function(col_str,id_str,criteria,ret_handler){
				
				if(col_str == "dummy"){
					test.equal(col_str,"dummy");
					test.equal(id_str,"50187f71556efcbb25000001");
					test.equal(criteria.$push.replies.txt,"This is a reply");
					test.equal(criteria.$push.replies.uid,"50187f71556efcbb25004444");
				}else if(col_str == "users"){
					
					test.equal(col_str,"users");
					test.equal(id_str,"50187f71556efcbb25005555");
					test.deepEqual(criteria,{$set:{karma:10}});
					
				}
				ret_handler(null,1);
			}
		}}
	});	    		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{	"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1,get:1, push:1, reply:1}}}},
				 	"./db":{				
								select:function(col_str, id_str, projection, ret_handler){
									
									if( typeof projection == "function")
										ret_handler = projection;
									
									if( col_str == "users"){
																			
										test.equal(col_str,"users");
										ret_handler(null,dbusers[id_str]);
									}else if(col_str == "dummy"){
										
										test.equal(col_str,"dummy");
										ret_handler(null,dbdocs[id_str]);
									}
								},
								save:function(col_str, doc, ret_handler){
									
									if (col_str == "users"){
										
										test.equal(col_str,"users");
										test.equal(doc.karma,10);
									}	
																		
									ret_handler(null);
								}
							}
				 }
	});	
	sb.init();
	
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
	});	
	
	
	server.api.config.newop("reply", function(ctx, ret_handler){
						
		test.deepEqual(ctx.params, myparams);
		test.deepEqual(ctx.doc, dbdocs["50187f71556efcbb25000001"]);															
		ctx.config.emit = CONST.DISABLE(); 					
					
		async.parallel([
			function(next){//push reply
					
				ctx.params.fname = "replies";
				ctx.params.value = {txt:ctx.params.txt, uid:ctx.params.uid,t:time.now()};		
				//ctx.user = null;		
				server.api.push( ctx, function(err,ctx){
																																																					
					next(err);				
				})	
			},
			function(next){//get and set karma
				
				var params = {wid:ctx.doc.uid, catalog:"users", fname:"karma"};				
				server.api.get(params,function(err,ctx){
					
					ctx.params.value = ctx.retval + 5;
					ctx.config.save = CONST.ENABLE();
					server.api.set(ctx,function(err,ctx){
						
						next(err,1);
					});															
				});				
			}
		],function(err,retval){
			
			ctx.config.save = CONST.DISABLE();
			server.api.events.emit("ev_api_reply",ctx);
			ret_handler(err,retval[1]);
		});
						
	});	
	test.notEqual(api.remote.reply, undefined);
	test.notEqual( server.api.reply, undefined );
	
	var not_push_event_flag = 1;
	server.api.events.push.on(function(msg){
		
		not_push_event_flag = 0;
	});
	server.api.events.reply.on(function(msg,rcpts){
		
		test.equal(rcpts, undefined);
		test.equal(msg.ev_type,"ev_api_reply");		
			
	});		
	
	
	server.api.reply(myparams, function(err,ctx){
					
		test.ok(not_push_event_flag);
		test.equal(err,undefined);
		test.deepEqual(ctx.retval, 1);
		test.expect(21);
		test.done();	
	});
					
}

exports["server.api.config.newop:private reply, explicit rcpts"] = function(test){
	
	var ObjectID = require('mongodb').ObjectID;
	var myparams = {wid:"50187f71556efcbb25000001", txt:"This is a reply", uid:"50187f71556efcbb25004444", catalog:"dummy", config:{ev_private:1}};
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:new ObjectID("50187f71556efcbb25000001"),replies:[], uid:"50187f71556efcbb25005555", catalog:"dummy", rcpts:[{uid:"50187f71556efcbb25005555", push_id:"gcm-5555",push_type:"gcm"}, {uid:"50197f71556efcbb25004444", push_id:"gcm-4444",push_type:"gcm"}]};
	var dbusers = {};
		dbusers["50187f71556efcbb25005555"] = {_id:new ObjectID("50187f71556efcbb25005555"), name:"enric", push_type:"gcm", push_id:"5018-gcm", karma:5};	
		dbusers["50187f71556efcbb25004444"] = {_id:new ObjectID("50187f71556efcbb25004444"), name:"peter", karma:60};
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
			
			select: function(col_str, id_str, projection, ret_handler){
			
							test.equal(col_str,"users");
							test.equal(id_str,"50187f71556efcbb25005555");
							test.deepEqual(projection,{_id:0, karma:1});
							ret_handler(null,dbusers["50187f71556efcbb25005555"].karma);
			},
			
			update: function(col_str,id_str,criteria,ret_handler){
				
				if(col_str == "dummy"){
					test.equal(col_str,"dummy");
					test.equal(id_str,"50187f71556efcbb25000001");
					test.equal(criteria.$push.replies.txt,"This is a reply");
					test.equal(criteria.$push.replies.uid,"50187f71556efcbb25004444");
				}else if(col_str == "users"){
					
					test.equal(col_str,"users");
					test.equal(id_str,"50187f71556efcbb25005555");
					test.deepEqual(criteria,{$set:{karma:10}});
					
				}
				ret_handler(null,1);
			}
		}}
	});	    		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{	"./api":api,
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1,get:1, push:1, reply:1}}}},
				 	"./db":{				
								select:function(col_str, id_str, projection, ret_handler){
									
									if( typeof projection == "function")
										ret_handler = projection;
									
									if( col_str == "users"){
																			
										test.equal(col_str,"users");
										ret_handler(null,dbusers[id_str]);
									}else if(col_str == "dummy"){
										
										test.equal(col_str,"dummy");
										ret_handler(null,dbdocs[id_str]);
									}
								},
								save:function(col_str, doc, ret_handler){
									
									if (col_str == "users"){
										
										test.equal(col_str,"users");
										test.equal(doc.karma,10);
									}	
																		
									ret_handler(null);
								}
							}
				 }
	});	
	sb.init();	
	
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
	});	
	
	
	server.api.config.newop("reply", function(ctx, ret_handler){
						
		test.deepEqual(ctx.params, myparams);
		test.deepEqual(ctx.doc, dbdocs["50187f71556efcbb25000001"]);															
		ctx.config.emit = CONST.DISABLE(); 					
					
		async.parallel([
			function(next){//push reply
					
				ctx.params.fname = "replies";
				ctx.params.value = {txt:ctx.params.txt, uid:ctx.params.uid,t:time.now()};		
				//ctx.user = null;		
				server.api.push( ctx, function(err,ctx){
																																																					
					next(err);				
				})	
			},
			function(next){//get and set karma
				
				var params = {wid:ctx.doc.uid, catalog:"users", fname:"karma"};				
				server.api.get(params,function(err,ctx){
					
					ctx.params.value = ctx.retval + 5;
					ctx.config.save = CONST.ENABLE();
					server.api.set(ctx,function(err,ctx){
						
						next(err,1);
					});															
				});				
			}
		],function(err,retval){
			
			ctx.config.save = CONST.DISABLE();				
			server.api.events.emit("ev_api_reply",ctx,[{uid:"111", push_id:"111", push_type:"gcm"}]);
			ret_handler(err,retval[1]);
		});
						
	});	
	test.notEqual(api.remote.reply, undefined);
	test.notEqual( server.api.reply, undefined );
	
	var not_push_event_flag = 1;
	server.api.events.push.on(function(msg){
		
		not_push_event_flag = 0;
	});	
	server.api.events.reply.on(function(msg,rcpts){
		
		test.equal(msg.ev_type,"ev_api_reply");
		test.equal(msg.ev_ctx.proc_name,"reply");
		test.deepEqual(rcpts,[{uid:"111",push_id:"111",push_type:"gcm"}]);						
			
	});		
	
	
	server.api.reply(myparams, function(err,ctx){
					
		test.ok(not_push_event_flag);
		test.equal(err,undefined);
		test.deepEqual(ctx.retval, 1);
		test.expect(22);
		test.done();	
	});
					
}

/*
 
server.api.config.newop("incr", function(ctx, ret_handler){
	
	server.api.get(ctx,function(err,ctx){
					
		ctx.params.value = ctx.retval + ctx.params.value;
		ctx.config.save = CONST.ENABLE();
		server.api.set(ctx,function(err,ctx){
			
			ret_handler(err,1);
		});															
	});	
}	 
 
server.api.config.newop("decr", function(ctx, ret_handler){
	
	server.api.get(ctx,function(err,ctx){
					
		ctx.params.value = ctx.retval - ctx.params.value;
		ctx.config.save = CONST.ENABLE();
		server.api.set(ctx,function(err,ctx){
			
			ret_handler(err,1);
		});															
	});	
} 
 */




