var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var em = require("../lib/evmngr");
	test.notEqual( em.remote.subscribe, undefined);
	test.notEqual( em.add_push_provider, undefined);
	test.notEqual( em.api.listen, undefined);
	test.notEqual( em.emit, undefined);
	test.notEqual( em.on, undefined);
	
	test.expect(5);
	test.done();
}


exports["evmngr.api.listen: custom event, explicit rcpts, different non-batch push_providers"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"gcm"},{uid:620793117, push_id:620793117,push_type:"gcm",ev_types:["ev_foo"]}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
																																																			
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq,"./server":srv }
	});
	
	em.add_push_provider("web",{ 
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793119);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
						
		}
	});
	
	var flag = 1;
	em.add_push_provider("batch",{
		
		push:function(ids, push_msg){
			
			flag = 0;
		}
	},true);
	
	em.add_push_provider("gcm",{
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793115);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
			test.ok(flag);		
			test.expect(10);
			test.done();			
		}
	});
						
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"					
	
	var ctx = {doc:undefined,params:rpc_params, user:{_id:620793114, push_id:620793114, push_type:"web"}, config:{}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx, rcpts);
	
	
	
}

exports["evmngr.api.listen: custom event, explicit rcpts, config.ev_private:1"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"gcm"}, {uid:620793115, push_id:620793115,push_type:"gcm"},{uid:620793117, push_id:620793117,push_type:"gcm",ev_types:["ev_foo"]}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
																																																			
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq,"./server":srv }
	});
		
	
	var flag = 1;
	em.add_push_provider("batch",{
		
		push:function(ids, push_msg){
			
			flag = 0;
		}
	},true);
	
	em.add_push_provider("gcm",{
		
		push:function(push_id,push_msg){//Only rcpts[0] is notified
			
			test.equal(push_id,620793119);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
			test.ok(flag);		
			test.expect(7);
			test.done();			
		}
	});
						
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"					
	
	var ctx = {doc:undefined,params:rpc_params, user:{_id:620793114, push_id:620793114, push_type:"web"}, config:{ev_private:1}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx, rcpts);
	
	
	
}

exports["evmngr.api.listen: custom event, explicit rcpts, tag, different non-batch push_providers"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"gcm"},{uid:620793117, push_id:620793117,push_type:"gcm",ev_types:["ev_foo"]}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
																																																			
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq,"./server":srv }
	});
	
	em.add_push_provider("web",{ 
		
		push:function(push_id,push_msg){
						
			test.equal(push_id,620793119);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.equal(push_msg.ev_tag,"mytag");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
						
		}
	});
	
	var flag = 1;
	em.add_push_provider("batch",{
		
		push:function(ids, push_msg){
			
			flag = 0;
		}
	},true);
	
	em.add_push_provider("gcm",{
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793115);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.equal(push_msg.ev_tag,"mytag");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
			test.ok(flag);		
			test.expect(12);
			test.done();			
		}
	});
						
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"					
	
	var ctx = {doc:undefined,params:rpc_params, user:{_id:620793114, push_id:620793114, push_type:"web"}, config:{}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx, rcpts,"mytag");
	
	
	
}



exports["evmngr.api.listen: custom event, explicit rcpts, different non-batch push_providers, event_types"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"gcm"},{uid:620793112, push_id:620793112, push_type:"custom", ev_types:["ev_dummy","ev_foo"]}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
																																																			
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq,"./server":srv }
	});
	
	em.add_push_provider("web",{ 
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793119);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
						
		}
	});
	em.add_push_provider("gcm",{ //overwrite existing web push provider
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793115);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
						
		}
	});
	var flag = 1;
	em.add_push_provider("batch",{
		
		push:function(ids, push_msg){
			
			flag = 0;
		}
	},true);
	
	em.add_push_provider("custom",{
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793112);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
			test.ok(flag);	
			test.expect(13);
			test.done();	
		}
	});
	
					
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"				
	
	var ctx = {doc:undefined,params:rpc_params, user:{_id:620793314, push_id:620793114, push_type:"web"}, config:{}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx, rcpts);
				
}


