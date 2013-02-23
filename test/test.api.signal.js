var sandbox = require("sandboxed-module");

exports["api.remote.signal: missing & wrong params"] = function(test){

	var dbusers = {};
	dbusers["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",ctime:1350094951092, push_id:"gcm-111", push_type:"gcm"};
	dbusers["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",ctime:1350094951088, push_id:"gcm-456", push_type:"gcm"};	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								test.equal(col_str,"users");								
								ret_handler(null,dbusers[id_str]);															
							}
						 }					 
		}
	});
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
				  "./api":api,
				  "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{signal:1}}}} 
		}
	});
	sb.init();	
	sb.add_constraint_pre("signal","param_uids",sb.constraints.is_required("uids"))
	  .add_constraint_pre("signal","param_msg",sb.constraints.is_required("msg"));	  	  	    	  
	  
	  	  								
	//uids missing
	var params = {miss_uids:"50187f71556efcbb25000002", msg:{signal_type:"reading",signal_data:{test:1}}};
	sb.execute("signal", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uids parameter required"});
				
	});
			
			
	//msg missing
	params = {uids:"50187f71556efcbb25000002", miss_msg:{signal_type:"reading",signal_data:{test:1}}};
	sb.execute("signal", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "msg parameter required"});
		test.expect(2);
		test.done();		
	});					
}


exports["api.remote.signal: valid params, 1 rcpt"] = function(test){
	
	var dbusers = {};
	dbusers["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",ctime:1350094951092, push_id:"gcm-111", push_type:"gcm"};
	dbusers["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",ctime:1350094951088, push_id:"gcm-456", push_type:"gcm"};	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								test.equal(col_str,"users");								
								ret_handler(null,dbusers[id_str]);															
							}
						 }					 
		}
	});
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
				  "./api":api,
				  "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{signal:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_pre("signal","param_uids",sb.constraints.is_required("uids"))
	  .add_constraint_pre("signal","param_msg",sb.constraints.is_required("msg"));	  	  	    	  
	
	api.on("ev_api_signal",function(msg,rcpts){
				
		test.equal(msg.ev_type,"ev_api_signal");
		test.deepEqual(msg.ev_ctx.payload,{signal_type:"reading",signal_data:{test:1}});
		test.deepEqual(rcpts,[{push_id:"gcm-456",push_type:"gcm"}]);
		
	});  
	  	  								
	var params = {uids:"50187f71556efcbb25000002", msg:{signal_type:"reading",signal_data:{test:1}}};
						
	sb.execute("signal", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.deepEqual(ctx.retval,1);	
		test.expect(6);	
		test.done();		
		
	});
		
	
}

exports["api.remote.signal: valid params, +1 rcpt"] = function(test){
	
	var dbusers = {};
	dbusers["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001",ctime:1350094951092, push_id:"gcm-111", push_type:"gcm"};
	dbusers["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",ctime:1350094951088, push_id:"gcm-456", push_type:"gcm"};	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								test.equal(col_str,"users");								
								ret_handler(null,dbusers[id_str]);															
							}
						 }					 
		}
	});
	var sb = sandbox.require("../lib/sandbox",{
		requires:{
				  "./api":api,
				  "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{signal:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_pre("signal","param_uids",sb.constraints.is_required("uids"))
	  .add_constraint_pre("signal","param_msg",sb.constraints.is_required("msg"));	  	  	    	  
	
	api.on("ev_api_signal",function(msg,rcpts){
				
		test.equal(msg.ev_type,"ev_api_signal");
		test.deepEqual(msg.ev_ctx.payload,{signal_type:"reading",signal_data:{test:1}});
		test.deepEqual(rcpts,[{push_id:"gcm-111",push_type:"gcm"},{push_id:"gcm-456",push_type:"gcm"}]);
		
	});  
	  	  								
	var params = {uids:["50187f71556efcbb25000001","50187f71556efcbb25000002"], msg:{signal_type:"reading",signal_data:{test:1}}};
						
	sb.execute("signal", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.deepEqual(ctx.retval,1);	
		test.expect(7);	
		test.done();		
		
	});
		
	
}

