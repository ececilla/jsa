var sandbox = require("sandboxed-module");


exports["module exported functions"] = function(test){
	
	var sb = require("../lib/sandbox");
	
	test.notEqual(sb.add_constraint_post,undefined);
	test.notEqual(sb.add_constraint_pre,undefined);
	test.notEqual(sb.add_plugin_in,undefined);
	test.notEqual(sb.add_plugin_out,undefined);
	test.notEqual(sb.copy_constraints,undefined);
	test.notEqual(sb.execute,undefined);
	test.notEqual(sb.constraints.is_owner,undefined);
	test.notEqual(sb.constraints.has_joined,undefined);
	test.notEqual(sb.constraints.not_joined,undefined);
	test.notEqual(sb.constraints.not_catalog,undefined);
	test.notEqual(sb.constraints.user_catalog,undefined);
	test.notEqual(sb.constraints.is_joinable,undefined);
	test.notEqual(sb.constraints.is_reserved,undefined);		
	test.notEqual(sb.constraints.field_exists,undefined);
	test.notEqual(sb.constraints.field_type,undefined);
	test.notEqual(sb.constraints.param_type,undefined);
	test.notEqual(sb.constraints.is_required,undefined);
	test.notEqual(sb.constraints.is_protected,undefined);
	test.notEqual(sb.plugins.url_transform, undefined);
	test.notEqual(sb.plugins.notifying_doc, undefined);
	test.notEqual(sb.plugins.notifying_catalog, undefined);
	test.notEqual(sb.plugins.rewrite_id, undefined);
	test.notEqual(sb.plugins.external_config, undefined);
	test.expect(23);
	test.done();
	
}

