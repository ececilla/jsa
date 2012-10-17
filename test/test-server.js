var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var flags = [0,0];		
	var _ = sandbox.require("../lib/constants");
	
	var api = {	
				remote:{
					remote_func: function(){
										
						flags[0] = 1;								
					}
				},									
				config:{
					config_func: function(){
						
						flags[1] = 1;
					}
				}	
			 
		};
	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
					"./api":api,
					"./server":{api:{config:{primitives:{remote_func:1}}}}										
				}
		
	});
	
	var server = sandbox.require("../lib/server",{
		
			requires:{"./api":api, "./sandbox":sb}
		});
		
	test.notEqual( server.settings, undefined );
	test.notEqual( server.start, undefined );
	test.notEqual( server.stop, undefined );
	test.notEqual( server.events.on, undefined );
	test.notEqual( server.events.emit, undefined );	
	test.notEqual( server.api.remote_func, undefined  );	
	test.notEqual( server.api.config, undefined );
	test.notEqual( server.api.config.enable_primitives, undefined );
	test.notEqual( server.api.config.disable_primitives, undefined );
	test.notEqual( server.api.config.newop, undefined );
	test.notEqual( server.api.config.config_func, undefined  );
	test.notEqual( server.api.events, undefined );
	test.notEqual( server.api.events.on, undefined );
	test.notEqual( server.api.events.emit, undefined );
		
	test.notEqual( server.eq.events.on, undefined );
	test.notEqual( server.eq.events.emit, undefined );
	test.notEqual( server.db, undefined );
	
	test.notEqual( server.config.system, undefined);
	
	
	//check exported functions can be invoked.
	server.api.remote_func();
	test.ok(flags[0]);
	
	server.api.config.config_func();	
	test.ok(flags[1]);
	
	server.settings();
	test.notEqual( server.config.app, undefined);
	
	test.expect(21);	
	test.done();
}

exports["server.api.config.disable/enable_primitives"] = function(test){
	
	var server = require("../lib/server");
	//default values
	test.ok( server.api.config.primitives.create );
	test.ok( server.api.config.primitives.join );
	test.ok( server.api.config.primitives.unjoin );
	test.ok( server.api.config.primitives.add );
	test.ok( server.api.config.primitives.remove );
	test.ok( server.api.config.primitives.set );
	test.ok( server.api.config.primitives.push );
	test.ok( server.api.config.primitives.pop );
	test.ok( server.api.config.primitives.shift );
	test.ok( server.api.config.primitives.ack );
	
	//disable primitives
	server.api.config.disable_primitives();
	test.equal( server.api.config.primitives.create,0 );
	test.equal( server.api.config.primitives.join,0 );
	test.equal( server.api.config.primitives.unjoin,0 );
	test.equal( server.api.config.primitives.add,0 );
	test.equal( server.api.config.primitives.remove,0 );
	test.equal( server.api.config.primitives.set,0 );
	test.equal( server.api.config.primitives.push,0 );
	test.equal( server.api.config.primitives.pop,0 );
	test.equal( server.api.config.primitives.shift,0 );
	test.equal( server.api.config.primitives.ack,0 );
	server.api.config.enable_primitives();
	
	//enable primitives
	test.ok( server.api.config.primitives.create );
	test.ok( server.api.config.primitives.join );
	test.ok( server.api.config.primitives.unjoin );
	test.ok( server.api.config.primitives.add );
	test.ok( server.api.config.primitives.remove );
	test.ok( server.api.config.primitives.set );
	test.ok( server.api.config.primitives.push );
	test.ok( server.api.config.primitives.pop );
	test.ok( server.api.config.primitives.shift );
	test.ok( server.api.config.primitives.ack );
	
	test.expect(30);
	test.done();
	
}

exports["server.init.execute: init scripts"] = function(test){
	
	var server = require("../lib/server");
	var async = require("async");	
	var flags = [0, 0];
	
	server.init.execute.push(function(end_handler){
		
		flags[0] = 1;
		end_handler();
	});
	
	server.init.execute.push(function(end_handler){
		
		flags[1] = 1;
		end_handler();
	});
	
	async.series(server.init.execute,function(){
		
		test.ok(flags[0]);
		test.ok(flags[1]);
		test.done();
	});
	
	
		
	
}

