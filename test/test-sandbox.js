var sandbox = require("sandboxed-module");


exports["module exported function"] = function(test){
	
	var sb = require("../lib/sandbox");
	test.notEqual(sb.add_constraint_post,undefined);
	test.notEqual(sb.add_constraint_pre,undefined);
	test.notEqual(sb.add_plugin,undefined);
	test.notEqual(sb.execute,undefined);
	test.notEqual(sb.constraints.is_owner,undefined);
	test.notEqual(sb.constraints.has_joined,undefined);
	test.notEqual(sb.constraints.not_joined,undefined);
	test.notEqual(sb.constraints.not_system_catalog,undefined);
	test.notEqual(sb.constraints.user_catalog,undefined);
	test.notEqual(sb.constraints.is_joinable,undefined);
	test.notEqual(sb.constraints.is_reserved,undefined);		
	test.notEqual(sb.constraints.field_exists,undefined);
	test.notEqual(sb.constraints.field_type,undefined);
	test.notEqual(sb.constraints.param_type,undefined);
	test.notEqual(sb.constraints.is_required,undefined);
	test.done();
	
}

exports["sandbox.add_constraint_post: non satisfied constraints"] = function(test){
	
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
	sb.add_constraint_post("join","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( !(ctx.params.wid && ctx.params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
			
		}
	}).add_constraint_post("join","is owner",function(ctx){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( ctx.params.uid != ctx.doc.uid ){
		
			return {code:-2, message:"No access permission"};
			
		}
	});
	
	sb.execute("join", params, function(err,result){
		
		test.ok(flags[0]);
		test.ok(flags[1]);
		test.deepEqual(err, {code:-2, message:"No access permission"});
		test.expect(10);
		test.done();
	});
		
}


exports["sandbox.add_constraint_pre: non satisfied anonymous constraints"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var flags = [1,1,1,1];
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								flags[0] = 0;
								ret_handler(null,dbdocs[id_str]);		
							},
							save: function(col_str, doc,ret_handler){
								
								flags[1] = 0;								
								ret_handler(null,{wid:"5074b135d03a0ac443000001",reach:2});
							}
		},
		"./api":{remote:{ join:function( ctx, ret_handler){
							 							 
							 flags[2] = 0;							 
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.
							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {miss_uid:620793116,wid:"5074b135d03a0ac443000001"};
	sb.add_constraint_pre("join",function( ctx ){
						
		test.equal(ctx.doc, undefined);
		
		if( !(ctx.params.wid && ctx.params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
			
		}
	}).add_constraint_post("join",function(ctx){
		
		flags[3] = 0;
	});
	
	sb.execute("join", params, function(err,result){
		
		test.ok(flags[0]);
		test.ok(flags[1]);
		test.ok(flags[2]);
		test.ok(flags[3]);
		test.deepEqual(err, {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"});
		test.expect(6);
		test.done();
	});
		
}


exports["sandbox.add_constraint_post: 2/2 satisfied constraints"] = function(test){
	
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
				},
				emit: function(ev_name, ctx){
						
						test.equal(ev_name,"ev_api_join");
															
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.add_constraint_post("join","wid.length",function(ctx){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( ctx.params.wid.length != 24 ){
		
			return {code:-2, message:"Identifier wid has wrong type"};
			
		}
	}).add_constraint_post("join","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( !(ctx.params.wid && ctx.params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
			
		}
	});
	
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(result.rcpts, [620793114,620793116]);
		test.expect(13);
		test.done();
	});
		
}


exports["sandbox.add_constraint_post: 2/2 satisfied constraints, save not executed"] = function(test){
	
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
							 ctx.config.save = 0;
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{api:{config:{procedures:{dummy:1}}}}
	
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.add_constraint_post("dummy","wid.length",function(ctx){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( ctx.params.wid.length != 24 ){
		
			return {code:-2, message:"Identifier wid has wrong type"};
			
		}
	}).add_constraint_post("dummy","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"docs"} );		
		test.deepEqual(ctx.doc, dbdocs["5074b135d03a0ac443000001"]);
		
		if( !(ctx.params.wid && ctx.params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
			
		}
	});
	
	sb.execute("dummy", params, function(err,result){
		
		test.ok(flag);
		test.equal(result,1);
		test.expect(11);
		test.done();
	});
		
}



exports["sandbox.add_constraint_post: wid not found"] = function(test){
	
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
	
	sb.add_constraint_post("join","params",function( ctx ){ //executed constraint
				
		
		if( !(params.wid && params.uid) ){
				
			return {code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"};
					
		}
	}).add_constraint_post("join","wid.length",function(params,doc){ //executed constraint 
													
		
		if( params.wid.length != 24 ){
		
			return {code:-2, message:"Identifier wid has wrong type"};
			
		}
	});
	
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(err, { code: -1, message: 'Document not found: #docs/5074b135d03a0ac443000002' });
		test.expect(3);
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: no wid"] = function(test){
	
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
							 
							 test.deepEqual(ctx.doc, {});
							 test.deepEqual(ctx.params, {uid:620793116,doc:{test:1},catalog:"docs"});
							 ctx.config.save = 0;
							 ret_handler(null, {wid:"5074b135d03a0ac443000001"} );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,doc:{test:1}};
		
	sb.add_constraint_post("create","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,doc:{test:1},catalog:"docs"});
		test.deepEqual(ctx.doc, {});
		
		if(!ctx.params || !(ctx.params.uid && ctx.params.doc ) ){
						
			return {code:-2, message:"Missing parameters:{uid:,doc:,(optional)catalog:}"};						
		}
	});
	
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);
		test.expect(5);
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: 1/2 satisfied constraints, no wid "] = function(test){
	
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
		
	sb.add_constraint_post("create","params",function( ctx ){
				
		test.deepEqual(ctx.params, {uid:620793116,doc:"not an object",catalog:"docs"});
		test.deepEqual(ctx.doc, {});
		
		if(!ctx.params || !(ctx.params.uid && ctx.params.doc ) ){
						
			return {code:-2, message:"Missing parameters:{uid:,doc:,(optional)catalog:}"};						
		}
	}).add_constraint_post("create","typeof",function( ctx ){
				
		
		if( typeof ctx.params.doc !== "object"){
					
			return {code:-11, message:"Wrong parameter type doc: must be an object"};			
		}
	});
	
	sb.execute("create", params, function(err,result){
		
		test.ok(flags[0]);
		test.ok(flags[1]);
		test.deepEqual(err,{code:-11, message:"Wrong parameter type doc: must be an object"});
		test.expect(5);
		test.done();
	});
		
}




