var sandbox = require("sandboxed-module");


exports["module exported function"] = function(test){
	
	var sb = require("../lib/sandbox");
	test.notEqual(sb.add_constraint,undefined);
	test.notEqual(sb.execute,undefined);
	test.notEqual(sb.constraints.is_owner,undefined);
	test.notEqual(sb.constraints.in_rcpts,undefined);
	test.notEqual(sb.constraints.user_catalog,undefined);
	test.notEqual(sb.constraints.is_joinable,undefined);
	test.notEqual(sb.constraints.is_reserved,undefined);
	test.notEqual(sb.constraints.field_exists,undefined);
	test.notEqual(sb.constraints.field_not_exists,undefined);
	test.done();
	
}

exports["sandbox.add_constraint: 1/2 satisfied constraints"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var flags = [1,1];
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								test.equal(col_str,"docs");
								test.equal(id_str,"5074b135d03a0ac443000001");
								test.notEqual(dbdocs[id_str], undefined);
								
								ret_handler(null,dbdocs[id_str]);		
							},
							save: function(col_str, doc,ret_handler){
								
								flags[0] = 0;								
								ret_handler(null,{wid:"5074b135d03a0ac443000001",reach:2});
							}
		},
		"./api":{remote:{ join:function( ctx, ret_handler){
							 							 
							 flags[1] = 0;							 
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.
							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	sb.add_constraint("join","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( !(ctx.params.wid && ctx.params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
			
		}
	}).add_constraint("join","is owner",function(ctx){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( ctx.params.uid != ctx.doc.uid ){
		
			return {code:-2, message:"No access permission"};
			
		}
	});
	
	sb.execute("join", params, function(err,doc){
		
		test.ok(flags[0]);
		test.ok(flags[1]);
		test.deepEqual(err, {code:-2, message:"No access permission"});
		test.expect(10);
		test.done();
	});
		
}

exports["sandbox.add_constraint: 2/2 satisfied constraints"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								test.equal(col_str,"docs");
								test.equal(id_str,"5074b135d03a0ac443000001");
								test.notEqual(dbdocs[id_str], undefined);
								
								ret_handler(null,dbdocs[id_str]);		
							},
							save: function(col_str, doc,ret_handler){
								
								test.equal(col_str,"docs");
								test.deepEqual(doc,{_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114, 620793116] })
								ret_handler(null,{wid:"5074b135d03a0ac443000001",reach:2});
							}
		},
		"./api":{remote:{ join:function( ctx, ret_handler){
							 
							 test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
							 test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001", catalog:"docs"});
							 							 
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.
							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.add_constraint("join","wid.length",function(ctx){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( ctx.params.wid.length != 24 ){
		
			return {code:-2, message:"Identifier wid has wrong type"};
			
		}
	}).add_constraint("join","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( !(ctx.params.wid && ctx.params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
			
		}
	});
	
	sb.execute("join", params, function(err,doc){
		
		test.deepEqual(doc.rcpts, [620793114,620793116]);
		test.expect(12);
		test.done();
	});
		
}


exports["sandbox.add_constraint: 2/2 satisfied constraints, save not executed"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };

	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								test.equal(col_str,"docs");
								test.equal(id_str,"5074b135d03a0ac443000001");
								test.notEqual(dbdocs[id_str], undefined);
								
								ret_handler(null,dbdocs[id_str]);		
							},
							save: function(col_str, doc,ret_handler){
								
								flag = 0;								
								ret_handler(null,{wid:"5074b135d03a0ac443000001",reach:2});
							}
		},
		"./api":{remote:{ dummy:function( ctx, ret_handler){
							 
							 test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
							 test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001", catalog:"docs"});
							 							 
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.
							 ctx.doc = undefined;
							 ret_handler( null, 1 );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.add_constraint("dummy","wid.length",function(ctx){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( ctx.params.wid.length != 24 ){
		
			return {code:-2, message:"Identifier wid has wrong type"};
			
		}
	}).add_constraint("dummy","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( !(ctx.params.wid && ctx.params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
			
		}
	});
	
	sb.execute("dummy", params, function(err,val){
		
		test.ok(flag);
		test.deepEqual(val,1);
		test.expect(11);
		test.done();
	});
		
}



