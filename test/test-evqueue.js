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




exports["evqueue.remote.subscribe: invocation"] = function(test){
	
	
	var eq = require("../lib/evqueue");
	
	var flags = [0,0];
	var params = {uid:620793114};
	var http_resp = {   foo:1,
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


exports["evqueue.events: ev_create with rcpt subscribed"] = function(test){
		
	var rpc_params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"},
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
							}
		}}
	}),
	eq = sandbox.require("../lib/evqueue",{
		requires:{"./api":api}
	});
	
	
	api.rcpts = function(doc,db,ret_handler){
			
			test.notEqual(doc,undefined);
			test.notEqual(db,undefined);
			setTimeout(function(){ret_handler(ircpts)},500);
			
	};
	
	api.init.addcreatehandler(function(params){
		
		return params.catalog == "dummy";
	});
	
	
	/*
	 * 620793115 gets subscribed to the ev channel which menas hes in rcpts list 
	 * so http_resp.write(...) should be called with the ev_create payload.	 
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
								test.equal(json_obj.ev_type,"ev_create");
								test.notEqual(json_obj.ev_tstamp, undefined);
								test.equal(typeof json_obj.ev_tstamp, "number");
								test.deepEqual(json_obj.ev_data,{uid:620793114,
																 doc:{test:"test", uid:620793114, wid:"50187f71556efcbb25000001"},
																 catalog:"dummy" } );	
								
						}
						
				    }; 
				 
	eq.remote.subscribe(http_resp,subs_params);
	test.ok(subs_flags[0]);
	test.ok(subs_flags[1]);
		
	
	api.remote.create(rpc_params, function(err,val){
		
		test.equal(err,null);
		test.notEqual(val,undefined);			
		test.expect(14);
		test.done();
	});
		
}