exports["sandbox.add_constraint_post: non satisfied constraints"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114] };
	
	var flags = [1,1];
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								if(col_str == "docs"){
									test.equal(col_str,"docs");
									test.equal(id_str,"5074b135d03a0ac443000001");
									test.notEqual(dbdocs[id_str], undefined);
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
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
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	sb.init();
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
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {miss_uid:620793116,wid:"5074b135d03a0ac443000001"};
	sb.init();
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
										
								if(col_str == "docs"){
									test.equal(col_str,"docs");
									test.equal(id_str,"5074b135d03a0ac443000001");
									test.notEqual(dbdocs[id_str], undefined);
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							},
							save: function(col_str, doc,ret_handler){
								
								if(col_str == "docs"){
									test.equal(col_str,"docs");
									test.deepEqual(doc,{_id:"5074b135d03a0ac443000001", test:"test", uid:620793114, rcpts:[620793114, 620793116] })
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000001"]});
									ret_handler(null);
								}
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
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	sb.init();
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
	
	sb.execute("join", params, function(err,ctx){
		
		test.deepEqual(ctx.retval.rcpts, [620793114,620793116]);
		test.expect(15);
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
										
								if(col_str == "docs"){
									
									test.equal(col_str,"docs");
									test.equal(id_str,"5074b135d03a0ac443000001");
									test.notEqual(dbdocs[id_str], undefined);
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							},
							save: function(col_str, doc,ret_handler){
								
								flag = 0;								
								ret_handler(null,doc);
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
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{dummy:1}}}}
	
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	sb.init();
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
	
	sb.execute("dummy", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(ctx.retval,1);
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
										
								if(col_str == "docs"){
									test.equal(col_str,"docs");
									test.equal(id_str,"5074b135d03a0ac443000002");								
									
									ret_handler(null,dbdocs[id_str]);//null
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ join:function( params, doc, ret_handler){
							 
							 flag = 0;
							 							 
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000002"}; //wid not found
	sb.init();
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


exports["sandbox.add_constraint_post: uid not found"] = function(test){
	
	var  dbusers = {};
		 dbusers["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", name:"enric", email:"test@test.com"};
		 
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443666666"] = {_id:"5074b135d03a0ac443666666", a:1, b:2, c:3};		 
	
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
										
								if(col_str == "docs"){
									test.equal(col_str,"docs");
									test.equal(id_str,"5074b135d03a0ac443666666");								
									
									ret_handler(null,dbdocs[id_str]);//null
								}else if( col_str == "users"){
									
									test.equal(id_str,"5074b135d03a0ac443000002");																		
									ret_handler(null,dbusers[id_str]);//user not found
								}		
							}
		},
		"./api":{remote:{ join:function( params, doc, ret_handler){
							 
							 flag = 0;
							 							 
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {uid:"5074b135d03a0ac443000002",wid:"5074b135d03a0ac443666666"}; //uid not found		
	sb.init();
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(err, { code: -1, message: 'User not found: #users/5074b135d03a0ac443000002' });
		test.expect(4);
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: no wid, uid"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:12345, test:"test", uid:620793114, rcpts:[620793114] };
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}else
									flag = 0;												
							}
		},
		"./api":{remote:{ create:function( ctx, ret_handler){
							 
							 test.deepEqual(ctx.doc, {});
							 test.deepEqual(ctx.user,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000001"]});
							 test.deepEqual(ctx.params, {uid:620793116,doc:{test:1},catalog:"docs"});
							 ctx.config.save = 0;
							 ret_handler(null, {wid:"5074b135d03a0ac443000001"} );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
	}
	});
	
	var params = {uid:620793116,doc:{test:1}};
	sb.init();	
	sb.add_constraint_post("create","params",function( ctx ){
		
		test.deepEqual(ctx.params, {uid:620793116,doc:{test:1},catalog:"docs"});
		test.deepEqual(ctx.doc, {});
		
		if(!ctx.params || !(ctx.params.uid && ctx.params.doc ) ){
						
			return {code:-2, message:"Missing parameters:{uid:,doc:,(optional)catalog:}"};						
		}
	});
	
	sb.execute("create", params, function(err,result){
		
		test.ok(flag);
		test.expect(6);
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: wid, no uid"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:12345, test:"test", uid:620793114, rcpts:[620793114] };
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
				select: function(col_str, id_str, ret_handler){
							
					if( col_str == "docs"){
						test.equal(col_str,"docs");
						test.equal(id_str,"5074b135d03a0ac443000001");
						ret_handler(null,dbdocs["5074b135d03a0ac443000001"]);
					}		
				}
		},
		"./api":{remote:{ 
						test:function( ctx, ret_handler){
							 
							test.deepEqual(ctx.doc, {_id:12345, test:"test", uid:620793114, rcpts:[620793114] });
							test.deepEqual(ctx.params, {wid:"5074b135d03a0ac443000001",doc:{test:1},catalog:"docs"});
							ctx.config.save = 0;
							
							//change doc object
							ctx.doc.test = "test changed";
							 
							//change params object
							ctx.params.doc.test = 5;
							 
							ret_handler(null, {foo:66} );
						},
						foo: function(ctx,ret_handler){
						 	
							test.deepEqual(ctx.doc,{_id:12345, test:"test changed", uid:620793114, rcpts:[620793114] });
							test.deepEqual(ctx.params,{wid:"5074b135d03a0ac443000001",doc:{test:5},catalog:"docs"});						 							 	
						 	ret_handler(null,{bar:1});
						}
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{test:1,foo:1}}}}
	}
	});
	
	var params = {wid:"5074b135d03a0ac443000001",doc:{test:1}};
	sb.init();	
	sb.add_constraint_post("test","params",function( ctx ){
		
		test.deepEqual(ctx.params, {wid:"5074b135d03a0ac443000001",doc:{test:1},catalog:"docs"});
		test.deepEqual(ctx.doc, {_id:12345, test:"test", uid:620793114, rcpts:[620793114] });
		test.equal(ctx.user,undefined);
		
		if(!ctx.params || !(ctx.params.wid && ctx.params.doc ) ){
						
			return {code:-2, message:"Missing parameters:{wid:,doc:,(optional)catalog:}"};						
		}
	});
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.deepEqual(ctx.retval,{foo:66});
		sb.execute("foo",ctx,function(err,ctx){
			
			test.deepEqual(ctx.retval,{bar:1});
			test.expect(12);
			test.done();	
		});
		
	});
		
}


