var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var flags = [0,0];	
	var server = sandbox.require("../lib/server",
		{
			requires:{"./api":{	//db mock module for pull procedure
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
	}),				
	server = sandbox.require("../lib/server",{
		requires:{"./api":api}
		
	});
	
					
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
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.equal( doc.rcpts, undefined); //No rcpt defined because this catalog is not notifyable.
								
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
		test.notEqual(msg.ev_data.doc.uid, undefined);
		test.notEqual(msg.ev_data.doc.rcpts, undefined);
				
	});
	
	server.api.docs.create(params, function(err,val){
		
		test.equal(err,undefined);
		test.notEqual(val);
		test.deepEqual(val,{wid:"12345"});					
				
		test.expect(14);		
		test.done();
	});
					
	
}

