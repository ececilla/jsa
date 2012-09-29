var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var flags = [0,0];	
	var server = sandbox.require("../lib/server",
		{
			requires:{"./api":{	//db mock module
								remote:{
									remote_func: function(){
														
										flags[0] = 1;								
									}
								},									
								init:{
									init_func: function(){
										
										flags[1] = 1;
									}
								}	
							 
							}
					}
		});
	
	test.notEqual( server.settings, undefined );
	test.notEqual( server.start, undefined );
	test.notEqual( server.stop, undefined );
	test.notEqual( server.events.on, undefined );
	test.notEqual( server.events.emit, undefined );
	test.notEqual( server.api.docs, undefined );
	test.notEqual( server.api.docs.remote_func, undefined  );
	test.notEqual( server.api.newop, undefined );
	test.notEqual( server.api.init, undefined );
	test.notEqual( server.api.init.init_func, undefined  );
	test.notEqual( server.api.events, undefined );
	test.notEqual( server.api.events.on, undefined );
	test.notEqual( server.api.events.emit, undefined );
		
	test.notEqual( server.eq.events.on, undefined );
	test.notEqual( server.eq.events.emit, undefined );
	test.notEqual( server.db, undefined );
	
	//check exported functions can be invoked.
	server.api.docs.remote_func();
	test.ok(flags[0]);
	
	server.api.init.init_func();	
	test.ok(flags[1]);
	
	test.expect(18);	
	test.done();
}

exports["server.events.on: custom server events"] = function(test){
	
	var server = require("../lib/server");
	var params = {test:1};
	var rcpts = [1,2,3,4];
	server.events.on("ev_srv_start", function( _params, _rcpts){
		
		test.deepEqual(_params.ev_data, {test:1});
		test.deepEqual(_rcpts,[1,2,3,4]);
		test.done();
	});
	
	server.events.emit("ev_srv_start", params, rcpts );	
	
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
	var params = {test:1};
	var rcpts = [1,2,3,4];
	server.api.events.on("ev_api_dummyop", function( _params, _rcpts){
		
		test.deepEqual(_params.ev_data, {test:1});
		test.deepEqual(_rcpts,[1,2,3,4]);
		test.done();
	});
	
	server.api.events.emit("ev_api_dummyop", params, rcpts );	
	
}




exports["server.api.docs.create: internal api events, default catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
																
								test.equal(col_str,"docs");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.deepEqual( doc.rcpts, [620793114]);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345});	
							}
		}}
	});				
	var server = sandbox.require("../lib/server",{
		requires:{"./api":api}
		
	});
	
	//two ev_api_create handlers.				
	server.api.events
				.on("ev_api_create", function(msg){
		
					test.equal(msg.ev_type,"ev_api_create");
					test.equal(msg.ev_data.uid, params.uid);
					test.equal(msg.ev_data.catalog, "docs");
					test.notEqual(msg.ev_data.doc.uid, undefined);
					test.notEqual(msg.ev_data.doc.rcpts, undefined);				
				})				
				.on("ev_api_create",function(msg){
					test.equal(msg.ev_type,"ev_api_create");
					
				});
	
	server.api.docs.create(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val);
		test.deepEqual(val,{wid:"12345"});					
				
		test.expect(13);		
		test.done();
	});
					
	
}


exports["server.api.docs.create: internal events, explicit catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	
							save:function(col_str,doc,ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.equal( doc.rcpts, undefined); //No rcpt defined because this catalog is not notifiyable.
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345});	
							}
		}}
	}),			
	
	server = sandbox.require("../lib/server",{
		requires:{"./api":api}
		
	});
	
					
	server.api.events.on("ev_api_create", function(msg){
		
		test.equal(msg.ev_type,"ev_api_create");
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.catalog, "dummy");
		test.notEqual(msg.ev_data.doc.uid, undefined);
		test.equal(msg.ev_data.doc.rcpts, undefined);
		
		
	});
	
	server.api.docs.create(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val);
		test.deepEqual(val,{wid:"12345"});					
				
		test.expect(12);		
		test.done();
	});
						
}


exports["server.api.docs.create: internal events, explicit&added catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc ,ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.deepEqual( doc.rcpts, [620793114,620793115]);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345});	
							}
		}}
	}),			
	
	server = sandbox.require("../lib/server",{
		requires:{"./api":api}
		
	});
	
	server.api.init.add_create_handler(function(params){
			
		return params.doc.test == "test";	
	});
	
	
	server.api.init.rcpts(function(doc,db,ret_handler){
	
		
		test.notEqual(doc,undefined);
		test.notEqual(db,undefined);		
		ret_handler([620793115]);
	});
					
	server.api.events.on("ev_api_create", function(msg){
		
		test.equal(msg.ev_type,"ev_api_create");
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.catalog, "dummy");
		test.equal(msg.ev_data.doc.uid, params.uid);
		test.notEqual(msg.ev_data.doc.rcpts, undefined);
				
	});
	
	server.api.docs.create(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val,undefined);
		test.deepEqual(val,{wid:"12345"});					
				
		test.expect(14);		
		test.done();
	});
					
	
}