exports["evmngr.api.listen: custom event, explicit rcpts, batch and non-batch push_providers"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:"gcm-115",push_type:"gcm"},
				 {uid:620793116, push_id:620793116,push_type:"batch1",ev_types:undefined},{uid:620793117, push_id:620793117,push_type:"batch1", ev_types:undefined},{uid:620793119, push_id:620793119, push_type:"batch1",ev_types:["ev_foo"]},
				 {uid:620793118, push_id:620793118,push_type:"batch2",ev_types:["ev_dummy"]},{uid:620793120, push_id:620793120,push_type:"batch2",ev_types:[]}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
																																																			
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq, "./server":srv }
	});
	
	em.add_push_provider("web",{//overwrite existing non-batch web push provider 
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793119);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
						
		}
	});//default value for is_batch is false
	em.add_push_provider("gcm",{ //is non-batch push provider
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,"gcm-115");
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
						
		}
	},false);
	
	em.add_push_provider("batch1",{//is batch push provider
		
		push:function(push_ids, push_msg){
			
			test.deepEqual(push_ids,[620793116, 620793117]);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});			
		}
	},true);
	
	em.add_push_provider("batch2",{//is batch push provider
		
		push:function(push_ids, push_msg){
			
			test.deepEqual(push_ids,[620793118]);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
			test.expect(15);
			test.done();			
		}
	},true);
				
	
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"	
	
	var ctx = {doc:undefined,params:rpc_params, user:{_id:620793114, push_id:620793114, push_type:"web"}, config:{}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx, rcpts);
	
}


exports["evmngr.api.listen: custom event, explicit rcpts, removed uid"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
																																																			
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq,"./server":srv }
	});
	
	em.add_push_provider("web",{ //overwrite existing web push provider
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793119);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
			test.expect(6);
			test.done();			
		}
	});
				
	
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"	
	
	var ctx = {doc:undefined,params:rpc_params, user:{_id:620793115, push_id:620793115, push_type:"web"}, config:{}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx, rcpts);
	
}

exports["evmngr.api.listen: custom event, ctx.config.rcpts, removed uid"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
																																																			
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq,"./server":srv }
	});
	
	em.add_push_provider("web",{ //overwrite existing web push provider
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793119);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
			test.expect(6);
			test.done();			
		}
	});
				
	
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"		
	
	var ctx = {doc:undefined, params:rpc_params, user:{_id:620793115, push_id:620793115, push_type:"web"}, config:{rcpts:rcpts}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx); //rcpts encoded into ctx.config 					
	
}

exports["evmngr.api.listen: custom event, ctx.doc.rcpts, removed uid"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
																																																			
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq, "./server":srv }
	});
	
	em.add_push_provider("web",{ //overwrite existing web push provider
		
		push:function(push_id,push_msg){
			
			test.equal(push_id,620793119);
			test.equal(push_msg.ev_type,"ev_dummy");
			test.deepEqual(push_msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
			test.expect(6);
			test.done();			
		}
	});
				
	
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"	
	
	var ctx = {doc:{rcpts:rcpts}, params:rpc_params, user:{_id:620793115, push_id:620793115, push_type:"web"}, config:{}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx); //rcpts encoded into ctx.config 
	
}




exports["evmngr.api.listen: custom event, explicit rcpts, subscription"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
		
	
	var eq = sandbox.require("../lib/evqueue",{
		requires:{	
					"./db":{	
								save: function(col_str, msg, ret_handler){
									
																																										
									test.equal(col_str,"events");
									test.equal(msg.ev_type,"ev_dummy");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									
									setTimeout(
										function(){
										ret_handler();
									},500);
																										
								}	
					}
		}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,"./evqueue":eq,"./server":srv }
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
								test.expect(9);
								test.done();																				
						}
						
				    }; 
				 
	em.remote.subscribe(http_resp,subs_params);	
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"		
	
	var ctx = {doc:undefined,params:rpc_params, user:{_id:620793114, push_id:620793114, push_type:"web"},config:{}};//payload a emitir
	ctx.payload = ctx.params;
	api.emit("ev_dummy", ctx, rcpts);
						
}



exports["evmngr.on: listening custom event, wrong event emitted"] = function(test){

	var ctx = {params:{foo:"50187f71556efcbb25000001", bar:620793114},config:{}};
	var rcpts = [{uid:620793119, push_id:620793119, push_type:"web"}, {uid:620793115, push_id:620793115, push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};	
	
	var flag = 1;	
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(ev_msg, ret_handler){
									
									flag = 0;																																											
								}	
					},
					"./server":srv
		}
	});
				
	em.api.listen("ev_dummy");//default_ev_handler attached to "ev_dummy"
	api.on("ev_foo",function(){
		
		test.ok(flag);
		test.done();	
	});			
	api.emit("ev_foo", ctx, rcpts);						
	
}

//cambiar desde aqui

