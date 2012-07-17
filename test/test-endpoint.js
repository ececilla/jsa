var sandbox = require("sandboxed-module");


exports["rpc: incorrect jsonstring"] = function(test){
	
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


exports["rpc: incorrect json-rpc version"] = function(test){
	
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


exports["rpc: method not found"] = function(test){
	
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


exports["rpc: method invocation: with result, no params"] = function(test){
	
	var ret_value = {test:1};
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{"./api":{	remote:{
							test: function(params, ret_handler){
																
								ret_handler(null,ret_value);
								
							}}
		}}
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


exports["rpc: method invocation: with result, params"] = function(test){
	
	var req = { "jsonrpc":"2.0",
				"method":"test",
				"params":{x:1,y:2},
				"id":"123"};
		
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{"./api":{	remote:{
								test: function(params, ret_handler){//remote procedure test
																	
									test.deepEqual(params, req.params);								
									ret_handler(null,params.x + params.y);
									
								}
							}
		}}
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


exports["rpc: method invocation: with error"] = function(test){

	var err_value = {test:1};
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{"./api":{	remote:{
								test: function(params, ret_handler){
																	
									ret_handler(err_value,null);									
								}
							}
		}}
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

exports["rpc: method invocation without id"] = function(test){
	
	var flags = [0, 1, 1, 1];	
	var endpoint = sandbox.require("../lib/endpoint",{
		requires:{"./api":{	remote:{
								test: function(params, ret_handler){
																	
									flags[0] = 1;	//remote procedure gets executed.						
									ret_handler(null,{});									
								}
							}
		}}
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


