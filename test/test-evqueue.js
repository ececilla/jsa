var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var eq = require("../lib/evqueue");
	test.notEqual( eq.remote.subscribe, undefined);
	test.notEqual( eq.get_subscription, undefined );
	test.notEqual( eq.rem_subscription, undefined);
	test.notEqual( eq.add_subscription, undefined);
	test.notEqual( eq.is_subscribed, undefined);
	test.done();
}

exports["evqueue.add_subscription"] = function(test){
	
	var eq = require("../lib/evqueue"),
		http_resp = {foo:1},
		uid = 620793114;
	 
	 
	eq.add_subscription(uid, http_resp);
	
	test.deepEqual(eq.get_subscription(uid), {http:http_resp});
	test.done();
}

exports["evqueue.is_subscribed"] = function(test){
	
	var eq = require("../lib/evqueue"),
		http_resp = {foo:1},
		uid = 620793114;
	 
	 
	eq.add_subscription(uid, http_resp);
	
	test.ok(eq.is_subscribed(uid));
	test.done();
}

exports["evqueue.remove_subscription"] = function(test){
	
	var eq = require("../lib/evqueue"),
		http_resp = {foo:1},
		uid = 620793114;
	 
	 
	eq.add_subscription(uid, http_resp);	
	test.deepEqual(eq.get_subscription(uid), {http:http_resp});
	eq.rem_subscription(uid);
	test.ok( !eq.is_subscribed(uid) );
	test.done();
}


exports["evqueue.remote.subscribe: no params"] = function(test){
	
	
	var eq = require("../lib/evqueue");
	
	var flags = [0];	
	var http_resp = {   
						end:function(){ flags[0] = 1;},						
				    }; 
				 
	eq.remote.subscribe(http_resp,undefined);
	test.ok(flags[0]);		
			
	test.done();				
}

exports["evqueue.remote.subscribe: no uid"] = function(test){
	
	
	var eq = require("../lib/evqueue");
	var params = {}
	var flags = [0];	
	var http_resp = {   
						end:function(){ flags[0] = 1;},						
				    }; 
				 
	eq.remote.subscribe(http_resp, params);
	test.ok(flags[0]);		
			
	test.done();				
}



exports["evqueue.remote.subscribe: invocation"] = function(test){
	
	
	var eq = require("../lib/evqueue");
	
	var flags = [0,0];
	var params = {uid:620793114};
	var http_resp = {   
						on:function(){ flags[0] = 1;},
						connection:{
							on:function(){ flags[1] = 1; }
						}
				    }; 
				 
	eq.remote.subscribe(http_resp,params);
	test.ok(flags[0]);
	test.ok(flags[1]);
	test.deepEqual( eq.get_subscription(params.uid), {http:http_resp});
	
		
	test.done();				
}

exports["evqueue.remote.subscribe: invocation with tstamp"] = function(test){
	
	var flags = [0,0];
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								criteria: function(col_str, criteria, order_field, ret_handler){
									
									test.equal(col_str, "events");
									test.deepEqual( order_field, {"ev_msg.ev_tstamp":1} );
																																																		
								}	
					}
		}
	});
	
	
	var params = {uid:620793114, tstamp:79487593593};
	var http_resp = {   
						on:function(){ flags[0] = 1;},
						connection:{
							on:function(){ flags[1] = 1; }
						}
				    }; 
				 
	eq.remote.subscribe(http_resp,params);
	test.ok(flags[0]);
	test.ok(flags[1]);	
	
	test.deepEqual( eq.get_subscription(params.uid), {http:http_resp});
	
	test.expect(5);	
	test.done();				
}