exports["sandbox.add_constraint_post: 1/2 satisfied constraints, no wid "] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:12345, test:"test", uid:620793114, rcpts:[620793114] };
	var flags = [1,1];	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}else		
									flags[0] = 0;		
							}
		},
		"./api":{remote:{ create:function( ctx, ret_handler){
							 
							 flags[1] = 0;							 
							 ret_handler(null, {wid:"5074b135d03a0ac443000001"} );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{create:1}}}}
	}
	});
	
	var params = {uid:620793116,doc:"not an object"};
	sb.init();	
	sb.add_constraint_post("create","params",function( ctx ){
				
		test.deepEqual(ctx.params, {uid:620793116,doc:"not an object",catalog:"docs"});
		test.deepEqual(ctx.doc, {});
		test.deepEqual(ctx.user,{_id:620793116, name:"enric",wids:["50187f71556efcbb25000001"]});
		
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
		test.expect(6);
		test.done();
	});
		
}

exports["sandbox.copy_constraints: constraints.is_owner"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "dummy"){	
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 							 														 														 							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"dummy"};
	sb.init();
	sb.add_constraint_post("test","is_owner",sb.constraints.is_owner)
	  .add_constraint_post("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("test","not_catalog",sb.constraints.not_catalog,"events");
	  
	sb.copy_constraints("docs","dummy"); 
	
	sb.execute("test", params, function(err,result){
		
		test.deepEqual(err,{code:-2, message:"No access permission: not owner"});										
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
								
								if( col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 0;							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.init();
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_post("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("test","not_catalog",sb.constraints.not_catalog,"events");
	
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
								
								if(col_str == "docs"){	
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ join:function( ctx, ret_handler){
							 														 							
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.init();
	sb.add_constraint_post("join","is_owner",sb.constraints.is_owner)
	  .add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"events");
	
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
								
								if(col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ join:function( ctx, ret_handler){
							 														 							
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.init();
	sb .add_constraint_post("join","has_joined",sb.constraints.has_joined);
	
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(err,{code:-3, message:"No access permission: not joined"});										
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: constraints.not_catalog"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "timers"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ join:function( ctx, ret_handler){
							 														 							
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs",system_catalogs:["timers","events"]}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"timers"};
	
	sb.init();
	sb .add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"timers");
	
	sb.execute("join", params, function(err,result){
		
		test.deepEqual(err,{code:-5, message:"No access permission: restricted catalog"});										
		test.done();
	});
		
}

exports["sandbox.add_constraint_post: constraints.user_catalog"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "dummy"){	
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{
						config:{db:{user_catalogs:["docs", "users"]}, app:{status:1}},//valid user catalogs
						api:{config:{procedures:{test:1}}}
				    }
		
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",catalog:"dummy"};//non-valid user catalog
	
	sb.init();
	sb .add_constraint_post("test","user_catalog",sb.constraints.user_catalog,"dummy");
	
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
								
								if(col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ join:function( ctx, ret_handler){
							 														 							
							 ctx.doc.rcpts.push(ctx.params.uid);//add uid to rcpts list.							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001"};
	
	sb.init();
	sb.add_constraint_post("join","is_joinable",sb.constraints.is_joinable)
	  .add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"timers");
	
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
								
								if(col_str == "docs"){	
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"_id", value:4};
	
	sb.init();
	sb.add_constraint_post("set","is_reserved",sb.constraints.is_reserved)
	  .add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"timers");
	
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
								
								if( col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:4};
	
	sb.init();
	sb.add_constraint_post("set","field_exists",sb.constraints.field_exists)
	  .add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"timers");
	
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
								
								if(col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:{a:"new object"}};
	
	sb.init();
	sb.add_constraint_post("set","field_type",sb.constraints.field_type("object"))
	  .add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"events");
	
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
								
								if( col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ push:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname].push(ctx.params.value);							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{push:1}}}}
	}
	});
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:5};
	
	sb.init();
	sb.add_constraint_pre("push","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("push","field_type",sb.constraints.field_type("array"));
	  
	
	sb.execute("push", params, function(err,result){
		
		test.deepEqual(err,{code:-10, message:"Wrong type: #" + params.catalog + "/" + params.wid + ":" + params.fname + " not array"});										
		test.done();
	});
		
}


exports["sandbox.add_constraint_pre: constraints.is_required"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", notest:"test", uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1}}}}
	}
	});
	
	var params = {uid:620793116, fname:"test", value:4};
	
	sb.init();	
	sb.add_constraint_pre("set","param_required_uid",sb.constraints.is_required("uid"))
	  .add_constraint_pre("set","param_required_wid",sb.constraints.is_required("wid"))
	  .add_constraint_pre("set","param_required_fname",sb.constraints.is_required("fname"))
	  .add_constraint_pre("set","param_required_value",sb.constraints.is_required("value"))
	  .add_constraint_pre("set","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("set","not_catalog",sb.constraints.not_catalog,"events");
	
	sb.execute("set", params, function(err,result){
										
		test.deepEqual(err,{code:-12, message:"wid parameter required"});										
		test.done();
	});
		
}

