var sandbox = require("sandboxed-module");
var async = require("async");


exports["api.remote.join: missing params"] = function(test){
	
		
	var flag = 1;
	var dbdocs = {};
	dbdocs["50187f71556efcbb25000002"] = {_id:"50187f71556efcbb25000002",uid:620793114, ctime:1350094951092, catalog:"dummy", test:"test", rcpts:[620793114]};
	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000002");
									ret_handler(null,dbdocs[id_str]);//return doc
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000002"]});
								}																																					
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint is not satisfied
								flag = 0;
								ret_handler();	
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs"}},api:{config:{procedures:{join:1}}}} 
		}
	});
	sb.init();
	sb.add_constraint_post("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("join","param_uid",sb.constraints.is_required("uid"));
		
	//uid missing
	var params = {miss_uid:620793114, wid:"50187f71556efcbb25000002"};
	sb.execute("join", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "uid parameter required"});
		
	});
		
	
	//wid missing
	params = {uid:620793114, miss_wid:"50187f71556efcbb25000002"};
	sb.execute("join", params, function(err,result){
		
		test.ok(flag);		
		test.deepEqual(err, {code:-12, message: "wid parameter required"});
		test.expect(7);
		test.done();
	}); 
	
	
}



exports["api.remote.join: valid params, default catalog, no ev_types"] = function(test){
	
		
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793115, a:1, b:"test1234", rcpts:[{uid:"620793115", push_id:"gcm-115", push_type:"gcm"},{uid:"620793117", push_id:"gcm-117", push_type:"gcm"}], catalog:"docs"};
		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure							
							
		}}
	});
	var dbusers = {620793114:{_id:620793114, name:"enric", push_id:"gcm-114", push_type:"gcm", wids:[]}, 620793117:{_id:620793117, name:"foo", push_id:"gcm-117", push_type:"gcm", wids:["50187f71556efcbb25000001"]}};
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000001");
									ret_handler(null,dbdocs[id_str]);//return doc
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,dbusers["" + id_str]);
								}																						
																																							
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "docs"){								
									test.equal(col_str,"docs");
									test.deepEqual(doc.rcpts, [{uid:"620793115",push_id:"gcm-115", push_type:"gcm"},{uid:"620793117",push_id:"gcm-117", push_type:"gcm"},{uid:"620793114",push_id:"gcm-114",push_type:"gcm"}]);
																	
									//save doc to db...returns with _id:12345
									setTimeout(function(){//100ms delay saving document
										
										ret_handler(null,doc);
									},100);	
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc.wids,["50187f71556efcbb25000001"]);																												
									ret_handler(null);
								}
							}
						 },
				 "./api" : api,
				 "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{join:1}}}}		  
		}
	});
	sb.init();
	sb.add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"timers")	
	  .add_constraint_post("join","is_joinable",sb.constraints.is_joinable)	
	  .add_constraint_post("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("join","param_uid",sb.constraints.is_required("uid"));
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001"};//uid not in rcpts
	async.series(
		[function(next){
						
			sb.execute("join", params, function(err,ctx){
								
				test.ok(flag);				
				test.equal(err,null);		
				test.deepEqual(ctx.retval.rcpts, [{uid:"620793115",push_id:"gcm-115", push_type:"gcm"},{uid:"620793117", push_id:"gcm-117", push_type:"gcm"},{uid:"620793114", push_id:"gcm-114",push_type:"gcm"}]);
				test.equal(ctx.retval._id, undefined);		
				test.equal(ctx.retval.wid, "50187f71556efcbb25000001");
				test.equal(ctx.retval.catalog, "docs");		
				test.equal(ctx.retval.a,1);
				test.equal(ctx.retval.b,"test1234");		
				next();		
				
			});
			
		},function(next){
			params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid in rcpts
						
			sb.execute("join", params, function(err,ctx){
								
				test.ok(flag);	
				test.equal(err,null);		
				test.equal(ctx.retval,1);
				
				test.expect(21);
				test.done();
				next();
				
			});
			
		}]);				
		
}