exports["sandbox.add_constraint_post: anonymous constraints.is_owner"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 0;							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_post("test","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("test", params, function(err,result){
		
		test.ok(flag);
		test.deepEqual(err,{code:-2, message:"No access permission: not owner"});										
		test.expect(2);
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: constraints.is_owner"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
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
	
	sb.add_constraint_post("join","is_owner",sb.constraints.is_owner)
	  .add_constraint_post("join","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(err,{code:-2, message:"No access permission: not owner"});										
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: constraints.has_joined"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114, 620793115] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
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
	
	sb .add_constraint_post("join","has_joined",sb.constraints.has_joined);
	
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(err,{code:-3, message:"No access permission: not joined"});										
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: constraints.not_system_catalog"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
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
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"timers"};
	
	sb .add_constraint_post("join","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(err,{code:-5, message:"No access permission: system catalog"});										
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: constraints.user_catalog"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{
						config:{db:{user_catalogs:["docs", "users"]}},//valid user catalogs
						api:{config:{procedures:{test:1}}}
				    }
		
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"dummy"};//non-valid user catalog
	
	sb .add_constraint_post("test","user_catalog",sb.constraints.user_catalog);
	
	sb.execute("test", params, function(err,result){
		
		test.deepEqual(err,{code:-6, message:"No access permission: not user catalog"});										
		test.done();
	});
		
}



exports["sandbox.add_constraint_post: constraints.is_joinable"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
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
	
	sb.add_constraint_post("join","is_joinable",sb.constraints.is_joinable)
	  .add_constraint_post("join","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(err,{code:-7, message:"No access permission: not joinable/unjoinable"})										
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: constraints.is_reserved"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"_id", value:4};
	
	sb.add_constraint_post("set","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("set", params, function(err,result){
		
		test.deepEqual(err,{code:-8, message:"Reserved word not allowed as field name: " + params.fname })										
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: constraints.field_exists"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", notest:"test", uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:4};
	
	sb.add_constraint_post("set","field_exists",sb.constraints.field_exists)
	  .add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("set", params, function(err,result){
		
		test.deepEqual(err,{code:-9, message:"Not exists: #" + params.catalog + "/" + params.wid + ":" + params.fname});										
		test.done();
	});
		
}


exports["sandbox.add_constraint_post: constraints.field_type object"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:{a:"new object"}};
	
	sb.add_constraint_post("set","field_type",sb.constraints.field_type("object"))
	  .add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("set", params, function(err,result){
		
		test.deepEqual(err,{code:-10, message:"Wrong type: #" + params.catalog + "/" + params.wid + ":" + params.fname + " not object"});										
		test.done();
	});
		
}


exports["sandbox.add_constraint_post: constraints.field_type array"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:{x:1}, uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ push:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname].push(ctx.params.value);							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:5};
	
	sb.add_constraint_pre("push","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_constraint_post("push","field_type",sb.constraints.field_type("array"));
	  
	
	sb.execute("push", params, function(err,result){
		
		test.deepEqual(err,{code:-10, message:"Wrong type: #" + params.catalog + "/" + params.wid + ":" + params.fname + " not array"});										
		test.done();
	});
		
}