exports["sandbox.add_constraint_pre: constraints.is_protected"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:6, test2:7, uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1}}}}
	}
	});
	
	var params = {uid:620793116, fname:["test","test2"], value:4};
	
	sb.init();	
	sb.add_constraint_pre("set","protected_test",sb.constraints.is_protected("test"))	  
	  .add_constraint_pre("set","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("set","not_catalog",sb.constraints.not_catalog,"events");
	
	sb.execute("set", params, function(err,ctx){
												
		test.deepEqual(err,{code:-13, message:"Protected field not allowed as field name"});										
		test.done();
	});
		
}

exports["sandbox.add_constraint_pre: constraints.is_protected array"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:6, test2:7, uid:620793114, rcpts:[620793114] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "docs"){
									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["50187f71556efcbb25000001"]});
								}		
							}
		},
		"./api":{remote:{ set:function( ctx, ret_handler){
							 														 							
							 ctx.doc[ctx.params.fname] = ctx.params.value;							 							 
							 ret_handler( null, ctx.doc );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{set:1}}}}
	}
	});
	
	var params = {uid:620793116, fname:["test","test2"], value:4};
	
	sb.init();	
	sb.add_constraint_pre("set","protected_test",sb.constraints.is_protected(["test3","test"]))	  
	  .add_constraint_pre("set","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("set","not_catalog",sb.constraints.not_catalog,"events");
	
	sb.execute("set", params, function(err,ctx){
												
		test.deepEqual(err,{code:-13, message:"Protected field not allowed as field name"});										
		test.done();
	});
		
}

exports["sandbox.add_constraint_pre: constraints.is_disabled"] = function(test){
		
	
	var sb = sandbox.require("../lib/sandbox",{requires:{		
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 														 							 							 
							 ret_handler( null, "test" );//return test string
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {catalog:"dummy"};
	
	sb.init();	
	sb.add_constraint_pre("test","is_disabled_test",sb.constraints.is_disabled,"dummy");	  	  
	  
	
	sb.execute("test", params, function(err,ctx){
												
		test.deepEqual(err,{code:-14, message:"operation disabled for catalog dummy"});										
		test.expect(1);
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
								
								if( col_str == "docs"){
									test.equal(col_str,"docs");
									test.equal(id_str,"5074b135d03a0ac443000001");									
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users"){
																											
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});
								}		
							},
							save: function(col_str, doc,ret_handler){
																								
								if(col_str == "docs"){
									test.equal(col_str,"docs");								
									ret_handler(null,{doc:doc});
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793116, name:"enric",wids:["5074b135d03a0ac443000001"]});
									ret_handler(null);
								}
							}
		},
		"./api":api,
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{set:1}}}}
		}		
	
	});
	
	var flag = 0;
	api.on("ev_api_set", function(msg, rcpts){
				
		flag = 1;
	});	
	
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:{a:"new object"}};
	
	sb.init();	
	sb.add_constraint_post("set","not_catalog",sb.constraints.not_catalog,"timers");
	
	sb.execute("set", params, function(err,result){
		
		test.ok(flag);
		test.equal(err,undefined);
		test.expect(7);									
		test.done();
	});
		
}



exports["sandbox.add_constraint_post: method not found"] = function(test){
	
	
	var api = require("../lib/api");	
	var sb = sandbox.require("../lib/sandbox",{requires:{
			"./api":api,
			"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{foooooo:1}}}},			
	}});				
	var params = {uid:620793116,wid:"5074b135d03a0ac443000001",fname:"test", value:{a:"new object"}};
		
	sb.init();	
	sb.execute("foooooo", params, function(err,result){
						
		test.deepEqual(err,{ code: -32601, message: "Method not found." });									
		test.done();
	});
		
}