exports["server.events.on: custom server events"] = function(test){
	
	var server = require("../lib/server");
	var ctx = {params:{test:1}};
	var rcpts = [1,2,3,4];
	server.events.on("ev_srv_start", function( _ctx, _rcpts){
		
		test.deepEqual(_ctx.ev_ctx.params, {test:1});
		test.deepEqual(_rcpts,[1,2,3,4]);
		test.done();
	});
	
	server.events.emit("ev_srv_start", ctx, rcpts );	
	
}

exports["server.eq.events.on: custom eq events"] = function(test){
	
	var server = require("../lib/server");
	var params = {test:1};
	var rcpts = [1,2,3,4];
	server.eq.events.on("ev_eq_push", function( _params, _rcpts){
		
		test.deepEqual(_params.ev_data, {test:1});
		test.deepEqual(_rcpts,[1,2,3,4]);
		test.done();
	});
	
	server.eq.events.emit("ev_eq_push", params, rcpts );	
	
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


exports["server.api.create: internal api events, default catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
																
								test.equal(col_str,"docs");								
								test.equal( doc.test, "test" );
								test.equal( doc.uid,  620793114);
								test.deepEqual( doc.rcpts, [620793114]);
								test.equal(typeof doc.ctime, "number");								
								
								//save doc to db...returns with _id:12345
								doc._id = "50187f71556efcbb25000001";
								ret_handler(null,doc);	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./api":api}
		
	});
				
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
		
	});
	
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
				
		test.expect(11);		
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
		requires:{"./api":api}
		
	});
				
	var server = sandbox.require("../lib/server",{
		requires:{"./api":api,"./sandbox":sb}
		
	});
	
		
	test.throws( function(){server.api.create(params)} );
		
	test.expect(5);	
	test.done();				
	
}



exports["server.api.create: internal events, explicit catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, "test" );
								test.equal( doc.uid,  620793114);
								test.deepEqual( doc.rcpts, undefined);
								test.equal(typeof doc.ctime, "number");								
								
								//save doc to db...returns with _id:12345
								doc._id = "50187f71556efcbb25000001";
								ret_handler(null,doc);	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./api":api}
		
	});
				
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
		
	});
	
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


exports["server.api.create: internal events, explicit&added catalog"] = function(test){
	
	
		var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, "test" );
								test.equal( doc.uid,  620793114);
								test.deepEqual( doc.rcpts, [620793114, 620793115]);
								test.equal(typeof doc.ctime, "number");								
								
								//save doc to db...returns with _id:12345
								doc._id = "50187f71556efcbb25000001";
								ret_handler(null,doc);	
							}
		}}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./api":api}
		
	});
				
	var server = sandbox.require("../lib/server",{
		requires:{"./sandbox":sb,"./api":api}
		
	});
	
	server.api.config.add_create_handler(function(params){
			
		return params.catalog == "dummy";	
	});
	
	
	server.api.config.rcpts(function(doc,ret_handler){
	
		
		test.notEqual(doc,undefined);		
		ret_handler([620793115]);
	});
	
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
				
		test.expect(12);		
		test.done();
	});								
	
}