exports["api.remote.join: valid params, default catalog, ev_types"] = function(test){
	
		
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793115, a:1, b:"test1234", rcpts:[{uid:"620793115", push_id:"gcm-115", push_type:"gcm"},{uid:"620793117", push_id:"gcm-117", push_type:"gcm"}], catalog:"docs"};
		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure							
							
		}}
	});
	var dbusers = {620793114:{_id:620793114, name:"enric", push_id:"gcm-114", push_type:"gcm", wids:[]}, 620793117:{_id:620793117, name:"foo", push_id:"gcm-117", push_type:"gcm", wids:["50187f71556efcbb25000001"]}};
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000001");
									ret_handler(null,dbdocs[id_str]);//return doc
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,dbusers["" + id_str]);
								}																						
																																							
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "docs"){								
									test.equal(col_str,"docs");
									test.deepEqual(doc.rcpts, [{uid:"620793115",push_id:"gcm-115", push_type:"gcm"},{uid:"620793117",push_id:"gcm-117", push_type:"gcm"},{uid:"620793114",push_id:"gcm-114",push_type:"gcm",ev_types:["ev_api_set","ev_api_create"]}]);
																	
									//save doc to db...returns with _id:12345
									setTimeout(function(){//100ms delay saving document
										
										ret_handler(null,doc);
									},100);	
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc.wids,["50187f71556efcbb25000001"])																												
									ret_handler(null);
								}
							}
						 },
				 "./api" : api,
				 "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{join:1}}}}		  
		}
	});
	sb.init();
	sb.add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"timers")	
	  .add_constraint_post("join","is_joinable",sb.constraints.is_joinable)	
	  .add_constraint_post("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("join","param_uid",sb.constraints.is_required("uid"));
		
	
	var params = {uid:620793114, wid:"50187f71556efcbb25000001", ev_types:["ev_api_set","ev_api_create"]};//uid not in rcpts
	async.series(
		[function(next){
						
			sb.execute("join", params, function(err,ctx){
								
				test.ok(flag);				
				test.equal(err,null);		
				test.deepEqual(ctx.retval.rcpts, [{uid:"620793115", push_id:"gcm-115", push_type:"gcm"},{uid:"620793117", push_id:"gcm-117", push_type:"gcm"},{uid:"620793114", push_id:"gcm-114",push_type:"gcm",ev_types:["ev_api_set","ev_api_create"]}]);
				test.equal(ctx.retval._id, undefined);		
				test.equal(ctx.retval.wid, "50187f71556efcbb25000001");
				test.equal(ctx.retval.catalog, "docs");		
				test.equal(ctx.retval.a,1);
				test.equal(ctx.retval.b,"test1234");		
				next();		
				
			});
			
		},function(next){
			params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid in rcpts
						
			sb.execute("join", params, function(err,ctx){
								
				test.ok(flag);	
				test.equal(err,null);		
				test.equal(ctx.retval,1);
				
				test.expect(21);
				test.done();
				next();
				
			});
			
		}]);				
		
}