exports["evmngr.on: ev_api_create, reportable document, subscribed in init.rcpts"] = function(test){
		
	var rpc_params = {uid:620793114, doc:{test:"test"}, catalog:"dummy", rcpts:[{uid:620793114, push_id:620793114,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793119, push_id:620793119,push_type:"web"}]},
	    ircpts = [620793115, 620793119];
	
	var srv = 	sandbox.require("../lib/server");		
	srv.config.app = {ev_journal:1, debug:0};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	
							save:function(col_str,doc,ret_handler){
													
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");								
									test.equal( doc.test, rpc_params.doc.test );
									test.equal( doc.uid, rpc_params.uid );
									test.deepEqual( doc.rcpts, [{uid:620793114, push_id:620793114,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793119, push_id:620793119,push_type:"web"}]);
									
									//save doc to db...returns doc with _id		
									doc._id = "50187f71556efcbb25000001";						
									ret_handler(null,doc);
								}	
							}
							
						},
				 "./server":srv	
		}
	}),
	em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																											
									test.equal(msg.ev_data.test,"test");	
									test.equal(msg.ev_data.uid,620793114);
									test.equal(msg.ev_data.catalog,"dummy");
									test.deepEqual(msg.ev_data.rcpts,[{uid:620793114, push_id:620793114,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793119, push_id:620793119,push_type:"web"}]);
									test.equal( msg.ev_data.wid,"50187f71556efcbb25000001");								
									ret_handler();									
								}	
					},
					"./server":srv
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
				 
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
		
	var ctx = {doc:undefined, params:rpc_params, config:{save:1, emit:1}, user:{_id:620793114, push_id:620793114, push_type:"web", wids:[]}};
	api.remote.create(ctx, function(err,val){
		
		test.equal(err,null);
		test.notEqual(val,undefined);	
		test.expect(19);
		test.done();				
		
	});
		
}


exports["evmngr.on: ev_api_create, unreportable document, subscribed"] = function(test){
		
	var rpc_params = {uid:620793114, doc:{test:"ouuug test"}, catalog:"dummy"};
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module
							save:function(col_str,doc,ret_handler){
																
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");								
									test.equal( doc.test, rpc_params.doc.test );
									test.equal( doc.uid, rpc_params.uid );
									test.equal( doc.rcpts, undefined);
									
									//save doc to db...returns doc with _id		
									doc._id = "50187f71556efcbb25000001";						
									ret_handler(null,doc);	
								}
							}
						},
					"./server":{config:{app:{debug:0}}}
		}
	}), 
	em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,"./server":srv}
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
				 
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
		
	var ctx = {doc:undefined, params:rpc_params, config:{save:1, emit:1}, user:{push_id:620793114, push_type:"web",wids:[]}};
	api.remote.create(ctx, function(err,val){
		
		test.ok(subs_flags[2]);		
		test.equal(err,null);
		test.notEqual(val,undefined);			
		test.expect(9);
		test.done();
	});
		
}

exports["evmngr.on: ev_api_dispose, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114,catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[{uid:620793115, push_id:620793115, push_type:"web"}], uid:620793115, catalog:"docs"},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[{uid:620793115, push_id:620793115, push_type:"web"}], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																											
									test.equal(msg.ev_type,"ev_api_dispose");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,catalog:"docs"});									
																			
									ret_handler();																	
								}	
					},
					"./server":srv
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
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 removes the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params,doc:dbdocs["50187f71556efcbb25000001"], config:{save:1,emit:1}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
		
		ctx.payload = ctx.params;
		api.emit("ev_api_dispose",ctx);
		test.expect(8);
		test.done();
		
	},500);
		
}




exports["evmngr.on: ev_api_join, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}], uid:620793115, catalog:"docs"},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
				  "./evqueue":{
								save: function(msg, ret_handler){
																											
									test.equal(msg.ev_type,"ev_api_join");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114});									
									
									ret_handler();																	
								}	
					},
					"./server":srv
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
								test.expect(8);
								test.done();																
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params,doc:dbdocs["50187f71556efcbb25000001"], config:{save:1,emit:1}, user:{_id:620793114, push_id:620793114,push_type:"web",wids:[]}};
		ctx.payload = ctx.params;
		api.emit("ev_api_join", ctx );
	},500);
		
}