exports["server.api.create: internal events, explicit&added catalog, ro db"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	var db = {	
							save:function(col_str, doc ,ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, "test" );
								test.equal( doc.uid, 620793114 );
								test.deepEqual( doc.rcpts, [620793114,620793115]);
								
								
								//save doc to db...
								doc._id = "50187f71556efcbb25000666";
								dbdocs["50187f71556efcbb25000666"] = doc;
								ret_handler(null,doc);	
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
		requires:{"./api":api}
	});			
	
	var server = sandbox.require("../lib/server",{
		requires:{"./api":api,"./db":db,"./sandbox":sb}
		
	});
	
	server.api.config.add_create_handler(function(params){
			
		return params.catalog == "dummy";	
	});
	
	
	server.api.config.rcpts(function(doc,ret_handler){
	
		
		test.notEqual(doc,undefined);
		
		server.db.select("dummy","50187f71556efcbb25000002",function(err,val){
			
			test.equal(val.a,2);			
			ret_handler([val.uid]);
		});		
		
	});
					
	server.api.events.on("ev_api_create", function(msg){
		
		test.equal(msg.ev_type,"ev_api_create");
		test.equal(msg.ev_ctx.params.uid, 620793114);
		test.equal(msg.ev_ctx.params.catalog, "dummy");			
				
	});
	
	server.api.create(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val,undefined);						
				
		test.expect(11);		
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
					
					test.equal(col_str, "docs");
					test.equal(id_str, "50187f71556efcbb25000001");
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
		
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});	
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api,"./db":db}		
	});
				
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	
						
	server.api.events.on("ev_api_dispose", function(msg){
		
		test.equal(msg.ev_type,"ev_api_dispose");		
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793114);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "docs");							
									
	});
				
	
	server.api.dispose(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,1);						
				
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
													
					test.equal(col_str,"docs");																								
					test.deepEqual( doc.rcpts, [620793115, 620793114]);
										
					setTimeout(function(){
						
						ret_handler(null,doc);
					},50);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					test.equal(col_str, "docs");
					test.equal(id_str, "50187f71556efcbb25000001");
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	
						
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
				
		test.expect(12);		
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
													
					test.equal(col_str,"docs");																								
					test.deepEqual( doc.rcpts, [620793115]);
										
					setTimeout(function(){
						
						ret_handler(null,doc);
					},50);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					test.equal(col_str, "docs");
					test.equal(id_str, "50187f71556efcbb25000001");
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	
						
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
				
		test.expect(12);		
		test.done();
	});
						
}