exports["server.api.docs.create: internal events, explicit&added catalog, ro db"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};
	var dbdocs = {};//documents at db	
		dbdocs["1234"] = {_id:"1234",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
		    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	
							save:function(col_str, doc ,ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.deepEqual( doc.rcpts, [620793114,620793115]);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:"56ff8"});	
							},
							
							select:function(col_str, id_str, ret_handler){
																															
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
							
		}}
	}),			
	
	server = sandbox.require("../lib/server",{
		requires:{"./api":api}
		
	});
	
	server.api.init.add_create_handler(function(params){
			
		return params.doc.test == "test";	
	});
	
	
	server.api.init.rcpts(function(doc,db,ret_handler){
	
		
		test.notEqual(doc,undefined);
		test.notEqual(db,undefined);
		test.notEqual(db.select, undefined);
		test.equal(db.save, undefined);
		test.equal(db.remove, undefined);
		test.equal(db.connect, undefined);
		
		db.select("dummy","5678",function(err,val){
			
			test.equal(val.a,2);			
			ret_handler([val.uid]);
		});		
		
	});
					
	server.api.events.on("ev_api_create", function(msg){
		
		test.equal(msg.ev_type,"ev_api_create");
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.catalog, "dummy");
		test.equal(msg.ev_data.doc.uid, params.uid);
		test.notEqual(msg.ev_data.doc.rcpts, undefined);
				
	});
	
	server.api.docs.create(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val,undefined);
		test.deepEqual(val,{wid:"56ff8"});					
				
		test.expect(19);		
		test.done();
	});
					
	
}



exports["server.api.docs.join: internal events, default catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793114};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2, b:"test5678", rcpts:[620793115], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"docs");																								
								test.deepEqual( doc.rcpts, [620793115, 620793114]);
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,{_id:12345});
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
	
						
	server.api.events.on("ev_api_join", function(msg){
		
		test.equal(msg.ev_type,"ev_api_join");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "docs");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115]);							
	});
				
	
	server.api.docs.join(params, function(err,val){
		
		test.equal(err,undefined);
		test.deepEqual(val,{doc:{a:1, b:"test1234", uid:620793115, wid:"50187f71556efcbb25000001"}});						
				
		test.expect(12);		
		test.done();
	});
						
}


exports["server.api.docs.unjoin: internal events, default catalog"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"docs");																								
								test.deepEqual( doc.rcpts, [620793115]); //params.uid removed from rcpts
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
	
						
	server.api.events.on("ev_api_unjoin", function(msg){
		
		test.equal(msg.ev_type,"ev_api_unjoin");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "docs");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115]);							
	});
				
	
	server.api.docs.unjoin(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
				
		test.expect(12);		
		test.done();
	});
						
}


exports["server.api.docs.add: internal events, default catalog, wrong ev handler"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"c", value:[]};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"docs");																								
								test.deepEqual( doc.c, []); //field added to doc
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
		
	var flag = 1;					
	server.api.events.on("ev_api_add", function(msg){
		
		test.equal(msg.ev_type,"ev_api_add");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "docs");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);							
	}).on("ev_api_unjoin",function(msg){
		
		flag = 0; //should not reach this point because ev_api_unjoin is never triggered
	});
				
	
	server.api.docs.add(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}


exports["server.api.docs.remove: internal events, explicit catalog, wrong ev handler"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"b", catalog:"dummy"};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");																								
								test.equal( doc.b, undefined ); //field removed from doc
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);								
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
		
	var flag = 1;					
	server.api.events.on("ev_api_rem", function(msg){
		
		test.equal(msg.ev_type,"ev_api_rem");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);							
	}).on("ev_api_create",function(msg){
		
		flag = 0; //should not reach this point because ev_api_unjoin is never triggered
	});
				
	
	server.api.docs.remove(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}




exports["server.api.docs.set: internal events, explicit catalog, wrong ev handler"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", value:5, catalog:"dummy"};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");																								
								test.equal( doc.a, 5 ); //field 'a' set to number 5
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);								
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
		
		
	var flag = 1;					
	server.api.events.on("ev_api_set", function(msg){
		
		test.equal(msg.ev_type,"ev_api_set");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);							
	}).on("ev_api_create",function(msg){
		
		flag = 0; //should not reach this point because ev_api_create is never triggered
	});					
	
	server.api.docs.set(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}