exports["evmngr.on: ev_api_join, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[620793115], uid:620793115, catalog:"docs"},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var api = sandbox.require("../lib/api"),
	em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_join");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114});
									ret_handler();
								}	
					},
					"./server":srv
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
				    					    				
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params,doc:dbdocs["50187f71556efcbb25000001"], config:{save:1,emit:1}, user:{wids:[]}};				
	ctx.payload = ctx.params;
	api.emit("ev_api_join", ctx );
	test.expect(4);
	test.done();
			
}


exports["evmngr.on: ev_api_join autolistening, explicit rcpts"] = function(test){

	var rpc_params = {foo:"50187f71556efcbb25000001", bar:620793114};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}], uid:620793115, catalog:"docs"};
	var rcpts = [{uid:620793119, push_id:620793119, push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});									
									ret_handler();																	
								}	
					},
					"./localpush":{
								push: function( rcpt , msg){
									
									test.equal(msg.ev_type,"ev_api_join");
									test.deepEqual(msg.ev_data,{foo:"50187f71556efcbb25000001", bar:620793114});
									if(rcpt == 620793119)
										test.equal(rcpt,620793119);
									else if(rcpt == 620793115)
										test.equal(rcpt,620793115);	
								}
					},
					"./server":srv
		}
	});
	
	
				
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{save:1,emit:1}, user:{_id:620793114, push_id:620793114, push_type:"web"}};		
	ctx.payload = ctx.params;
	api.emit("ev_api_join", ctx, rcpts);
						
	test.expect(7);
	test.done();
	
}



exports["evmngr.on: ev_api_unjoin, subscribed in rcpts"] = function(test){
	
	//explicit or implit, always there's a param catalog in the context	
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"}; 
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[{uid:620793115, push_id:620793115,push_type:"web"},{uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var api = sandbox.require("../lib/api");
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																											
									test.equal(msg.ev_type,"ev_api_unjoin");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,catalog:"docs"});
									ret_handler();
								}	
					},
					"./server":srv
		}
	});			
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which means its in rcpts list 
	 * so http_resp.write(...) should be called with the ev_api_unjoin payload.	 
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
								test.expect(8);
								test.done();																
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{}, user:{_id:620793114, push_id:620793114,push_type:"web"}};
		ctx.payload = ctx.params;
		api.emit("ev_api_unjoin", ctx );
	},500);
		
}


exports["evmngr.on: ev_api_unjoin, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[{uid:620793115,push_id:620793115,push_type:"web"},{uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function( msg, ret_handler){
																										
									test.equal(msg.ev_type,"ev_api_unjoin");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,catalog:"docs"});
									ret_handler();
								}	
					},
					"./server":srv
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
				    					    				
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"],config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
	ctx.payload = ctx.params;
	api.emit("ev_api_unjoin",ctx);
	test.expect(4);
	test.done();					
			
}


exports["evmngr.on: ev_api_unjoin autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",a:1,b:"test1234", rcpts:[{uid:620793115, push_id:620793115,push_type:"web"},{uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115};
	var rcpts = [{push_id:620793119,push_type:"web"}, {push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_unjoin");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"});									
									
									ret_handler();
																										
								}	
					},
					"./server":srv
		}
	});
				
	var ctx = {params:rpc_params, doc:doc, user:{_id:620793114, push_id:620793114, push_type:"web"}};		
	ctx.payload = ctx.params;
	api.emit("ev_api_unjoin", ctx, rcpts);
						
	test.expect(2);
	test.done();
	
}



exports["evmngr.on: ev_api_remove, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_remove");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"});
									ret_handler();
								}	
					},
					"./server":srv
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
													
								test.equal(json_obj.ev_type,"ev_api_remove");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{wid:"50187f71556efcbb25000001",uid:620793114,fname:"a",catalog:"docs"});								
																								
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"],config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
		ctx.payload = ctx.params;
		api.emit("ev_api_remove",ctx);
		test.expect(8);
		test.done();
		
	},500);
		
}


exports["evmngr.on: ev_api_remove, subscribed not  in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a", uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_remove");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001",fname:"a", uid:620793114, catalog:"docs"});
									
									ret_handler();
								}	
					},
					"./server":srv
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
				    					    				
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"],config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
	ctx.payload = ctx.params;
	api.emit("ev_api_remove",ctx);				
	
	test.expect(4);
	test.done();
			
}


exports["evmngr.on: ev_api_remove autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",a:1, rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115};
	var rcpts = [{push_id:620793119, push_type:"web"}, {push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_remove");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"});									
									ret_handler();
																										
								}	
					},
					"./server":srv
		}
	});
				
	var ctx = {params:rpc_params, doc:doc, config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"} };	
	ctx.payload = ctx.params;	
	api.emit("ev_api_remove", ctx, rcpts);
	test.expect(2);				
	
	test.done();
	
}


