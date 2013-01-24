var sandbox = require("sandboxed-module");

exports["api.remote.get: missing & wrong params"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, test:[4,5,6], z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else
									ret_handler(null,null);								
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{get:1}}}} 
		}
	});
	
	sb.add_constraint_pre("get","not_catalog",sb.constraints.not_catalog,"timers")	
	  .add_constraint_pre("get","param_wid",sb.constraints.is_required("wid"))	  	  	    	  
	  .add_constraint_post("get","exists",sb.constraints.field_exists);
	  	  							
	//user catalog
	var params = {catalog:"timers", wid:"50187f71556efcbb25000002"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-5, message:"No access permission: restricted catalog"});
				
	});
	
	//wid missing
	params = {miss_wid:"50187f71556efcbb25000002"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
				
	});
			
			
	//field exists
	params = {wid:"50187f71556efcbb25000002", fname:"notexists"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:notexists"});		
			
	});
	
	//inner field exists
	params = {wid:"50187f71556efcbb25000002", fname:"z.notexists"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:z.notexists"});		
		
	});			
	
	//document exists
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"test"};
	sb.execute("get", params, function(err,result){
					
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000005"});				
		test.done();
	});				

	
}


exports["api.remote.get: valid params, existing doc, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"dummy"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							},
							criteria:function(col_str,criteria,order,ret_handler){
																															
								ret_handler(null,[{wids:[]}]);
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{get:1}}}}	  
		}
	});
	
	sb.add_constraint_pre("get","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("get","not_catalog",sb.constraints.not_catalog,"events")	
	  .add_constraint_pre("get","param_wid",sb.constraints.is_required("wid"),"dummy")	  	  	    	  
	  .add_constraint_post("get","exists",sb.constraints.field_exists,"dummy")
	  .add_plugin("get","url_transform", sb.plugins.url_transform);
		
	
	var params = {url:"#dummy/50187f71556efcbb25000001"};

						
	sb.execute("get", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.deepEqual(ctx.retval,{wid:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"dummy"});	
		test.expect(4);	
		test.done();		
		
	});
		
	
}


exports["api.remote.get: valid params, existing doc, user catalog, db async"] = function(test){
	
	
	var dbdocs = {users:{}};//users at db
		dbdocs["users"]["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", name:"enric", b:[4,5,6]};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"users");
								test.equal(id_str,"50187f71556efcbb25000001");								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs[col_str]["50187f71556efcbb25000001"]);
								},50);
																
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{get:1}}}}	  
		}
	});
	
	sb.add_constraint_pre("get","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("get","not_catalog",sb.constraints.not_catalog,"events")	
	  .add_constraint_pre("get","param_wid",sb.constraints.is_required("wid"),"users")	  	  	    	  
	  .add_constraint_post("get","exists",sb.constraints.field_exists,"users")
	  .add_plugin("get","url_transform", sb.plugins.url_transform);
		
	
	var params = {url:"#users/50187f71556efcbb25000001"};

						
	sb.execute("get", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.deepEqual(ctx.retval,{uid:"50187f71556efcbb25000001", name:"enric", b:[4,5,6]});	
		test.expect(4);	
		test.done();		
		
	});
		
	
}

exports["api.remote.get: valid params, existing inner field, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								test.equal(col_str,"dummy");
								test.equal(id_str,"50187f71556efcbb25000001");								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
								},50);
																
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{get:1}}}}	  
		}
	});
	
	sb.add_constraint_pre("get","not_catalog",sb.constraints.not_catalog,"timers")	
	  .add_constraint_pre("get","param_wid",sb.constraints.is_required("wid"),"dummy")	  	  	    	  
	  .add_constraint_post("get","exists",sb.constraints.field_exists,"dummy")
	  .add_plugin("get","url_transform", sb.plugins.url_transform);
		
	
	var params = {url:"#dummy/50187f71556efcbb25000001:b"};

						
	sb.execute("get", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.deepEqual(ctx.retval,[4,5,6]);	
		test.expect(4);	
		test.done();		
		
	});
		
	
}