exports["server.api.docs.incr: internal events, explicit catalog, wrong ev handler"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", catalog:"dummy"};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:1, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");																								
								test.equal( doc.a, 2 ); //field 'a' incr to 2
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);																
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),	
				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
	
	var flag = 1;					
	server.api.events.on("ev_api_incr", function(msg){
		
		test.equal(msg.ev_type,"ev_api_incr");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_api_create",function(msg){
		
		flag = 0; //should not reach this point because ev_api_create is never triggered
	});	
	
	server.api.docs.incr(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}

exports["server.api.docs.decr: internal events, explicit catalog, wrong ev handler"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", catalog:"dummy"};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:8, b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");																								
								test.equal( doc.a, 7 ); //field 'a' decr to 7
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);																
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),	
				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
	
	var flag = 1;					
	server.api.events.on("ev_api_decr", function(msg){
		
		test.equal(msg.ev_type,"ev_api_decr");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_api_incr",function(msg){
		
		flag = 0; //should not reach this point because ev_api_create is never triggered
	});	
	
	server.api.docs.decr(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}


exports["server.api.docs.push: internal events, explicit catalog, wrong ev handler"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", value:9, catalog:"dummy"};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:[4,6], b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");																								
								test.deepEqual( doc.a, [4,6,9] ); //field 'a' has value [4,6,9]
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);																
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),	
				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
	
	var flag = 1;					
	server.api.events.on("ev_api_push", function(msg){
		
		test.equal(msg.ev_type,"ev_api_push");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_api_decr",function(msg){
		
		flag = 0; //should not reach this point because ev_api_decr is never triggered
	});	
	
	server.api.docs.push(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}

exports["server.api.docs.pop: internal events, explicit catalog, wrong ev handler"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", catalog:"dummy"};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:[-4,"foo",3], b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");																								
								test.deepEqual( doc.a, [-4,"foo"] ); //field 'a' has value [-4,"foo"]
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);																
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),	
				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
	
	var flag = 1;					
	server.api.events.on("ev_api_pop", function(msg){
		
		test.equal(msg.ev_type,"ev_api_pop");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_api_push",function(msg){
		
		flag = 0; //should not reach this point because ev_api_push is never triggered
	});	
	
	server.api.docs.pop(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}


exports["server.api.docs.shift: internal events, explicit catalog, wrong ev handler"] = function(test){
	
	var params = {wid:"50187f71556efcbb25000001", uid:620793116, fname:"a", catalog:"dummy"};
	var dbdocs = {};//documents at db
	
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", a:[-4,"foo",3], b:"test1234", rcpts:[620793115, 620793116], uid:620793115},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115, 620793116], uid:620793115};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str, doc, ret_handler){
																
								test.equal(col_str,"dummy");																								
								test.deepEqual( doc.a, ["foo",3] ); //field 'a' has value ["foo",3]
								
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,0);
								},100);	
							},
							
							select:function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);																
								
								setTimeout(function(){//50ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},50);	
							}
		}}
	}),	
				
	server = sandbox.require("../lib/server",{
		
		requires:{"./api":api}		
	});
	
	var flag = 1;					
	server.api.events.on("ev_api_shift", function(msg){
		
		test.equal(msg.ev_type,"ev_api_shift");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_api_pop",function(msg){
		
		flag = 0; //should not reach this point because ev_api_pop is never triggered
	});	
	
	server.api.docs.shift(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}


exports["server.api.events.emit"] = function(test){
	
	var server = require("../lib/server");
	var myparams = {foo:1, bar:"bar"},
		myrcpts = [1,2,3];
	
	server.api.events.on("ev_bar", function(params, rcpts){
		
		test.deepEqual( params.ev_data, myparams );
		test.equal( rcpts, myrcpts );
		test.done();	
	});
	
	server.api.events.emit("ev_bar", myparams, myrcpts);	
	
}



exports["server.api.docs.newop: invocation"] = function(test){
	
	var server = require("../lib/server");
	var api = require("../lib/api");	
		
	var myparams = {foo:1, bar:"test"};
		
	
	server.api.newop("newop", function(params, ret_handler){
		
		test.deepEqual(params, myparams);		
		ret_handler(null,1);
	});
	
	test.notEqual(server.api.docs.newop, undefined);
	
	//ev_newop will be emitted by default.
	server.api.events.on("ev_newop", function(params, rcpts){
		
		test.deepEqual( params.ev_data, myparams );
		test.equal( rcpts, undefined );
		test.expect(7);
		test.done();		
	});
	
	
	
	test.notEqual( api.remote["newop"], undefined );
	api.remote["newop"](myparams, function(err,val){
		
		test.equal(err,null);
		test.ok(val);
	});
	
	
}