exports["evqueue.on: custom event, explicit rcpts, subscription"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [620793119, 620793115];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var counter = 0;
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	counter:0,
								save: function(col_str, signal, ret_handler){
									
									counter++;																		
									if(signal.ev_rcpt == 620793115){
										
										test.equal(col_str,"events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_dummy");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else if(signal.ev_rcpt == 620793119){
										
										test.equal(col_str, "events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_dummy");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else{
										test.equal(false);
									}
									ret_handler();
																										
								}	
					}
		}
	});
	
			
	/*
	 * 620793115 gets subscribed to the ev channel  
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){// called from within push
																							
								var json_obj = JSON.parse(str);														
								test.equal(json_obj.ev_type,"ev_dummy");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data, rpc_params);
																												
						}
						
				    }; 
				 
	eq.remote.subscribe(http_resp,subs_params);	
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	eq.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"	
	eq.on("ev_eq_push", function(msg, rcpt){
		
		test.equal(msg.ev_type, "ev_eq_push");		
		var out = JSON.parse( msg.ev_data.msg_str);
		test.deepEqual(out.ev_data, rpc_params);		
		test.equal(rcpt,620793115);
		
	});
	var ctx = {doc:undefined,params:rpc_params};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx, rcpts);
	
	test.equal(counter,2);
		
	test.expect(20);
	test.done();
	
}


exports["evqueue.on: listening custom event, wrong event emitted"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [620793119, 620793115];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var flag = 1;	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	
								save: function(col_str, signal, ret_handler){
									
									flag = 0;																																											
								}	
					}
		}
	});
				
	eq.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"			
	api.emit("ev_foo", rpc_params, rcpts);						
	
	test.ok(flag);
	test.done();
	
}



exports["evqueue.on: ev_api_create, reportable document, subscribed in init.rcpts"] = function(test){
		
	var rpc_params = {uid:620793114, doc:{test:"test"}, catalog:"dummy", rcpts:[620793114, 620793115, 620793119]},
	    ircpts = [620793115, 620793119];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module
							save:function(col_str,doc,ret_handler){
													
								test.equal(col_str,"dummy");								
								test.equal( doc.test, rpc_params.doc.test );
								test.equal( doc.uid, rpc_params.uid );
								test.deepEqual( doc.rcpts, [620793114, 620793115, 620793119]);
								
								//save doc to db...returns doc with _id		
								doc._id = "50187f71556efcbb25000001";						
								ret_handler(null,doc);	
							},
							select: function(){
								
							}
		}}
	}),
	eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
																		
									test.equal(col_str, "events");
									ret_handler();									
								}	
					}
		}
	});
		
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																						
								var json_obj = JSON.parse(str);													
								test.equal(json_obj.ev_type,"ev_api_create");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");																								 																  
								test.equal(json_obj.ev_data.catalog,"dummy");
								test.equal(json_obj.ev_data.uid,620793114);
								test.notEqual(json_obj.ev_data.ctime,undefined);
													
						}
						
				    }; 
				 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
		
	var ctx = {doc:undefined, params:rpc_params, config:{save:1, emit:1}};
	api.remote.create(ctx, function(err,val){
		
		test.equal(err,null);
		test.notEqual(val,undefined);	
		test.expect(16);
		test.done();				
		
	});
		
}


exports["evqueue.on: ev_api_create, unreportable document, subscribed"] = function(test){
		
	var rpc_params = {uid:620793114, doc:{test:"ouuug test"}, catalog:"dummy"};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module
							save:function(col_str,doc,ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, rpc_params.doc.test );
								test.equal( doc.uid, rpc_params.uid );
								test.equal( doc.rcpts, undefined);
								
								//save doc to db...returns doc with _id		
								doc._id = "50187f71556efcbb25000001";						
								ret_handler(null,doc);	
							},
							select: function(){
								
							}
		}}
	}), eq_flag = 1,
	eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									eq_flag = 0;//should not reach here since theres no rcpt in this doc.				
								}	
					}
		}
	});				
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0,1]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																								
							subs_flags[2] = 0;//should not reach here since theres no default rcpt	
						}
						
				    }; 
				 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
		
	var ctx = {doc:undefined, params:rpc_params, config:{save:1, emit:1}};
	api.remote.create(ctx, function(err,val){
		
		test.ok(subs_flags[2]);
		test.ok(eq_flag);
		test.equal(err,null);
		test.notEqual(val,undefined);			
		test.expect(10);
		test.done();
	});
		
}

exports["evqueue.on: ev_api_dispose, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114,catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[620793115], uid:620793115, catalog:"docs"},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							removeById: function(col_str, id_str, ret_handler){
																							
								test.equal(col_str, "docs");
								test.equal(id_str, "50187f71556efcbb25000001");
								delete 	dbdocs["50187f71556efcbb25000001"];//delete document							
								ret_handler(null,1);																	
							}	
					}
		}
	});
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, msg, ret_handler){
																		
									test.equal(col_str, "events");
									test.equal(msg.ev_rcpt, 620793115);
									test.notEqual(msg._id, undefined);	
									ret_handler();																	
								}	
					}
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
								
															
								var json_obj = JSON.parse(str);	
										
								test.equal(json_obj.ev_type,"ev_api_dispose");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,catalog:"docs"});
																								
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params,doc:dbdocs["50187f71556efcbb25000001"], config:{save:1,emit:1}};
		
		api.remote.dispose(ctx, function(err,val){
			
			test.equal(err,null);			
			test.notEqual(val,undefined);			
			test.expect(13);
			test.done();
		});
	},500);
		
}




exports["evqueue.on: ev_api_join, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[620793115], uid:620793115, catalog:"docs"},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, msg, ret_handler){
																		
									test.equal(col_str, "events");
									test.equal(msg.ev_rcpt, 620793115);
									test.notEqual(msg._id, undefined);	
									ret_handler();																	
								}	
					}
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
								
															
								var json_obj = JSON.parse(str);	
										
								test.equal(json_obj.ev_type,"ev_api_join");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114});
								test.expect(9);
								test.done();																
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params,doc:dbdocs["50187f71556efcbb25000001"], config:{save:1,emit:1}, user:{wids:[]}};
		ctx.payload = ctx.params;
		api.emit("ev_api_join", ctx );
	},500);
		
}



exports["evqueue.on: ev_api_join, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[620793115], uid:620793115, catalog:"docs"},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api"),
	eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
								}	
					}
		}
	});			
	
	
	/*
	 * 620793119 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0,1]; 	
	var subs_params = {uid:620793119};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																																												
							subs_flags[2] = 0;																	
						}
						
				    }; 
				    					    				
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params,doc:dbdocs["50187f71556efcbb25000001"], config:{save:1,emit:1}, user:{wids:[]}};				
	ctx.payload = ctx.params;
	api.emit("ev_api_join", ctx );
	test.expect(5);
	test.done();
			
}


exports["evqueue.on: ev_api_join autolistening, explicit rcpts"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[620793115], uid:620793115, catalog:"docs"};
	var rcpts = [620793119, 620793115];
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var counter = 0;
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	counter:0,
								save: function(col_str, signal, ret_handler){
									
									counter++;									
									if(signal.ev_rcpt == 620793115){
										
										test.equal(col_str,"events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_join");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else if(signal.ev_rcpt == 620793119){
										
										test.equal(col_str, "events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_join");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else{
										test.equal(false);
									}
																										
								}	
					}
		}
	});
				
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{save:1,emit:1}};		
	ctx.payload = ctx.params;
	api.emit("ev_api_join", ctx, rcpts);
	test.equal(counter,2);					
	
	test.done();
	
}



exports["evqueue.on: ev_api_unjoin, subscribed in rcpts"] = function(test){
	
	//explicit or implit, always there's a param catalog in the context	
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"}; 
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[620793115,620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
									ret_handler();
								}	
					}
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
															
								var json_obj = JSON.parse(str);	
													
								test.equal(json_obj.ev_type,"ev_api_unjoin");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,catalog:"docs"});
								test.done();																
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
		ctx.payload = ctx.params;
		api.emit("ev_api_unjoin", ctx );
	},500);
		
}


exports["evqueue.on: ev_api_unjoin, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[620793115,620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
								}	
					}
		}
	});			
	
	
	/*
	 * 620793119 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0,1]; 	
	var subs_params = {uid:620793119};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																																												
							subs_flags[2] = 0;																	
						}
						
				    }; 
				    					    				
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
	api.emit("ev_api_unjoin",ctx);
	test.done();					
			
}


exports["evqueue.on: ev_api_unjoin autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[620793115,620793114], uid:620793115};
	var rcpts = [620793119, 620793115];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var counter = 0;
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	counter:0,
								save: function(col_str, signal, ret_handler){
									
									counter++;									
									if(signal.ev_rcpt == 620793115){
										
										test.equal(col_str,"events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_unjoin");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else if(signal.ev_rcpt == 620793119){
										
										test.equal(col_str, "events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_unjoin");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else{
										test.equal(false);
									}
																										
								}	
					}
		}
	});
				
	var ctx = {params:rpc_params, doc:doc};		
	ctx.payload = ctx.params;
	api.emit("ev_api_unjoin", ctx, rcpts);
	
	test.equal(counter,2);					
	
	test.done();
	
}



exports["evqueue.on: ev_api_rem, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
									ret_handler();
								}	
					}
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
															
								var json_obj = JSON.parse(str);	
													
								test.equal(json_obj.ev_type,"ev_api_rem");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,fname:"a",catalog:"docs"});								
																								
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
		ctx.payload = ctx.params;
		api.emit("ev_api_rem",ctx);
		test.done();
		
	},500);
		
}


exports["evqueue.on: ev_api_rem, subscribed not  in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a", uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
								}	
					}
		}
	});			
	
	
	/*
	 * 620793119 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0,1]; 	
	var subs_params = {uid:620793119};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																																												
							subs_flags[2] = 0;																	
						}
						
				    }; 
				    					    				
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
	ctx.payload = ctx.params;
	api.emit("ev_api_rem",ctx);				
	
	test.expect(5);
	test.done();
			
}


exports["evqueue.on: ev_api_rem autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115, 620793114], uid:620793115};
	var rcpts = [620793119, 620793115];
	var api = sandbox.require("../lib/api");
	
	var counter = 0;
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	counter:0,
								save: function(col_str, signal, ret_handler){
									
									counter++;									
									if(signal.ev_rcpt == 620793115){
										
										test.equal(col_str,"events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_rem");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else if(signal.ev_rcpt == 620793119){
										
										test.equal(col_str, "events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_rem");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else{
										test.equal(false);
									}
																										
								}	
					}
		}
	});
				
	var ctx = {params:rpc_params, doc:doc };	
	ctx.payload = ctx.params;	
	api.emit("ev_api_rem", ctx, rcpts);
	test.equal(counter,2);					
	
	test.done();
	
}


exports["evqueue.on: ev_api_set, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:5, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
									ret_handler();
								}	
					}
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
															
								var json_obj = JSON.parse(str);	
													
								test.equal(json_obj.ev_type,"ev_api_set");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,fname:"a",value:5,catalog:"docs"});								
																								
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
		ctx.payload = ctx.params;
		api.emit("ev_api_set",ctx);
		test.expect(9);
		test.done();
		
	},500);
		
}

exports["evqueue.on: ev_api_set, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a", value:5, uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
								}	
					}
		}
	});			
	
	
	/*
	 * 620793119 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0,1]; 	
	var subs_params = {uid:620793119};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																																												
							subs_flags[2] = 0;																	
						}
						
				    }; 
				    					    				
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
	ctx.payload = ctx.params;
	
	api.emit("ev_api_set",ctx);					
	test.expect(5);
	test.done();
			
}


exports["evqueue.on: ev_api_set autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115, 620793114], uid:620793115};
	var rcpts = [620793119, 620793115];
	var api = sandbox.require("../lib/api");
	
	var counter = 0;
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	counter:0,
								save: function(col_str, signal, ret_handler){
									
									counter++;									
									if(signal.ev_rcpt == 620793115){
										
										test.equal(col_str,"events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_set");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else if(signal.ev_rcpt == 620793119){
										
										test.equal(col_str, "events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_set");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else{
										test.equal(false);
									}
																										
								}	
					}
		}
	});
				
	var ctx = {params:rpc_params, doc:doc};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_set", ctx, rcpts);
	test.equal(counter,2);					
	test.expect(11);	
	test.done();
	
}




exports["evqueue.on: ev_api_push, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:5, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1], rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
									ret_handler();
								}	
					}
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
															
								var json_obj = JSON.parse(str);	
													
								test.equal(json_obj.ev_type,"ev_api_push");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,fname:"a",value:5,catalog:"docs"});								
																								
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
		ctx.payload = ctx.params;
		api.emit("ev_api_push",ctx);		
		test.expect(9);
		test.done();
		
	},500);
		
}


exports["evqueue.on: ev_api_push, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a",value:5, uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1], rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
								}	
					}
		}
	});			
	
	
	/*
	 * 620793119 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0,1]; 	
	var subs_params = {uid:620793119};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																																												
							subs_flags[2] = 0;																	
						}
						
				    }; 
				    					    				
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
	ctx.payload = ctx.params;
	api.emit("ev_api_push", ctx);
	
	test.expect(5);
	test.done();	
			
}



exports["evqueue.on: ev_api_push autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var rcpts = [620793119, 620793115];
	var api = sandbox.require("../lib/api");
	var doc = {_id:"50187f71556efcbb25000001",a:[1], rcpts:[620793115, 620793114], uid:620793115};
	var counter = 0;
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	counter:0,
								save: function(col_str, signal, ret_handler){
									
									counter++;									
									if(signal.ev_rcpt == 620793115){
										
										test.equal(col_str,"events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_push");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else if(signal.ev_rcpt == 620793119){
										
										test.equal(col_str, "events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_push");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else{
										test.equal(false);
									}
																										
								}	
					}
		}
	});
				
	var ctx = {params:rpc_params, doc:doc};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_push", ctx, rcpts);
	test.equal(counter,2);					
	
	test.expect(11);
	test.done();
	
}

exports["evqueue.on: ev_api_pop, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
									ret_handler();
								}	
					}
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
															
								var json_obj = JSON.parse(str);	
													
								test.equal(json_obj.ev_type,"ev_api_pop");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,fname:"a",catalog:"docs"});								
																								
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
		ctx.payload = ctx.params;
		api.emit("ev_api_pop",ctx);
		test.expect(9);
		test.done();
				
	},500);
		
}

exports["evqueue.on: ev_api_pop, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a", uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	var eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
								}	
					}
		}
	});			
	
	
	/*
	 * 620793119 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0,1]; 	
	var subs_params = {uid:620793119};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																																												
							subs_flags[2] = 0;																	
						}
						
				    }; 
				    					    				
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
	ctx.payload = ctx.params;
	api.emit("ev_api_pop",ctx);
	test.expect(5);
	test.done();
						
			
}


exports["evqueue.on: ev_api_pop autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[620793115, 620793114], uid:620793115};
	var rcpts = [620793119, 620793115];
	var api = sandbox.require("../lib/api");
	
	var counter = 0;
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	counter:0,
								save: function(col_str, signal, ret_handler){
									
									counter++;									
									if(signal.ev_rcpt == 620793115){
										
										test.equal(col_str,"events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_pop");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else if(signal.ev_rcpt == 620793119){
										
										test.equal(col_str, "events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_pop");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else{
										test.equal(false);
									}
																										
								}	
					}
		}
	});
				
	var ctx = {params:rpc_params, doc:doc};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_pop", ctx, rcpts);
	test.equal(counter,2);					
	
	test.expect(11);
	test.done();
	
}

exports["evqueue.on: ev_api_shift, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
									ret_handler();
								}	
					}
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0]; 	
	var subs_params = {uid:620793115};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
															
								var json_obj = JSON.parse(str);	
													
								test.equal(json_obj.ev_type,"ev_api_shift");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,fname:"a",catalog:"docs"});								
																								
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
		ctx.payload = ctx.params;
		api.emit("ev_api_shift",ctx);
		
		test.expect(9);
		test.done();
	},500);
		
}

exports["evqueue.on: ev_api_shift, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a", uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[620793115, 620793114], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api,
					"./db":{
								save: function(col_str, doc, ret_handler){
									
									test.equal(col_str, "events");
									test.equal(doc.ev_rcpt, 620793115);
									test.notEqual(doc._id, undefined);
								}	
					}
		}
	});			
	
	
	/*
	 * 620793119 gets subscribed to the ev channel which means hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_create payload.	 
	 */ 
	var subs_flags = [0,0,1]; 	
	var subs_params = {uid:620793119};
	var http_resp = {   //mock http response oject
						on:function(){ subs_flags[0] = 1;},
						connection:{
							on:function(){ subs_flags[1] = 1; }
						},
						write:function(str){
																																												
							subs_flags[2] = 0;																	
						}
						
				    }; 
				    					    				
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"]};
	ctx.payload = ctx.params;
	api.emit("ev_api_shift",ctx);	
	test.expect(5);
	test.done();						
	
				
}


exports["evqueue.on: ev_api_shift autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114};
	var doc = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[620793115, 620793114], uid:620793115};
	var rcpts = [620793119, 620793115];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var counter = 0;
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	"./api":api,
					"./db":{	counter:0,
								save: function(col_str, signal, ret_handler){
									
									counter++;									
									if(signal.ev_rcpt == 620793115){
										
										test.equal(col_str,"events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_shift");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else if(signal.ev_rcpt == 620793119){
										
										test.equal(col_str, "events");
										test.notEqual( signal._id, undefined );
										test.equal(signal.ev_msg.ev_type,"ev_api_shift");
										test.equal( typeof signal.ev_msg.ev_tstamp, "number");
										test.deepEqual( signal.ev_msg.ev_data, rpc_params );
										
									}else{
										test.equal(false);
									}
																										
								}	
					}
		}
	});
				
	var ctx = {params:rpc_params, doc:doc};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_shift", ctx, rcpts);
	test.equal(counter,2);					
	
	test.expect(11);
	test.done();
	
}