exports["evmngr.on: ev_api_set, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:5, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_set");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:5, catalog:"docs"});
									
									ret_handler();
								}	
					},
					"./server":srv
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
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{}, user:{_id:620793114, push_id:620793114,push_type:"web"}};
		ctx.payload = ctx.params;
		api.emit("ev_api_set",ctx);
		test.expect(8);
		test.done();
		
	},500);
		
}

exports["evmngr.on: ev_api_set, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a", value:5, uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:1, rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_set");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:5, catalog:"docs"});
									ret_handler();
								}	
					},
					"./server":srv
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
				    					    				
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
	ctx.payload = ctx.params;
	
	api.emit("ev_api_set",ctx);					
	test.expect(4);
	test.done();
			
}


exports["evmngr.on: ev_api_set autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",a:1, rcpts:[620793115, 620793114], uid:620793115};
	var rcpts = [{push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
		
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_set");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"});
									
									ret_handler();
																										
								}	
					},
					"./server":srv
		}
	});
				
	var ctx = {params:rpc_params, doc:doc, config:{},user:{_id:620793114, push_id:620793114,push_type:"web"}};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_set", ctx, rcpts);
						
	test.expect(2);	
	test.done();
	
}




exports["evmngr.on: ev_api_push, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:5, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1], rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_push");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:5, catalog:"docs"});
									
									ret_handler();
								}	
					},
					"./server":srv
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
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
		ctx.payload = ctx.params;
		api.emit("ev_api_push",ctx);		
		test.expect(8);
		test.done();
		
	},500);
		
}


exports["evmngr.on: ev_api_push, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a",value:5, uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1], rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_push");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", value:5, catalog:"docs"});
									
									ret_handler();
								}	
					},
					"./server":srv
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
				    					    				
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"],config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
	ctx.payload = ctx.params;
	api.emit("ev_api_push", ctx);
	
	test.expect(4);
	test.done();	
			
}



exports["evmngr.on: ev_api_push autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var rcpts = [{push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api");
	var doc = {_id:"50187f71556efcbb25000001",a:[1], rcpts:[620793115, 620793114], uid:620793115};
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_push");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"});									
									ret_handler();
																										
								}	
					},
					"./server":srv
		}
	});
				
	var ctx = {params:rpc_params, doc:doc, config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_push", ctx, rcpts);
					
	
	test.expect(2);
	test.done();
	
}


exports["evmngr.on: ev_api_pop, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_pop");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"});
									
									ret_handler();
								}	
					},
					"./server":srv
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
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because she belongs to the notification list (rcpts).
	setTimeout(function(){
		
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
		ctx.payload = ctx.params;
		api.emit("ev_api_pop",ctx);
		test.expect(8);
		test.done();
				
	},500);
		
}

exports["evmngr.on: ev_api_pop, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a", uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[{uid:620793115,push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_pop");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"});
									
									ret_handler();
								}	
					},
					"./server":srv
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
				    					    				
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
	ctx.payload = ctx.params;
	api.emit("ev_api_pop",ctx);
	test.expect(4);
	test.done();
						
			
}


exports["evmngr.on: ev_api_pop autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[620793115, 620793114], uid:620793115};
	var rcpts = [{uid:620793119, push_id:620793119,push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_pop");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, catalog:"docs"});									
									
									ret_handler();																	
								}	
					},
					"./server":srv
		}
	});
				
	var ctx = {params:rpc_params, doc:doc, config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_pop", ctx, rcpts);
					
	
	test.expect(2);
	test.done();
	
}

exports["evmngr.on: ev_api_shift, subscribed in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_shift");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"});
																	
									ret_handler();
								}	
					},
					"./server":srv
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
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	setTimeout(function(){
		var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
		ctx.payload = ctx.params;
		api.emit("ev_api_shift",ctx);
		
		test.expect(8);
		test.done();
	},500);
		
}

exports["evmngr.on: ev_api_shift, subscribed not in rcpts"] = function(test){
		
	var rpc_params = {wid:"50187f71556efcbb25000001",fname:"a", uid:620793114, catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_shift");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114, fname:"a", catalog:"docs"});
									ret_handler();
								}	
					},
					"./server":srv
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
				    					    				
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	var ctx = {params:rpc_params, doc:dbdocs["50187f71556efcbb25000001"], config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};
	ctx.payload = ctx.params;
	api.emit("ev_api_shift",ctx);	
	test.expect(4);
	test.done();						
	
				
}