exports["sandbox.add_constraint_post: constraints.is_required"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", notest:"test", uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		}
	}
	});
	
	var params = {uid:620793116, fname:"test", value:4};
		
	sb.add_constraint_post("set","param_required_uid",sb.constraints.is_required("uid"))
	  .add_constraint_post("set","param_required_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("set","param_required_fname",sb.constraints.is_required("fname"))
	  .add_constraint_post("set","param_required_value",sb.constraints.is_required("value"))
	  .add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("set", params, function(err,result){
										
		test.deepEqual(err,{code:-12, message:"wid parameter required"});										
		test.done();
	});
		
}


exports["sandbox.add_constraint_post: ctx.config.emit:1"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var api = sandbox.require("../lib/api");
	
	api.remote.set = function(ctx, ret_handler){
		
		ctx.config.emit = 1;
		ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
		ret_handler( null, ctx.doc );
	};	
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								test.equal(col_str,"docs");
								test.equal(id_str,"5074b135d03a0ac443000001");
								
								ret_handler(null,dbdocs[id_str]);		
							},
							save: function(col_str, doc,ret_handler){
																								
								test.equal(col_str,"docs");								
								ret_handler(null,{doc:doc});
							}
		},
		"./api":api
		}		
	
	});
	
	var flag = 0;
	api.on("ev_api_set", function(msg, rcpts){
				
		flag = 1;
	});	
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:{a:"new object"}};
		
	sb.add_constraint_post("set","not_system_catalog",sb.constraints.not_system_catalog);
	
	sb.execute("set", params, function(err,result){
		
		test.ok(flag);
		test.equal(err,undefined);
		test.expect(5);									
		test.done();
	});
		
}



exports["sandbox.add_constraint_post: method not found"] = function(test){
	
	
	var api = require("../lib/api");	
	var sb = sandbox.require("../lib/sandbox",{requires:{"./api":api}});				
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:{a:"new object"}};
		
		
	sb.execute("foooooo", params, function(err,result){
						
		test.deepEqual(err,{ code: -32601, message: "Method not found." });									
		test.done();
	});
		
}


exports["sandbox.add_plugin: custom plugin"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;
							 ctx.config.save = 0;
							 test.deepEqual(ctx.params.rcpts,[620793114,620793119]);							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793114,wid:"5074b135d03a0ac443000001"};
	
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_plugin("test",function(ctx, end_handler){
	  			
	  		  			  		
	  		setTimeout(function(){
	  			ctx.params.rcpts = [620793114,620793119];		  			
	  			end_handler();	
	  		},500);
	  		
	  });
	
	sb.execute("test", params, function(err,result){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(result,1)										
		test.expect(4);
		test.done();
	});
		
}


exports["sandbox.add_plugin: sandbox.plugins.notifying_doc"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;
							 ctx.config.save = 0;
							 test.deepEqual(ctx.params.rcpts,[620793115]);							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115,wid:"5074b135d03a0ac443000001",notifiable:1};
	
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_plugin("test",sb.plugins.notifying_doc);
	
	sb.execute("test", params, function(err,result){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(result,1)										
		test.expect(4);
		test.done();
	});
		
}



exports["sandbox.add_plugin: sandbox.plugins.url_transform1"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;
							 ctx.config.save = 0;
							 test.equal(ctx.params.catalog, "docs");
							 test.equal(ctx.params.wid,"5074b135d03a0ac443000001");
							 test.equal(ctx.params.fname,"a.b.3.c");							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, url:"#docs/5074b135d03a0ac443000001:a.b.3.c"};
	
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_plugin("test",sb.plugins.url_transform);
	
	sb.execute("test", params, function(err,result){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(result,1)										
		test.expect(6);
		test.done();
	});		
		
}


exports["sandbox.add_plugin: sandbox.plugins.url_transform2"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;
							 ctx.config.save = 0;
							 test.equal(ctx.params.catalog, "docs");
							 test.equal(ctx.params.wid,"5074b135d03a0ac443000001");	
							 test.equal(ctx.params.fname, undefined);						 							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, url:"#docs/5074b135d03a0ac443000001:"};
	
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_system_catalog",sb.constraints.not_system_catalog)
	  .add_plugin("test",sb.plugins.url_transform);
	
	sb.execute("test", params, function(err,result){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(result,1)										
		test.expect(6);
		test.done();
	});		
		
}

exports["sandbox.add_plugin: sandbox.plugins.url_transform3"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								ret_handler(null,dbdocs[id_str]);		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;
							 ctx.config.save = 0;
							 test.equal(ctx.params.catalog, "docs");
							 test.equal(ctx.params.wid,undefined);	
							 test.equal(ctx.params.fname, undefined);						 							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, url:"#docs/"};
	
	sb.add_constraint_pre("test","not_system_catalog",sb.constraints.not_system_catalog)	  	  	  
	  .add_plugin("test",sb.plugins.url_transform);
	
	sb.execute("test", params, function(err,result){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(result,1)										
		test.expect(6);
		test.done();
	});		
		
}