exports["sandbox.add_plugin_in: custom plugin"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "docs")
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});	
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
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793114,wid:"5074b135d03a0ac443000001"};
	sb.init();
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")
	  .add_plugin_in("test",function(ctx, end_handler){
	  			
	  		  			  		
	  		setTimeout(function(){
	  			ctx.params.rcpts = [620793114,620793119];		  			
	  			end_handler();	
	  		},500);
	  		
	  });
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(4);
		test.done();
	});
		
}

exports["sandbox.add_plugin_in: custom plugin, ctx.err returned"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	var flags = [1,1,1];
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								flags[0] = 0;	//No loadobject is called because plugin returns error.							
								ret_handler(null,null);	
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flags[1] = 0;		//No api function is called because plugin returns error.					 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793114,wid:"5074b135d03a0ac443000001"};
	
	sb.init();
	sb.add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")
	  .add_plugin_in("test",function(ctx, end_handler){
	  				  		  			  		
	  		setTimeout(function(){
	  			
	  			ctx.err = {code:-555,message:"custom error"};		  				  			
	  			end_handler();	
	  		},500);
	  		
	  });
	
	sb.execute("test", params, function(err,ctx){
				
		test.ok(flags[0]);
		test.ok(flags[1]);
		test.equal(ctx,null);
		test.deepEqual(err,{code:-555,message:"custom error"});											
		test.expect(4);
		test.done();
	});
		
}

exports["sandbox.add_plugin_out: custom plugout, ctx.retval interception"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "docs")
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});			
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;
							 ctx.config.save = 0;							 
							 							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793114,wid:"5074b135d03a0ac443000001"};
	
	sb.init();
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")
	  .add_plugin_out("test",function(ctx, end_handler){
	  			
	  		  			  		
	  		setTimeout(function(){ //change return value.
	  			ctx.retval = 99;		  			
	  			end_handler();	
	  		},500);
	  		
	  });
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,99)										
		test.expect(3);
		test.done();
	});
		
}

exports["sandbox.add_plugin_out: custom plugout, ctx.doc interception"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								//load document
								if(col_str == "docs"){
									test.equal(dbdocs["5074b135d03a0ac443000001"].test, "test");
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});	
																										
							},
							save: function(col_str, doc, ret_handler){
								
								//save document
								if(col_str == "docs"){								
									test.equal(col_str,"docs");
									test.equal(doc.test,"foobar");
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["5074b135d03a0ac443000001"]});
									ret_handler(null);
								}
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;	
							 ctx.config.emit = 0;						 														  							 
							 ret_handler( null, 1 );
						 }						 
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793114,wid:"5074b135d03a0ac443000001"};
	
	sb.init();
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")
	  .add_plugin_out("test",function(ctx, end_handler){
	  			
	  		  			  		
	  		setTimeout(function(){ //change saved document.
	  			ctx.doc.test = "foobar";		  			
	  			end_handler();	
	  		},500);
	  		
	  });
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(8);
		test.done();
	});
		
}


exports["sandbox.add_plugin_out: custom plugout, ctx.payload interception"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793114 };
	var flag = 0;
	var api = require("../lib/api");
	api.remote.test = function(ctx, ret_handler){
		
		flag = 1;	
		ctx.config.emit = 1;
		ctx.config.save = 1;
		ctx.payload = ctx.config;//Make payload point to config params.						 														  							 
		ret_handler( null, 1 );
	};
	api.on("ev_api_test",function(data){
				
		test.deepEqual(data.ev_ctx.payload,{emit:1, save:1, test:"foobar"});
	})
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								
								//load document
								if(col_str == "docs"){
									test.equal(dbdocs["5074b135d03a0ac443000001"].test, "test");
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});		
							},
							save: function(col_str, doc, ret_handler){
								
								//save document	
								if(col_str == "docs"){							
									test.equal(col_str,"docs");
									test.equal(doc.test,"test");
									ret_handler(null,doc);
								}else if(col_str == "users"){
									test.equal(col_str,"users");
									test.deepEqual(doc,{_id:620793114, name:"enric",wids:["5074b135d03a0ac443000001"]});
									ret_handler(null);
								}
							}
		},
		"./api":api,
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793114,wid:"5074b135d03a0ac443000001"};
	
	sb.init();
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_plugin_out("test",function(ctx, end_handler){
	  			
	  		  			  		
	  		setTimeout(function(){ //change payload:add param 
	  			ctx.payload.test = "foobar";		  			
	  			end_handler();	
	  		},500);
	  		
	  });
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(9);
		test.done();
	});
		
}