exports["evmngr.on: ev_api_shift autolistening, explicit rcpts"] = function(test){

	var rpc_params = {wid:"50187f71556efcbb25000001", uid:620793114};
	var doc = {_id:"50187f71556efcbb25000001",a:[1,5], rcpts:[620793115, 620793114], uid:620793115};
	var rcpts = [{uid:620793119, push_id:620793119, push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_shift");
									test.deepEqual(msg.ev_data,{wid:"50187f71556efcbb25000001", uid:620793114});
									ret_handler();									
																									
								}	
					},
					"./server":srv
		}
	});
				
	var ctx = {params:rpc_params, doc:doc, config:{}, user:{_id:620793114, push_id:620793114, push_type:"web"}};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_shift", ctx, rcpts);					
	
	test.expect(2);
	test.done();
	
}

exports["evmngr.on: ev_api_search, subscribed in rcpts"] = function(test){
		
	var rpc_params = {uid:620793114, keyword:"foo", catalog:"docs"};
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",keywords:["foo","test"], rcpts:[{uid:620793115,push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}], uid:620793115},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115], uid:620793115};
	
	var api = sandbox.require("../lib/api");
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	em = sandbox.require("../lib/evmngr",{
		requires:{"./api":api,
					"./evqueue":{
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_search");
									test.deepEqual(msg.ev_data,{uid:620793114, keyword:"foo", catalog:"docs"});
																	
									ret_handler();
								}	
					},
					"./server":srv
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
													
								test.equal(json_obj.ev_type,"ev_api_search");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{uid:620793114,keyword:"foo",catalog:"docs"});								
																								
						}
						
				    }; 
				    					    
	//620793115 subscribes to event queue			 
	em.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
	
	//0.5s after 620793114 joins the document '50187f71556efcbb25000001' and 620793115 is notified about this event
	//because it belongs to the notification list (rcpts).
	//rcpts are pushed via config not document rcpts list.
	setTimeout(function(){
		var ctx = {params:rpc_params, config:{rcpts:[{uid:620793115, push_id:620793115,push_type:"web"}, {uid:620793114, push_id:620793114,push_type:"web"}]}, doc:{}, retval:[dbdocs["50187f71556efcbb25000001"]], user:{_id:620793114, push_id:620793114, push_type:"web"}};
		ctx.payload = ctx.params;
		api.emit("ev_api_search",ctx);
		
		test.expect(8);
		test.done();
	},500);
		
}

exports["evmngr.on: ev_api_search autolistening, explicit rcpts"] = function(test){

	var rpc_params = {uid:620793114, keyword:"foo", catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",keywords:["foo","test"], uid:620793115};
	var rcpts = [{uid:620793119, push_id:620793119, push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:1};
	
	
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									test.equal(msg.ev_type,"ev_api_search");
									test.deepEqual(msg.ev_data,{uid:620793114,keyword:"foo",catalog:"docs"});
									ret_handler();									
																									
								}	
					},
					"./server":srv
		}
	});
				
	var ctx = {params:rpc_params, doc:{}, config:{}, user:{_id:620793115, push_id:620793115,push_type:"web"}};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_search", ctx, rcpts);				
	
	test.expect(2);
	test.done();
	
}

exports["evmngr.on: ev_api_search autolistening, explicit rcpts, ev_journal false"] = function(test){

	var rpc_params = {uid:620793114, keyword:"foo", catalog:"docs"};
	var doc = {_id:"50187f71556efcbb25000001",keywords:["foo","test"], uid:620793115};
	var rcpts = [{uid:620793119, push_id:620793119, push_type:"web"}, {uid:620793115, push_id:620793115,push_type:"web"}];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{}}
	});
	
	var srv = 	sandbox.require("../lib/server");	
	srv.config.app = {ev_journal:0};
	
	var flag = 1;
	var em = sandbox.require("../lib/evmngr",{
		requires:{	"./api":api,
					"./evqueue":{	
								save: function(msg, ret_handler){
																		
									flag = 0;
									ret_handler();									
																									
								}	
					},
					"./server":srv
		}
	});
				
	var ctx = {params:rpc_params, doc:{}, config:{}, user:{_id:620793115, push_id:620793115,push_type:"web"}};	
	ctx.payload = ctx.params;	
	api.emit("ev_api_search", ctx, rcpts);				
	
	test.ok(flag);
	test.expect(1);
	test.done();
	
}