exports["sandbox.add_constraint: wid not found"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								test.equal(col_str,"docs");
								test.equal(id_str,"5074b135d03a0ac443000002");								
								
								ret_handler(null,dbdocs[id_str]);//null		
							}
		},
		"./api":{remote:{ join:function( params, doc, ret_handler){
							 
							 flag = 0;
							 							 
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000002"}; //wid not found
	
	sb.add_constraint("join","params",function( ctx ){ //executed constraint
				
		
		if( !(params.wid && params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
					
		}
	}).add_constraint("join","wid.length",function(params,doc){ //executed constraint 
													
		
		if( params.wid.length != 24 ){
		
			return {code:-2, message:"Identifier wid has wrong type"};
			
		}
	});
	
	sb.execute("join", params, function(err,doc){
		
		test.deepEqual(err, { code: -7, message: 'Document not found: @docs:5074b135d03a0ac443000002' });
		test.expect(3);
		test.done();
	});
		
}

exports["sandbox.add_constraint: no wid"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:12345, test:"test", uid:620793114, rcpts:[620793114] };
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								flag = 0;		
							}
		},
		"./api":{remote:{ create:function( ctx, ret_handler){
							 
							 test.equal(ctx.doc, undefined);
							 test.deepEqual(ctx.params, {uid:620793116,doc:{test:1},catalog:"docs"});
							 ret_handler(null, {wid:"5074b135d03a0ac443000001"} );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,doc:{test:1}};
		
	sb.add_constraint("create","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,doc:{test:1},catalog:"docs"});
		test.equal(ctx.doc, undefined);
		
		if(!ctx.params || !(ctx.params.uid && ctx.params.doc ) ){
						
			return {code:-2, message:"Missing parameters:{uid:,doc:,(optional)catalog:}"};						
		}
	});
	
	sb.execute("create", params, function(err,doc){
		
		test.ok(flag);
		test.expect(5);
		test.done();
	});
		
}

exports["sandbox.add_constraint: 1/2 satisfied constraints, no wid "] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:12345, test:"test", uid:620793114, rcpts:[620793114] };
	var flags = [1,1];	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								flags[0] = 0;		
							}
		},
		"./api":{remote:{ create:function( ctx, ret_handler){
							 
							 flags[1] = 0;							 
							 ret_handler(null, {wid:"5074b135d03a0ac443000001"} );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,doc:"not an object"};
		
	sb.add_constraint("create","params",function( ctx ){
				
		test.deepEqual(ctx.params, {uid:620793116,doc:"not an object",catalog:"docs"});
		test.equal(ctx.doc, undefined);
		
		if(!ctx.params || !(ctx.params.uid && ctx.params.doc ) ){
						
			return {code:-2, message:"Missing parameters:{uid:,doc:,(optional)catalog:}"};						
		}
	}).add_constraint("create","typeof",function( ctx ){
				
		
		if( typeof ctx.params.doc !== "object"){
					
			return {code:-2, message:"Wrong parameter type doc: must be an object"};			
		}
	});
	
	sb.execute("create", params, function(err,doc){
		
		test.ok(flags[0]);
		test.ok(flags[1]);
		test.deepEqual(err,{code:-2, message:"Wrong parameter type doc: must be an object"});
		test.expect(5);
		test.done();
	});
		
}

exports["sandbox.add_constraint: 2/2 satisfied known constraints"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							},
							save: function(col_str, doc,ret_handler){
								
								test.equal(col_str,"docs");
								test.deepEqual(doc,{_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114, 620793116] })
								ret_handler(null,{wid:"5074b135d03a0ac443000001",reach:2});
							}
		},
		"./api":{remote:{ join:function( ctx, ret_handler){
							 														 							
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.add_constraint("join","is_joinable",sb.constraints.is_joinable)
	  .add_constraint("join","catalog",sb.constraints.user_catalog);
	
	sb.execute("join", params, function(err,doc){
												
		test.done();
	});
		
}