exports["server.api.add: internal events, default catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"c", value:[]};	
	
	var dbdocs = {};//documents at db	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115, catalog:"docs"},
		dbdocs["50187f71556efcbb25000555"] = {_id:"50187f71556efcbb25000555",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115, catalog:"docs"};
	
	var db =  {	
				save:function(col_str, doc, ret_handler){
													
					test.equal(col_str,"docs");																								
					test.deepEqual( doc.rcpts, [620793115, 620793116]);
					test.deepEqual(doc.c,[]);
										
					setTimeout(function(){
						
						ret_handler(null,doc);
					},50);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					test.equal(col_str, "docs");
					test.equal(id_str, "50187f71556efcbb25000001");
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	
						
	server.api.events.on("ev_api_add", function(msg){
		
		test.equal(msg.ev_type,"ev_api_add");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, params.uid);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "docs");													
	});
				
	
	server.api.add(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,1);						
				
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
				save:function(col_str, doc, ret_handler){
													
					test.equal(col_str,"dummy");																								
					test.deepEqual( doc.rcpts, [620793115, 620793116]);
					test.equal(doc.b,undefined);
										
					setTimeout(function(){
						
						ret_handler(null,doc);
					},50);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					test.equal(col_str, "dummy");
					test.equal(id_str, "50187f71556efcbb25000001");
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	
						
	server.api.events.on("ev_api_remove", function(msg){
		
		test.equal(msg.ev_type,"ev_api_remove");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	});
				
	
	server.api.remove(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,1);						
				
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
				save:function(col_str, doc, ret_handler){
													
					test.equal(col_str,"dummy");																								
					test.deepEqual( doc.rcpts, [620793115, 620793116]);
					test.equal(doc.a,5);
										
					setTimeout(function(){
						
						ret_handler(null,doc);
					},50);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					test.equal(col_str, "dummy");
					test.equal(id_str, "50187f71556efcbb25000001");
					test.equal(dbdocs[id_str].a,1);
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	
						
	server.api.events.on("ev_api_set", function(msg){
		
		test.equal(msg.ev_type,"ev_api_set");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	});
				
	
	server.api.set(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,1);						
				
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
				save:function(col_str, doc, ret_handler){
													
					test.equal(col_str,"dummy");																								
					test.deepEqual( doc.rcpts, [620793115, 620793116]);
					test.deepEqual(doc.a,[4,6,9]);
										
					setTimeout(function(){
						
						ret_handler(null,doc);
					},50);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					test.equal(col_str, "dummy");
					test.equal(id_str, "50187f71556efcbb25000001");
					test.deepEqual(dbdocs[id_str].a,[4,6]);
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
	
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
				
	
	server.api.push(params, function(err,val){
		
		test.ok(flag);
		test.equal(err,undefined);
		test.equal(val,1);						
				
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
				save:function(col_str, doc, ret_handler){
													
					test.equal(col_str,"dummy");																								
					test.deepEqual( doc.rcpts, [620793115, 620793116]);
					test.deepEqual(doc.a,[-4,"foo"]);
										
					setTimeout(function(){
						
						ret_handler(null,doc);
					},50);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					test.equal(col_str, "dummy");
					test.equal(id_str, "50187f71556efcbb25000001");
					test.deepEqual(dbdocs[id_str].a,[-4,"foo",6]);
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
							
	server.api.events.on("ev_api_pop", function(msg){
		
		test.equal(msg.ev_type,"ev_api_pop");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	});
				
	
	server.api.pop(params, function(err,val){
				
		test.equal(err,undefined);
		test.equal(val,1);						
				
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
				save:function(col_str, doc, ret_handler){
													
					test.equal(col_str,"dummy");																								
					test.deepEqual( doc.rcpts, [620793115, 620793116]);
					test.deepEqual(doc.a,["foo",6]);
										
					setTimeout(function(){
						
						ret_handler(null,doc);
					},50);	
				},
				
				select:function(col_str, id_str, ret_handler){
					
					test.equal(col_str, "dummy");
					test.equal(id_str, "50187f71556efcbb25000001");
					test.deepEqual(dbdocs[id_str].a,[-4,"foo",6]);
					
					setTimeout(function(){//50ms delay retrieving document
						
						ret_handler(null,dbdocs[id_str]);
					},50);	
				}
	};
	   
	var api = sandbox.require("../lib/api",{
		requires:{"./db":db}
	});
	
	var sb = sandbox.require("../lib/sandbox",{
		
		requires:{"./api":api, "./db":db}		
	});
					
	var server = sandbox.require("../lib/server",{
		
		requires:{"./api":api,"./sandbox":sb}		
	});
							
	server.api.events.on("ev_api_shift", function(msg){
		
		test.equal(msg.ev_type,"ev_api_shift");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_ctx.params.uid, 620793116);
		test.equal(msg.ev_ctx.params.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_ctx.params.catalog, "dummy");													
	});
				
	
	server.api.shift(params, function(err,val){
				
		test.equal(err,undefined);
		test.equal(val,1);						
				
		test.expect(13);		
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
			
	server.api.config.newop("newop", function(ctx, ret_handler){
		
			
		ctx.config.save = 0;
		test.deepEqual(ctx.params, myparams);
		test.deepEqual(ctx.doc,{});		
		server.api.events.emit("ev_api_newop", ctx);		
		ret_handler(null,1);
	});
	
	test.notEqual(server.api.newop, undefined);
	test.notEqual( api.remote["newop"], undefined );
	
	
	server.api.events.on("ev_api_newop", function(msg, rcpts){
		
		
		test.deepEqual(msg.ev_ctx.params, myparams);
		test.equal( rcpts, undefined );
					
	});
				
	//make invocation
	server.api.newop( myparams, function(err,val){
	
		
		test.equal(val,1);
		test.equal(err,null);	
		
		test.expect(8);
		test.done();
	});
		
}


exports["server.api.config.newop: cancel default event"] = function(test){
	
	
	var server = require("../lib/server");
	var api = require("../lib/api");	
	var myparams = {foo:1, bar:"test"};
	
	server.api.config.newop("dummy", function(params, ret_handler){
				
		test.deepEqual(params, myparams);
		server.api.events.cancel_default_event();
		ret_handler(null,1);
		
	});
		
	server.api.events.on("ev_api_dummy", function(params, rcpts){
				
		test.ok(false);		
	});
		
	
	test.notEqual( api.remote["dummy"], undefined );
	test.notEqual( server.api["dummy"], undefined );
	server.api["dummy"](myparams, function(err,val){
		
		test.equal(err,null);
		test.ok(val);		
	});
	
	test.expect(5);
	test.done();
}


exports["server.api.config.newop: event custom params"] = function(test){
	
	var nevents = 0;
	var rcpts = [5,6,7,8];
	var db = {
				
		save:function(col_str, doc, ret_handler){
						
			test.equal(doc.ev_rcpt, rcpts[nevents++] );
			test.equal(col_str,"events");																
			test.equal( doc.ev_msg.ev_type, "ev_api_dummy");
			test.deepEqual( doc.ev_msg.ev_data, {test:1});
			
			//save doc to db...returns with _id:12345			
			ret_handler(null,doc);	
		}	
		
	};
	
	var api = sandbox.require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{ "./db":db, "./api":api }
	});
	
	var server = sandbox.require("../lib/server",{
		requires:{ "./evqueue":eq, "./api":api }
	});
	
		
		
	var myparams = {foo:1, bar:"test"};
	
	server.api.config.newop("dummy", function(params, ret_handler){
		
				
		test.deepEqual(params, myparams);
		server.api.events.ev_api_dummy.params = {test:1};
		server.api.events.ev_api_dummy.rcpts = rcpts;
		ret_handler(null,1);
		
	});
		
	server.api.events.on("ev_api_dummy", function(params, rcpts){
		
		test.equal(nevents,4);
		test.deepEqual(params.ev_data,{test:1});
		test.deepEqual(rcpts,[5,6,7,8]);				
		test.done();			
	});
		
	
	test.notEqual( api.remote["dummy"], undefined );
	test.notEqual( server.api["dummy"], undefined );
	server.api["dummy"](myparams, function(err,val){
		
		test.equal(err,null);
		test.ok(val);		
	});
	
	
	
}



exports["server.api.config.newop: create based op"] = function(test){
	
	var myparams = {uid:620793114, doc:{test:"test"}};	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							save:function(col_str, doc, ret_handler){
								
								test.equal(col_str,"docs");								
								test.equal( doc.test, myparams.doc.test );
								test.equal( doc.uid, myparams.uid );
								//beacause init.rcpts is null the initial rcpts list is [uid]
								test.deepEqual( doc.rcpts, [myparams.uid]);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345, test:"test", uid:620793114, rcpts:[620793114]});	
							}
		}}
	});
	
	var server = sandbox.require("../lib/server",{
		requires:{"./api":api}
	});
			
	//Registation of two custom operations, one of them calls the primitive operation 'create'.
	server.api.config.newop("newop2", function(params, ret_handler){
		
		server.api.events.cancel_default_event();
		server.api.events.emit("ev_api_newop2");
		ret_handler();
	});
	test.notEqual( api.remote["newop2"], undefined );
	test.notEqual( server.api.newop2, undefined );
	
	server.api.config.newop("newop1", function(params, ret_handler){
				
		test.deepEqual(params, myparams);	
								
		//call primitive function
							
		server.api.create( params, function(err, val){
							
			server.api.events.ev_api_newop1.params = {dummy:1};	
			server.api.events.ev_api_newop1.rcpts = [620793114];
			ret_handler(err,val);				
		});	
						
	});
	test.notEqual( api.remote["newop1"], undefined );
	test.notEqual( server.api.newop1, undefined );		
	
	//ev_newop1 will be emitted by default.
	server.api.events.on("ev_api_newop1", function(params, rcpts){
					
		test.deepEqual( params.ev_data, {dummy:1} );
		test.deepEqual( rcpts, [620793114] );
		test.expect(17);
		test.done();	
			
	}).on("ev_api_create", function(params, rcpts){
				
		test.equal(rcpts, undefined);
		
		test.equal(params.ev_data.uid, 620793114);
		test.equal(params.ev_data.catalog, "docs");
		test.notEqual(params.ev_data.doc, undefined);
	});
	
	
	
	api.remote["newop2"]({},function(){});
	
	api.remote["newop1"](myparams, function(err,val){
				
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});
	});
		
}



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