exports["sandbox.add_plugin_in: sandbox.plugins.notifying_doc"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if(col_str == "docs"){
									ret_handler(null,dbdocs[id_str]);
								}else if( col_str == "users")
									ret_handler(null,{_id:id_str, push_id:"gcm-115", push_type:"gcm", name:"enric",wids:["5074b135d03a0ac443000001"]});		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;
							 test.deepEqual(ctx.user,{_id:620793115, push_id:"gcm-115", push_type:"gcm", name:"enric",wids:["5074b135d03a0ac443000001"]});
							 ctx.config.save = 0;
							 test.deepEqual(ctx.params.rcpts,[{uid:"620793115", push_id:"gcm-115", push_type:"gcm"}]);							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115,wid:"5074b135d03a0ac443000001",notifiable:1};
	
	sb.init();
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")
	  .add_plugin_mid("test",sb.plugins.notifying_doc);
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(5);
		test.done();
	});
		
}



exports["sandbox.add_plugin_in: sandbox.plugins.url_transform1"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if( col_str == "docs")
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});		
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
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, url:"#docs/5074b135d03a0ac443000001:a.b.3.c"};
	
	sb.init();
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")
	  .add_plugin_in("test",sb.plugins.url_transform);
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(6);
		test.done();
	});		
		
}


exports["sandbox.add_plugin_in: sandbox.plugins.url_transform2"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if( col_str == "docs" )
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});		
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
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, url:"#docs/5074b135d03a0ac443000001:"};
	
	sb.init();
	sb.add_constraint_post("test",sb.constraints.is_owner)
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")
	  .add_plugin_in("test",sb.plugins.url_transform);
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(6);
		test.done();
	});		
		
}

exports["sandbox.add_plugin_in: sandbox.plugins.url_transform3"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if( col_str == "docs" )
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});		
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
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers", "events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, url:"#docs/"};
	
	sb.init();
	sb.add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")	  	  	  
	  .add_plugin_in("test",sb.plugins.url_transform);
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(6);
		test.done();
	});		
		
}

exports["sandbox.add_plugin_in: sandbox.plugins.url_transform overwrite"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", uid:620793115 };
	var flag = 0;
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if( col_str == "docs")
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});		
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 flag = 1;
							 ctx.config.save = 0;
							 test.equal(ctx.params.catalog, "docs");
							 test.equal(ctx.params.wid,"5074b135d03a0ac443000001");	
							 test.equal(ctx.params.fname, "test.5");						 							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers", "events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, url:"#docs/5074b135d03a0ac443000001:test.5", catalog:"dummy", wid:"5074b135d03a0ac443000006", fname:"no-test"};
	
	sb.init();
	sb.add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")	  	  	  
	  .add_plugin_in("test","url_transform",sb.plugins.url_transform,"dummy");
	
	sb.execute("test", params, function(err,ctx){
		
		test.ok(flag);
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(6);
		test.done();
	});		
		
}

exports["sandbox.add_plugin_in: sandbox.plugins.external_config"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", catalog:"dummy", uid:620793115, rcpts:[620793115] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if( col_str == "dummy")
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});			
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 
							 ctx.config.save = 0;							 
							 test.deepEqual(ctx.config,{save:0, emit:1, test:1});							 
							 test.equal(ctx.params.config, undefined);					 							 
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers", "events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, catalog:"dummy", wid:"5074b135d03a0ac443000001", config:{test:1} };
	
	sb.init();
	sb.add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")	  	  	  
	  .add_plugin_in("test","external_config",sb.plugins.external_config,"dummy");
	
	sb.execute("test", params, function(err,ctx){
				
		test.equal(err,null);
		test.equal(ctx.retval,1)										
		test.expect(4);
		test.done();
	});		
		
}