exports["server.api.docs.newop: cancel default event"] = function(test){
	
	
	var server = require("../lib/server");
	var api = require("../lib/api");	
	var myparams = {foo:1, bar:"test"};
	
	server.api.newop("dummy", function(params, ret_handler){
				
		test.deepEqual(params, myparams);
		server.api.events.cancel_default_event();
		ret_handler(null,1);
		
	});
		
	server.api.events.on("ev_dummy", function(params, rcpts){
				
		test.ok(false);		
	});
		
	
	test.notEqual( api.remote["dummy"], undefined );
	test.notEqual( server.api.docs["dummy"], undefined );
	server.api.docs["dummy"](myparams, function(err,val){
		
		test.equal(err,null);
		test.ok(val);		
	});
	
	test.expect(5);
	test.done();
}


exports["server.api.docs.newop: event custom params"] = function(test){
	
	var nevents = 0;
	var rcpts = [5,6,7,8];
	var db = {
				
		save:function(col_str, doc, ret_handler){
						
			test.equal(doc.ev_rcpt, rcpts[nevents++] );
			test.equal(col_str,"events");																
			test.equal( doc.ev_msg.ev_type, "ev_dummy");
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
	
	server.api.newop("dummy", function(params, ret_handler){
		
				
		test.deepEqual(params, myparams);
		server.api.events.ev_dummy.params = {test:1};
		server.api.events.ev_dummy.rcpts = rcpts;
		ret_handler(null,1);
		
	});
		
	server.api.events.on("ev_dummy", function(params, rcpts){
		
		test.equal(nevents,4);
		test.deepEqual(params.ev_data,{test:1});
		test.deepEqual(rcpts,[5,6,7,8]);				
		test.done();			
	});
		
	
	test.notEqual( api.remote["dummy"], undefined );
	test.notEqual( server.api.docs["dummy"], undefined );
	server.api.docs["dummy"](myparams, function(err,val){
		
		test.equal(err,null);
		test.ok(val);		
	});
	
	
	
}



exports["server.api.docs.newop: create based op"] = function(test){
	
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
	server.api.newop("newop2", function(params, ret_handler){
		
		server.api.events.cancel_default_event();
		server.api.events.emit("ev_newop2");
		ret_handler();
	});
	test.notEqual( api.remote["newop2"], undefined );
	test.notEqual( server.api.docs.newop2, undefined );
	
	server.api.newop("newop1", function(params, ret_handler){
				
		test.deepEqual(params, myparams);	
								
		//call primitive function
							
		server.api.docs.create( params, function(err, val){
							
			server.api.events.ev_newop1.params = {dummy:1};	
			server.api.events.ev_newop1.rcpts = [620793114];
			ret_handler(err,val);				
		});	
						
	});
	test.notEqual( api.remote["newop1"], undefined );
	test.notEqual( server.api.docs.newop1, undefined );		
	
	//ev_newop1 will be emitted by default.
	server.api.events.on("ev_newop1", function(params, rcpts){
					
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



exports["server.api.docs.newop: db raw access based op"] = function(test){
	
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
				
	
	server.api.newop("newop3", function(params, ret_handler){
				
		test.deepEqual(params, myparams); 		
		
		//recuperamos un usuario
		server.db.select(params.catalog, ""+params.uid, function(err,user){
			
			user.newfield = 999;
			
			server.db.save(params.catalog, user, function(err,val){
				
				server.api.events.ev_newop3.params = {dummy:1};						
				ret_handler(err,val);
			});
			
		});	
																	
	});	
	
	//ev_newop3 will be emitted by default.
	server.api.events.on("ev_newop3", function(params, rcpts){
					
		test.deepEqual( params.ev_data, {dummy:1} );			
		test.done();	
			
	});
				
	
	api.remote["newop3"](myparams, function(err,val){
				
		test.equal(err,null);	
				
	});
		
}



exports["server.api.docs.newop: wid based op"] = function(test){
	
		
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
				  			test.equal(doc.ev_msg.ev_type,"ev_foo1");
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
						
	
	server.api.newop("foo1", function(params, ret_handler){
						
		test.notEqual(params.doc, undefined);	
		test.deepEqual(params.doc, dbdocs["50187f71556efcbb25000001"] );	
		test.deepEqual(params, myparams);
		
		//operacion set hecha desde newop
		params.doc[params.fname] = params.value;	
		ret_handler(null,1);
		
	});
		
	server.api.events.on("ev_foo1", function(params, rcpts){
		
		test.equal(rcpts,undefined);
		test.equal(params.ev_type, "ev_foo1");
		test.deepEqual(params.ev_data.doc,dbdocs["50187f71556efcbb25000001"]);		
						
		test.done();			
	});
		
	
	test.notEqual( api.remote["foo1"], undefined );
	test.notEqual( server.api.docs["foo1"], undefined );
	api.remote["foo1"](myparams, function(err,val){
		
		test.equal(err,null);
		test.ok(val);		
	});
	
		
}






