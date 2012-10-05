var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var endpoint = require("../lib/endpoint");
	
	test.notEqual(endpoint.rpc,undefined);
	test.notEqual(endpoint.events, undefined);
	test.done();
	
}


exports["endpoint.rpc: incorrect jsonstring"] = function(test){
	
	var endpoint = require("../lib/endpoint");
	var req_str = '{"jsonrpc":"2.1""method":"test","id":123'; //missing ending }
	
	endpoint.rpc( {writeHead: function(status, header_data){
							
							test.equal(status, 400);
							test.deepEqual(header_data,{"Content-Type":"application/json"});
			 		},
			 		end: function( out_str ){
			 	
					 		var out_obj = JSON.parse(out_str);
					 		test.deepEqual({jsonrpc:"2.0",err:{code:-32700,message:"Parse error."}, id:null},out_obj);					 		
					}		
			} , req_str );
			
	test.done();		
	
}


exports["endpoint.rpc: incorrect json-rpc version"] = function(test){
	
	var endpoint = require("../lib/endpoint");
	var req_str = '{"jsonrpc":"2.1","method":"test","id":123}';
	
	endpoint.rpc( {writeHead: function(status, header_data){
							
							test.equal(status, 400);
							test.deepEqual(header_data,{"Content-Type":"application/json"});
			 		},
			 		end: function( out_str ){
			 	
					 		var out_obj = JSON.parse(out_str);
					 		test.deepEqual({jsonrpc:"2.0",err:{code:-32604,message:"Version not supported."}, id:null},out_obj);
					 		
					}		
			} , req_str );
			
	test.done();
}


exports["endpoint.rpc: method not found"] = function(test){
	
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{"./api":{	remote:{
							create: function(params, ret_handler){
								
								
								ret_handler(null,{wid:"1234"});
								
							}}
		}}
	});
	
	var req_str = '{"jsonrpc":"2.0","method":"nonexisting","id":123}';
	
	endpoint.rpc( {writeHead: function(status, header_data){
							
							test.equal(status, 400);
							test.deepEqual(header_data,{"Content-Type":"application/json"});
			 		},
			 		end: function( out_str ){
			 	
					 		var out_obj = JSON.parse(out_str);
					 		test.deepEqual({jsonrpc:"2.0",err:{code:-32600,message:"Method not found."}, id:"123"},out_obj);
					 		
					}		
			} , req_str );
			
	test.done();
		
}


exports["endpoint.rpc: method invocation: with result, no params"] = function(test){
	
	var ret_value = {test:1};
		
	var api = {	remote:{
						test: function(params, ret_handler){
															
							ret_handler(null,ret_value);
							
						}}
			 };
	
	var srv = sandbox.require("../lib/server",{
		requires:{	"./api":api}					 				
	});			
	
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{	"./api":api,
					"./server":srv	 
				}
	});
	
	var req_str = '{"jsonrpc":"2.0","method":"test","id":123}';
	
	endpoint.rpc( {writeHead: function(status, header_data){
							
							test.equal(status, 200);
							test.deepEqual(header_data,{"Content-Type":"application/json"});
			 		},
			 		end: function( out_str ){
			 	
					 		var out_obj = JSON.parse(out_str);
					 		test.deepEqual({jsonrpc:"2.0",result:ret_value, id:"123"},out_obj);					 	
					}		
			} , req_str );
			
	test.done();
		
}


exports["endpoint.rpc: method invocation: with result, params"] = function(test){
	
	var req = { "jsonrpc":"2.0",
				"method":"test",
				"params":{x:1,y:2},
				"id":"123"};
				
	var api = {	remote:{
						test: function(params, ret_handler){
							
							test.deepEqual(params, req.params);								
							ret_handler(null,params.x + params.y);
							
						}}
			 };
	
	var srv = sandbox.require("../lib/server",{
		requires:{	"./api":api}					 				
	});			
	
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{	"./api":api,
					"./server":srv	 
				}
	});
								
	
	var req_str = JSON.stringify(req);
	
	endpoint.rpc( {writeHead: function(status, header_data){
							
							test.equal(status, 200);
							test.deepEqual(header_data,{"Content-Type":"application/json"});
			 		},
			 		end: function( out_str ){
			 						 	
					 		var out_obj = JSON.parse(out_str);
					 		test.deepEqual({jsonrpc:"2.0",result:req.params.x + req.params.y, id:"123"},out_obj);					 	
					}		
			} , req_str );
			
	test.done();
	
}


exports["endpoint.rpc: method invocation: with error"] = function(test){

	var err_value = {test:1};
	
	var api = {	remote:{
						test: function(params, ret_handler){
																				
							ret_handler(err_value,null);
							
						}}
			 };
	
	var srv = sandbox.require("../lib/server",{
		requires:{	"./api":api}					 				
	});			
	
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{	"./api":api,
					"./server":srv	 
				}
	});
		
	
	var req_str = '{"jsonrpc":"2.0","method":"test","id":123}';
	
	endpoint.rpc( {writeHead: function(status, header_data){
							
							test.equal(status, 200);
							test.deepEqual(header_data,{"Content-Type":"application/json"});
			 		},
			 		end: function( out_str ){
			 	
					 		var out_obj = JSON.parse(out_str);
					 		test.deepEqual({jsonrpc:"2.0",error:err_value, id:"123"},out_obj);					 	
					}		
			} , req_str );
			
	test.done();	
	
}

exports["endpoint.rpc: method invocation without id"] = function(test){
	
	var flags = [0, 1, 1, 1];	
	
	var api = {	remote:{
						test: function(params, ret_handler){
																				
							flags[0] = 1;	//remote procedure gets executed.						
							ret_handler(null,{});
							
						}}
			 };
	
	var srv = sandbox.require("../lib/server",{
		requires:{	"./api":api}					 				
	});			
	
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{	"./api":api,
					"./server":srv	 
				}
	});
			
	
	var req_str = '{"jsonrpc":"2.0","method":"test"}';
	
	endpoint.rpc( {writeHead: function(status, header_data){
					
					flags[1] = 0; //writeHead() does not get executed (flag not changed).								
		 		 },
		 		write: function( out_str ){
		 			flags[2] = 0; //write does not get executed (flag not changed).
		 		},
		 		end: function( out_str ){
		 			
		 			flags[3] = 0; //end() does not get executed (flag not changed).			 				 
				}		
		} , req_str );
		
	test.ok( flags[0] );		
	test.ok( flags[1] );
	test.ok( flags[2] );
	test.ok( flags[3] );
	test.done();	
	
}


exports["endpoint.events: subscribe invocation"] = function(test){
	
		
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{"./evqueue":{	remote:{
								subscribe: function( http_resp, params ){
																	
									test.notEqual( http_resp, undefined);
									test.ok( http_resp.myhttp );
									test.deepEqual(params,{uid:620793114});																						
								}
							}
		}}
	});
	
	//json request sent to subscribe to the events channel for uid 620793114
	var req_str = '{"jsonrpc":"2.0","method":"subscribe", "params":{"uid":620793114}}';
	var http_resp = {	myhttp:true,
						writeHead: function(status, header_data){
						
							test.equal(status,200);
							test.deepEqual(header_data,{"Content-Type":"application/json"});								
			 			},				 						 		
						connection:{
							setTimeout:function(timeout){
								
								test.equal(timeout,0);
							},
							setNoDelay:function(flag){
								
								test.ok(flag);
							}
						}		
					};
	
	endpoint.events( http_resp , req_str );
	
	test.expect(7);		
	test.done();	
}



