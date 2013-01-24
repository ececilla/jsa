var sandbox = require("sandboxed-module");

exports["localpush.add_subscription"] = function(test){
	
	var lpush = require("../lib/localpush"),
		http_resp = {foo:1},
		uid = 620793114;
	 
	 
	lpush.add_subscription(uid, http_resp);
	
	test.deepEqual(lpush.get_subscription(uid), {http:http_resp});
	test.done();
}

exports["localpush.is_subscribed"] = function(test){
	
	var lpush = require("../lib/localpush"),
		http_resp = {foo:1},
		uid = 620793114;
	 
	 
	lpush.add_subscription(uid, http_resp);
	
	test.ok(lpush.is_subscribed(uid));
	test.done();
}

exports["localpush.remove_subscription"] = function(test){
	
	var lpush = require("../lib/localpush"),
		http_resp = {foo:1},
		uid = 620793114;
	 
	 
	lpush.add_subscription(uid, http_resp);	
	test.deepEqual(lpush.get_subscription(uid), {http:http_resp});
	lpush.rem_subscription(uid);
	test.ok( !lpush.is_subscribed(uid) );
	test.done();
}

exports["localpush.subscribe: no params"] = function(test){
	
	
	var lpush = require("../lib/localpush");
	
	var flags = [0];	
	var http_resp = {   
						end:function(){ flags[0] = 1;},						
				    }; 
				 
	lpush.subscribe(http_resp,undefined);
	test.ok(flags[0]);		
			
	test.done();				
}

exports["localpush.subscribe: no uid"] = function(test){
	
	
	var lpush = require("../lib/localpush");
	var params = {}
	var flags = [0];	
	var http_resp = {   
						end:function(){ flags[0] = 1;},						
				    }; 
				 
	lpush.subscribe(http_resp, params);
	test.ok(flags[0]);		
			
	test.done();				
}

exports["localpush.subscribe: invocation"] = function(test){
	
	
	var lpush = require("../lib/localpush");
	
	var flags = [0,0];
	var params = {uid:620793114};
	var http_resp = {   
						on:function(){ flags[0] = 1;},
						connection:{
							on:function(){ flags[1] = 1; }
						}
				    }; 
				 
	lpush.subscribe(http_resp,params);
	test.ok(flags[0]);
	test.ok(flags[1]);
	test.deepEqual( lpush.get_subscription(params.uid), {http:http_resp});
	test.done();
}		



exports["localpush.subscribe: invocation with tstamp"] = function(test){
	
	var flags = [0,0];
	var lpush = sandbox.require("../lib/localpush",{
		requires:{	
					"./db":{	
								criteria: function(col_str, criteria, order_field, ret_handler){
									
									if(col_str == "events"){
										
										test.equal(col_str, "events");
										test.deepEqual( criteria, {"ev_data.wid":"50b4281ebb0d0db239000002", ev_tstamp:{$gt:79487593593}} );
										ret_handler(null,[{ev_type:"ev_api_join", ev_tstamp:79487592461, ev_data:{uid:620793117, wid:"50b4281ebb0d0db239000002"}}]);
									}else if(col_str == "users"){//user 620793114 is related to doc 50b4281ebb0d0db239000002
										
										test.equal(col_str, "users");
										test.deepEqual(criteria,{uid:620793114});
										ret_handler(null,[{wids:["50b4281ebb0d0db239000002"]}]);
									}
																																																											
								}	
					}
		}
	});
	
	
	var params = {uid:620793114, tstamp:79487593593};
	var http_resp = {   
						on:function(){ flags[0] = 1;},
						connection:{
							on:function(){ flags[1] = 1; }
						},
						write: function(str){
							
							var json_obj = JSON.parse(str);
							test.deepEqual(json_obj,{ev_type:"ev_api_join", ev_tstamp:79487592461, ev_data:{uid:620793117, wid:"50b4281ebb0d0db239000002"}});
						}
				    }; 
				 
	lpush.subscribe(http_resp,params);
	test.ok(flags[0]);
	test.ok(flags[1]);	
	
	test.deepEqual( lpush.get_subscription(params.uid), {http:http_resp});
	
	test.expect(8);	
	test.done();				
}	



