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
	test.notEqual( server.api.docs, undefined );
	test.notEqual( server.api.docs.remote_func, undefined  );
	test.notEqual( server.api.init, undefined );
	test.notEqual( server.api.init.init_func, undefined  );
	test.notEqual( server.api.events, undefined );
	test.notEqual( server.api.events.on, undefined );
	
	//check exported functions can be invoked.
	server.api.docs.remote_func();
	test.ok(flags[0]);
	
	server.api.init.init_func();	
	test.ok(flags[1]);
	
	test.expect(11);	
	test.done();
}


exports["server.api.docs.create: internal events, default catalog"] = function(test){
	
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
	
	//two ev_create handlers.				
	server.api.events
				.on("ev_create", function(msg){
		
					test.equal(msg.ev_type,"ev_create");
					test.equal(msg.ev_data.uid, params.uid);
					test.equal(msg.ev_data.catalog, "docs");
					test.notEqual(msg.ev_data.doc.uid, undefined);
					test.notEqual(msg.ev_data.doc.rcpts, undefined);				
				})				
				.on("ev_create",function(msg){
					test.equal(msg.ev_type,"ev_create");
					
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
	
					
	server.api.events.on("ev_create", function(msg){
		
		test.equal(msg.ev_type,"ev_create");
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
	
	server.api.init.addcreatehandler(function(params){
			
		return params.doc.test == "test";	
	});
	
	
	server.api.init.rcpts(function(doc,db,ret_handler){
	
		
		test.notEqual(doc,undefined);
		test.notEqual(db,undefined);		
		ret_handler([620793115]);
	});
					
	server.api.events.on("ev_create", function(msg){
		
		test.equal(msg.ev_type,"ev_create");
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
	
	server.api.init.addcreatehandler(function(params){
			
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
					
	server.api.events.on("ev_create", function(msg){
		
		test.equal(msg.ev_type,"ev_create");
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
	
						
	server.api.events.on("ev_join", function(msg){
		
		test.equal(msg.ev_type,"ev_join");
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
	
						
	server.api.events.on("ev_unjoin", function(msg){
		
		test.equal(msg.ev_type,"ev_unjoin");
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
	server.api.events.on("ev_add", function(msg){
		
		test.equal(msg.ev_type,"ev_add");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "docs");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);							
	}).on("ev_unjoin",function(msg){
		
		flag = 0; //should not reach this point because ev_unjoin is never triggered
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
	server.api.events.on("ev_rem", function(msg){
		
		test.equal(msg.ev_type,"ev_rem");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);							
	}).on("ev_create",function(msg){
		
		flag = 0; //should not reach this point because ev_unjoin is never triggered
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
	server.api.events.on("ev_set", function(msg){
		
		test.equal(msg.ev_type,"ev_set");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);							
	}).on("ev_create",function(msg){
		
		flag = 0; //should not reach this point because ev_create is never triggered
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
	server.api.events.on("ev_incr", function(msg){
		
		test.equal(msg.ev_type,"ev_incr");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_create",function(msg){
		
		flag = 0; //should not reach this point because ev_create is never triggered
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
	server.api.events.on("ev_decr", function(msg){
		
		test.equal(msg.ev_type,"ev_decr");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_incr",function(msg){
		
		flag = 0; //should not reach this point because ev_create is never triggered
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
	server.api.events.on("ev_push", function(msg){
		
		test.equal(msg.ev_type,"ev_push");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_decr",function(msg){
		
		flag = 0; //should not reach this point because ev_decr is never triggered
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
	server.api.events.on("ev_pop", function(msg){
		
		test.equal(msg.ev_type,"ev_pop");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_push",function(msg){
		
		flag = 0; //should not reach this point because ev_push is never triggered
	});	
	
	server.api.docs.pop(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}


exports["server.api.docs.pull: internal events, explicit catalog, wrong ev handler"] = function(test){
	
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
	server.api.events.on("ev_pull", function(msg){
		
		test.equal(msg.ev_type,"ev_pull");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(msg.ev_data.uid, params.uid);
		test.equal(msg.ev_data.wid, "50187f71556efcbb25000001");					
		test.equal(msg.ev_data.catalog, "dummy");					
		test.deepEqual(msg.ev_data.doc.rcpts, [620793115, 620793116]);	
								
	}).on("ev_pop",function(msg){
		
		flag = 0; //should not reach this point because ev_pop is never triggered
	});	
	
	server.api.docs.pull(params, function(err,val){
		
		test.equal(err,undefined);
		test.equal(val,0);						
		test.ok(flag);		
		test.expect(13);		
		test.done();
	});
						
}