exports["api.remote.join: valid params, default catalog, already joined, ev_types"] = function(test){
	
		
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793115, a:1, b:"test1234", rcpts:[{push_id:"gcm-115", push_type:"gcm",ev_types:["ev_api_pop"]},{push_id:"gcm-117", push_type:"gcm"}], catalog:"docs"};
		
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure							
							
		}}
	});
	var dbusers = {620793115:{name:"loser", push_id:"gcm-115", push_type:"gcm", wids:["50187f71556efcbb25000001"]},620793114:{name:"enric", push_id:"gcm-114", push_type:"gcm", wids:[]}, 620793117:{name:"foo", push_id:"gcm-117", push_type:"gcm", wids:["50187f71556efcbb25000001"]}};
	var flag = 1;
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000001");
																		
									ret_handler(null,dbdocs[id_str]);//return doc
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,dbusers["" + id_str]);
								}																						
																																							
							},
							save:function(col_str,doc,ret_handler){
															
								if(col_str == "docs"){								
									test.equal(col_str,"docs");
									test.deepEqual(doc.rcpts, [{push_id:"gcm-115", push_type:"gcm",ev_types:["ev_api_set","ev_api_create"]},{push_id:"gcm-117", push_type:"gcm"}]);
																	
									//save doc to db...returns with _id:12345
									setTimeout(function(){//100ms delay saving document
										
										ret_handler(null,doc);
									},100);	
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");
									test.deepEqual(doc.wids,["50187f71556efcbb25000001"])																												
									ret_handler(null);
								}
							}
						 },
				 "./api" : api,
				 "./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{join:1}}}}		  
		}
	});
	sb.init();
	sb.add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"timers")	
	  .add_constraint_post("join","is_joinable",sb.constraints.is_joinable)	
	  .add_constraint_post("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("join","param_uid",sb.constraints.is_required("uid"));
		
	
	var params = {uid:620793115, wid:"50187f71556efcbb25000001", ev_types:["ev_api_set","ev_api_create"]};//uid not in rcpts
	async.series(
		[function(next){
						
			sb.execute("join", params, function(err,ctx){
								
				test.ok(flag);				
				test.equal(err,null);					
				test.equal(ctx.retval, 1);
					
				next();		
				
			});
			
		},function(next){
			params = {uid:620793117, wid:"50187f71556efcbb25000001"};//uid in rcpts
						
			sb.execute("join", params, function(err,ctx){
								
				test.ok(flag);	
				test.equal(err,null);		
				test.equal(ctx.retval,1);
				
				test.expect(16);
				test.done();
				next();
				
			});
			
		}]);				
		
}



exports["api.remote.join: valid params, no rcpts, explicit catalog"] = function(test){
	
	var dbdocs = {};//documents at db
		dbdocs["50187f71556efcbb25000001"] = {_id:"50187f71556efcbb25000001", uid:620793115, a:1, b:"test1234", catalog:"docs"};
				
	var flag = 1;	
	var sb = sandbox.require("../lib/sandbox",{
		requires:{"./db":{
							select: function(col_str, id_str, ret_handler){
								
								if( col_str == "docs"){																						
									
									test.equal(col_str,"docs");
									test.equal(id_str,"50187f71556efcbb25000001");
									ret_handler(null,dbdocs[id_str]);//return doc
								}else if(col_str == "users"){
									
									test.equal(col_str,"users");									
									ret_handler(null,{_id:620793114, name:"enric",wids:["50187f71556efcbb25000001"]});
								}																						
																																					
							},
							save:function(col_str,doc,ret_handler){
															
								//Not executed because constraint joinable is not satisfied.
								flag = 0;								
								ret_handler();	
							}
						 },
					"./server":{config:{app:{status:1},db:{default_catalog:"docs", system_catalogs:["timers","events"]}},api:{config:{procedures:{join:1}}}}		  
		}
	});
	sb.init();
	sb.add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"timers")
	  .add_constraint_post("join","not_catalog",sb.constraints.not_catalog,"events")
	  .add_constraint_post("join","is_joinable",sb.constraints.is_joinable)	
	  .add_constraint_post("join","param_wid",sb.constraints.is_required("wid"))
	  .add_constraint_post("join","param_uid",sb.constraints.is_required("uid"));
		
	
	var params = {uid:620793118, wid:"50187f71556efcbb25000001"};//uid not in rcpts
	
				
	sb.execute("join", params, function(err,result){
											
		test.ok(flag);
		test.deepEqual(err,{code:-7, message:"No access permission: not joinable/unjoinable"});		
		
		test.expect(5);
		test.done();	
		
	});
					
}
