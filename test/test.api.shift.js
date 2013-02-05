var sandbox = require("sandboxed-module");

exports["api.remote.shift: missing & wrong params"] = function(test){

	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, test:[4,5,6], z:{y:1}, rcpts:[620793114,620793115]};
		
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																																						
								if(col_str == "docs")								
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000002"]});
								}	
								else
									ret_handler(null,null);								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{shift:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_post("shift","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("shift","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("shift","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("shift","param_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("shift","param_fname",sb.constraints.is_required("fname"))	    
	  .add_constraint_post("shift","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("shift","exists",sb.constraints.field_exists)
	  .add_constraint_post("shift","has_joined",sb.constraints.has_joined)
	  .add_constraint_post("shift","field_type",sb.constraints.field_type("array"));
			
			
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "uid parameter required"});		
		
	});
	
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
				
	});
	
	
	//fname missing
	params = {uid:620793114, wid:"50187f71556efcbb25000002", miss_fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-12, message: "fname parameter required"});
		
	}); 		
	
	//reserved _id as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"_id"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: _id"});
			
	});
	
	//reserved uid as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"uid"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: uid"});
			
	});
	
	//reserved rcpts as field name
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"rcpts"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-8, message: "Reserved word not allowed as field name: rcpts"});		
			
	});
	
	//field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"notexists"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:notexists"});		
			
	});
	
	//inner field exists
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.notexists"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-9, message: "Not exists: #docs/50187f71556efcbb25000002:z.notexists"});		
		
	});
	
	
	//uid must belong to rcpts
	params = {uid:620793999, wid:"50187f71556efcbb25000002", fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-3, message: "No access permission: not joined"});		
		
	});
	
	//document exists
	params = {uid:620793114, wid:"50187f71556efcbb25000005", fname:"test"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-1, message: "Document not found: #docs/50187f71556efcbb25000005"});				
		
	});
	
	//field is array
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-10, message: "Wrong type: #docs/50187f71556efcbb25000002:z not array"});				
		
	});
	
	//inner field is array
	params = {uid:620793114, wid:"50187f71556efcbb25000002", fname:"z.y"};
	sb.execute("shift", params, function(err,result){
					
		test.deepEqual(err, {code:-10, message: "Wrong type: #docs/50187f71556efcbb25000002:z.y not array"});		
		test.done();
		
	});

	
}


exports["api.remote.shift: valid params, existing field as array, explicit catalog, db async"] = function(test){
	
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, b:[4,5,6], rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].b, [4,5,6]);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000002"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "dummy"){
								test.equal(col_str,"dummy");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].b, [5,6]);								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{shift:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_pre("shift","not_catalog",sb.constraints.not_catalog,"fooooo")
	  .add_constraint_post("shift","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("shift","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("shift","param_fname",sb.constraints.is_required("fname"),"dummy")	  
	  .add_constraint_post("shift","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("shift","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("shift","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"b", catalog:"dummy"};

						
	sb.execute("shift", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});
		
	
}

exports["api.remote.shift: valid params, existing inner field as array, explicit catalog, db async"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793114, a:{b:[4,5,6],c:1}, rcpts:[620793114,620793117], catalog:"docs"};
		
				
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
																														
								if(col_str == "dummy"){
									test.equal(col_str,"dummy");
									test.equal(id_str,"50187f71556efcbb25000001");
									test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [4,5,6]);
									
									setTimeout(function(){ //db 50ms delay retrieving document
										
										ret_handler(null,dbdocs["50187f71556efcbb25000001"]);
									},50);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000002"]});
								}
																
							},
							save:function(col_str,doc,ret_handler){
															
								
								if(col_str == "dummy"){
								test.equal(col_str,"dummy");
								test.deepEqual(dbdocs["50187f71556efcbb25000001"].a.b, [5,6]);								
								
								setTimeout(function(){ //db 50ms delay retrieving document
									
									ret_handler(null,doc);
								},50);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000002"]});
									ret_handler(null);
								}
								
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{shift:1}}}}	  
		}
	});
	sb.init();
	sb.add_constraint_post("shift","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("shift","param_wid",sb.constraints.is_required("wid"),"dummy")
	  .add_constraint_post("shift","param_uid",sb.constraints.is_required("uid"),"dummy")
	  .add_constraint_post("shift","param_fname",sb.constraints.is_required("fname"),"dummy")	  	  
	  .add_constraint_post("shift","is_reserved",sb.constraints.is_reserved,"dummy")
	  .add_constraint_post("shift","exists",sb.constraints.field_exists,"dummy")
	  .add_constraint_post("shift","has_joined",sb.constraints.has_joined,"dummy");
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001",fname:"a.b", catalog:"dummy"};

						
	sb.execute("shift", params, function(err,ctx){
						
						
		test.equal(err,null);		
		test.equal(ctx.retval,1);	
		test.expect(9);	
		test.done();		
		
	});	
			
}