exports["sandbox.add_plugin_in: sandbox.plugins.extract_hashtags"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", catalog:"dummy", uid:620793115, rcpts:[620793115] };
		 dbdocs["5074b135d03a0ac443000002"] = {_id:"5074b135d03a0ac443000002", test:"test2", catalog:"dummy", uid:620793117, rcpts:[620793117] };
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if( col_str == "dummy")
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,[{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]}]);			
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 														 
							 ctx.config.save = 0;
							 test.deepEqual(ctx.params.doc.hashtags,["#test","#foo","#subject","#hashtagtest"]);							 							 							 							 				 							
							 ret_handler( null, 1 );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers", "events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, catalog:"dummy", wid:"5074b135d03a0ac443000001", doc:{body:"this is a #test body #foo",subject:"this is a #subject #test aswell #hashtagtest",num:1} };
	
	sb.init();
	sb.add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")	  	  	  
	  .add_plugin_in("test","extract_hashtags_body",sb.plugins.extract_hashtags("body"),"dummy")
	  .add_plugin_in("test","extract_hashtags_subject",sb.plugins.extract_hashtags("subject"),"dummy")
	  .add_plugin_in("test","extract_hashtags_baaaaaaar",sb.plugins.extract_hashtags("baaaaaaaaar"),"dummy")
	  .add_plugin_in("test","extract_hashtags_num",sb.plugins.extract_hashtags("num"),"dummy");
	  
	
	sb.execute("test", params, function(err,ctx){
				
		test.equal(err,null);
		test.deepEqual(ctx.retval,1);										
		test.expect(3);
		test.done();
	});		
		
}



exports["sandbox.add_plugin_out: sandbox.plugins.rewrite_id"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", catalog:"dummy", uid:620793115, rcpts:[620793115] };
	
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if( col_str == "dummy")
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]});			
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 
							 ctx.config.save = 0;							 							 							 							 				 							
							 ret_handler( null, dbdocs["5074b135d03a0ac443000001"] );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers", "events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, catalog:"dummy", wid:"5074b135d03a0ac443000001" };
	
	sb.init();
	sb.add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")	  	  	  
	  .add_plugin_out("test","rewrite_id",sb.plugins.rewrite_id,"dummy");
	
	sb.execute("test", params, function(err,ctx){
				
		test.equal(err,null);
		test.deepEqual(ctx.retval,{wid:"5074b135d03a0ac443000001", test:"test", catalog:"dummy", uid:620793115, rcpts:[620793115] });										
		test.expect(2);
		test.done();
	});		
		
}

exports["sandbox.add_plugin_out: sandbox.plugins.rewrite_id over array"] = function(test){
	
	var  dbdocs = {};
		 dbdocs["5074b135d03a0ac443000001"] = {_id:"5074b135d03a0ac443000001", test:"test", catalog:"dummy", uid:620793115, rcpts:[620793115] };
		 dbdocs["5074b135d03a0ac443000002"] = {_id:"5074b135d03a0ac443000002", test:"test2", catalog:"dummy", uid:620793117, rcpts:[620793117] };
	var sb = sandbox.require("../lib/sandbox",{requires:{
		"./db":{
							select: function(col_str, id_str, ret_handler){																																		
								
								if( col_str == "dummy")
									ret_handler(null,dbdocs[id_str]);
								else if( col_str == "users")
									ret_handler(null,[{_id:id_str, name:"enric",wids:["5074b135d03a0ac443000001"]}]);			
							}
		},
		"./api":{remote:{ test:function( ctx, ret_handler){
							 														 							
							 
							 ctx.config.save = 0;							 							 							 							 				 							
							 ret_handler( null, [dbdocs["5074b135d03a0ac443000001"],dbdocs["5074b135d03a0ac443000002"]] );
						  }
				}
		},
		"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers", "events"]}},api:{config:{procedures:{test:1}}}}
	}
	});
	
	var params = {uid:620793115, catalog:"dummy", wid:"5074b135d03a0ac443000001" };
	
	sb.init();
	sb.add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_pre("test","not_catalog",sb.constraints.not_catalog,"events")	  	  	  
	  .add_plugin_out("test","rewrite_id",sb.plugins.rewrite_id,"dummy");
	
	sb.execute("test", params, function(err,ctx){
				
		test.equal(err,null);
		test.deepEqual(ctx.retval,[{wid:"5074b135d03a0ac443000001", test:"test", catalog:"dummy", uid:620793115, rcpts:[620793115] },{wid:"5074b135d03a0ac443000002", test:"test2", catalog:"dummy", uid:620793117, rcpts:[620793117] }]);										
		test.expect(2);
		test.done();
	});		
		
}







