var sandbox = require("sandboxed-module");
	

exports["module exported objects"] = function(test){
		
	var api = require("../lib/api");
		
	test.notEqual(api.remote,undefined);
	test.notEqual(api.remote.create,undefined);
	test.notEqual(api.remote.join,undefined);
	test.notEqual(api.remote.add,undefined);
	test.notEqual(api.remote.remove,undefined);
	test.notEqual(api.remote.set,undefined);
	test.notEqual(api.remote.incr,undefined);
	test.notEqual(api.remote.decr,undefined);
	test.notEqual(api.remote.push,undefined);
	test.notEqual(api.remote.pop,undefined);
	test.notEqual(api.remote.pull,undefined);
	
	test.notEqual(api.on,undefined);
	test.equal(api.rcpts, null);
	test.done();
}

exports["api.remote.create: invalid params"] = function(test){
		
	var api = require("../lib/api");
		
	//uid missing
	var params = {miss_uid:620793114, doc:{test:"test doc"}};
	api.remote.create(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//doc missing
	params = {uid:620793114, miss_doc:{test:"test doc"}};
	api.remote.create(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
		test.expect(4);
		test.done();
	}); 		
	
}

exports["api.remote.create: valid params, non init.rcpts, default catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}};	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								//beacause init.rcpts is null the initial rcpts list is [uid]
								test.deepEqual( doc.rcpts, [params.uid]);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345, test:"test"});	
							}
		}}
	});
			
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});
		test.expect(6);
		test.done();			
	});
		
}


exports["api.remote.create: valid params, non init.rcpts, explicit catalog"] = function(test){
	

	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str, "dummy");								
								test.deepEqual( doc.test, params.doc.test )
								test.equal( doc.uid, params.uid );
								test.equal( doc.rcpts, undefined);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345, test:"test"});	
							}
		}}
	});
					
	
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});
		test.expect(6);	
		test.done();		
	});
				
}

exports["api.remote.create: valid params, non init.rcpts, explicit&added catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"};	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.deepEqual( doc.rcpts, [params.uid]);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345});	
							}
		}}
	});
	
		
	api.init.addcreatehandler(function(params){
		
		return params.catalog == "dummy";
	});
			
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});
		test.expect(6);
		test.done();		
	});
		
	
}



exports["api.remote.create: valid params, init.rcpts sync, docs catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"docs"},
	    ircpts = [620793115];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.deepEqual( doc.rcpts, [params.uid].concat(ircpts));
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345});	
							}
		}}
	});
	
	
	api.rcpts = function(doc,db,ret_handler){
		
		test.notEqual(doc,undefined);
		test.notEqual(db,undefined);
		ret_handler(ircpts);
	};
	
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});
		test.expect(8);
		test.done();		
	});
	
}


exports["api.remote.create: valid params, init.rcpts sync, added wrong catalog"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"},
	    ircpts = [620793115];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.equal( doc.rcpts, undefined);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345});	
							}
		}}
	});
	
	var flag = 1;
	api.rcpts = function(doc,db,ret_handler){
		
		flag = 0;	
		ret_handler(ircpts);
	};
	api.init.addcreatehandler(function(params){ 
			return params.catalog == "dummy-wrong"; 
	});
		
	
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});	
		test.ok(flag);
		test.expect(7);
		test.done();
			
	});
			
}


exports["api.remote.create: valid params, init.rcpts async, added catalog, ev_create triggered"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}, catalog:"dummy"},
	    ircpts = [620793115];
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for create procedure
							save:function(col_str,doc,ret_handler){
																
								test.equal(col_str,"dummy");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.deepEqual( doc.rcpts, [620793114, 620793115]);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345});	
							}
		}}
	});
	
	
	api.rcpts = function(doc,db,ret_handler){
			
			test.notEqual(doc,undefined);
			test.notEqual(db,undefined);
			setTimeout(function(){ret_handler(ircpts)},500);
			
	};
	
	api.init.addcreatehandler(function(params){
		
		return params.catalog == "dummy";
	});
	
	var flag = 0;
	api.on("ev_create", function(msg){
		
		test.equal(msg.ev_type,"ev_create");
		test.notEqual(msg.ev_tstamp,undefined);
		test.notEqual(msg.ev_data,undefined);
		flag = 1;
		
	});
	
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});		
		test.ok(flag);
		test.expect(12);
		test.done();
	});
		
}


exports["api.remote.join: invalid params"] = function(test){
	
	var api = require("../lib/api");
	
	//both missing
	var params = {miss_wid:"12345", miss_uid:620793114};
	
	api.remote.join(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//wid missing
	params = {miss_wid:"12345", uid:620793114};
	api.remote.join(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114};
	api.remote.join(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	test.done();
	
}


exports["api.remote.join: valid params, uid not in rcpts, default catalog, db async"] = function(test){
	
	var params = {wid:"1234", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["1234"] = {_id:"1234",a:1,b:"test1234", rcpts:[620793115]},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115]};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								
								setTimeout(function(){//200ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},200);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");
								test.deepEqual(doc.rcpts, [620793115, 620793114]);
																
								//save doc to db...returns with _id:12345
								setTimeout(function(){//100ms delay saving document
									
									ret_handler(null,doc);
								},100);	
							}
		}}
	});
	
	api.remote.join(params, function(err,val){//endpoint.js interface
		
		test.equal(err,null);
		test.notEqual(val.doc, undefined);
		test.equal(val.doc.rcpts, undefined);
		test.equal(val.doc._id, undefined);		
		test.equal(val.doc.wid, "1234");
		test.equal(val.doc.a,1);
		test.equal(val.doc.b,"test1234");		
		test.expect(11);
		test.done();
		
	});
		
}


exports["api.remote.join: valid params, uid in rcpts, default catalog"] = function(test){
	
	var params = {wid:"1234", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["1234"] = {_id:"1234",a:1,b:"test1234", rcpts:[620793115, 620793114]},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115]};
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0; //should not reach this because uid in rcpts																					
									
							}
		}}
	});
	
	api.remote.join(params, function(err,val){
		
		test.ok(flag);
		test.equal(err,null);				
		test.equal(val.reach, 2);
		test.expect(5);
		test.done();
		
	});
		
}


exports["api.remote.join: valid params, uid in rcpts, explicit catalog"] = function(test){
	
	var params = {wid:"1234", uid:620793114, catalog:"dummy"};
	var dbdocs = {};//documents at db
		dbdocs["1234"] = {_id:"1234",a:1,b:"test1234", rcpts:[620793115, 620793114]},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115]};
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
																
								flag = 0;	//should not reach this because uid in rcpts.
							}
		}}
	});
	
	api.remote.join(params, function(err,val){
		
		test.ok(flag);
		test.equal(err,null);			
		test.equal(val.reach, 2);
		test.expect(5);
		test.done();
		
	});
	
	
}

exports["api.remote.join: valid params, uid not in rcpts, default catalog, wid not found"] = function(test){
	
	var params = {wid:"789", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["123"] = {_id:"1234",a:1,b:"test1234", rcpts:[620793115]},
		dbdocs["456"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115]};
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0; //should not be reached because doc not found.
							}
		}}
	});
	
	api.remote.join(params, function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:789" });		
		test.ok(flag);
				
		test.expect(6);
		test.done();
		
	});
		
}

exports["api.remote.unjoin: invalid params"] = function(test){
	
	var api = require("../lib/api");	
	
	//wid missing
	var params = {miss_wid:"12345", uid:620793114};
	api.remote.unjoin(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114};
	api.remote.unjoin(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	test.done();
	
}


exports["api.remote.unjoin: valid params, uid in rcpts, explicit catalog, db async"] = function(test){
	
	var params = {wid:"1234", uid:620793114, catalog:"dummy"};
	var dbdocs = {};//documents at db
		dbdocs["1234"] = {_id:"1234", a:1, b:"test1234", rcpts:[620793115,620793116,620793114]},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115]};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);																									
								
								setTimeout(function(){//100ms delay retrieving document
								
									ret_handler(null,dbdocs[id_str]);
								},100);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								test.deepEqual(doc.rcpts, [620793115, 620793116]);
																
								//save doc to db...returns with _id:1234
								setTimeout(function(){//50ms timeout saving document								
									
									ret_handler(null,doc);
								},50);	
							}
		}}
	});
	
	api.remote.unjoin(params, function(err,val){//endpoint.js interface
		
		test.equal(err,null);
		test.equal(val,0);
			
		test.expect(6);
		test.done();
		
	});
		
}


exports["api.remote.unjoin: valid params, uid not in rcpts, explicit catalog"] = function(test){
	
	var params = {wid:"1234", uid:620793118, catalog:"dummy"};
	var dbdocs = {};//documents at db
		dbdocs["1234"] = {_id:"1234", a:1, b:"test1234", rcpts:[620793115,620793116,620793114]},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115]};
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);																									
								ret_handler(null,dbdocs[id_str]);
								
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;
									
							}
		}}
	});
	
	api.remote.unjoin(params, function(err,val){
		
		test.notEqual(err,undefined);
		test.equal(val,null);
		test.deepEqual(err,{code:-9, message:"uid 620793118 not found: @dummy:1234.rcpts"});
		test.ok(flag);	
		test.expect(6);
		test.done();
		
	});
		
}



exports["api.remote.unjoin: valid params, not rcpts, default catalog"] = function(test){
	
	var params = {wid:"1234", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["1234"] = {_id:"1234", a:1, b:"test1234"},
		dbdocs["5678"] = {_id:"5678", a:2, b:"test5678", rcpts:[620793115]};
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);																									
								ret_handler(null,dbdocs[id_str]);
								
								
							},
							save:function(col_str,doc,ret_handler){
																																																															
								flag = 0;//shoudnt get here because this doc has no rcpts
							}
		}}
	});
	
	api.remote.unjoin(params, function(err,val){//endpoint.js interface
		
		test.notEqual(err,null);
		test.deepEqual(err,{code:-8,message:"Document @docs:1234 has no rcpts"});
		test.equal(val,null);
		test.ok(flag);
			
		test.expect(6);
		test.done();
		
	});
		
}


exports["api.remote.unjoin: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114};
	var dbdocs = {};//documents at db.			
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.unjoin(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
}


exports["api.remote.add: invalid params"] = function(test){
	
	var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b", value:[]};
	
	api.remote.add(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b", value:[]};
	api.remote.add(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b", value:[]};
	api.remote.add(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//value missing
	params = {wid:"12345", uid:620793114, fname:"b", miss_value:[]};
	api.remote.add(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	
	test.done();
	
}

exports["api.remote.add: valid params, non existing field, explicit catalog, db async"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b", value:[], catalog:"dummy"}; //initialize field 'b' to an empty array.
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								setTimeout(function(){ //db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field params.fname added with default value params.value
								test.notEqual(doc[params.fname], undefined);
								test.deepEqual( doc[params.fname], params.value );
								
								setTimeout(function(){ //db 500ms delay saving document																
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.add(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
}


exports["api.remote.add: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114, fname:"b", value:[]}; //initialize field 'b' to an empty array.
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.add(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.add: valid params, existing field"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b", value:[]};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["1234"] = {_id:"1234", a:1, b:2, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.add(params,function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' already exists @docs:1234"});
		test.ok(flag);
		test.expect(8);
		test.done();
		
	});
				
}

exports["api.remote.remove: invalid params"] = function(test){
	
	var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b"};
	
	api.remote.remove(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.remove(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.remove(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	test.done();
}


exports["api.remote.remove: valid params, existing field, explicit catalog, db async"] = function(test){
	
var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["1234"] = {_id:"1234",a:1, b:2, rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for remove procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								
								setTimeout(function(){ //db 500ms delay retrieving document
								
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");
								
								//field fname removed
								test.equal(doc[params.fname], undefined);								
								
								setTimeout(function(){//db 500ms delay saving document
																									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(8);
		test.done();
		
	});
		
		
}

exports["api.remote.remove: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114, fname:"b"}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.remove: valid params, nonexisting field"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234", a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for remove procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @1234"})
		test.ok(flag);
		test.expect(7);
		test.done();
	});
				
		
}


exports["api.remote.set: invalid params"] = function(test){
	
	var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b", value:3};
	
	api.remote.set(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b", value:3};
	api.remote.set(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b", value:3};
	api.remote.set(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	
	//value missing
	params = {wid:"12345", uid:620793114, fname:"b", miss_value:3};
	api.remote.set(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	test.done();
}



exports["api.remote.set: valid params, existing field, explicit catalog, db async"] = function(test){
	
var params = {wid:"1234", uid:620793114, fname:"b", value:3, catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["1234"] = {_id:"1234",a:1, b:2, rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for set procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.equal(dbdocs[id_str][params.fname], 2); //b:2
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname set
								test.equal(doc[params.fname], params.value);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		
	});
	
	test.done();	
		
}


exports["api.remote.set: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.set: valid params, non existing field"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b", value:3};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234", a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for set procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field
							}
		}}
	});
	
	api.remote.set(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @1234"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
				
}


exports["api.remote.incr: invalid params"] = function(test){
	
	var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b" };
	
	api.remote.incr(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.incr(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.incr(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
		
	});	
	
	test.done();
}


exports["api.remote.incr: valid params, existing field, explicit catalog, db async"] = function(test){
	
var params = {wid:"1234", uid:620793114, fname:"b", catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["1234"] = {_id:"1234",a:1, b:2, rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for incr procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.equal(dbdocs[id_str][params.fname], 2); //b:2
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to increment
								test.equal(doc[params.fname], 3);								
								
								setTimeout(function(){//db 500ms delay saving document
																									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.incr(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
	
}

exports["api.remote.incr: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.incr(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.incr: valid params, non existing field"] = function(test){

	var params = {wid:"1234", uid:620793114, fname:"b", value:3};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234", a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for incr procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field
							}
		}}
	});
	
	api.remote.incr(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @1234"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
						
	
}

exports["api.remote.decr: invalid params"] = function(test){
	
	var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b" };
	
	api.remote.decr(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.decr(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.decr(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	
	test.done();	
	
	
}

exports["api.remote.decr: valid params, existing field, explicit catalog, db async"] = function(test){

var params = {wid:"1234", uid:620793114, fname:"b", catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["1234"] = {_id:"1234",a:1, b:2, rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for decr procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.equal(dbdocs[id_str][params.fname], 2); //b:2
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to decrement
								test.equal(doc[params.fname], 1);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.decr(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
	
}

exports["api.remote.decr: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.decr(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.decr: valid params, non existing field"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234", a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for decr procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field
							}
		}}
	});
	
	api.remote.decr(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @1234"});
		test.ok(flag)
		test.expect(7);
		test.done();
		
	});
				

}


exports["api.remote.push: invalid params"] = function(test){
	
var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b", value:5 };
	
	api.remote.push(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b", value:5};
	api.remote.push(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b", value:5};
	api.remote.push(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	
	//value missing
	params = {wid:"12345", uid:620793114, fname:"b", miss_value:5};
	api.remote.push(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
	
	test.done();	
	
}

exports["api.remote.push: valid params, existing field as array, explicit catalog, db async"] = function(test){
	

	var params = {wid:"1234", uid:620793114, fname:"b", value:5, catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["1234"] = {_id:"1234",a:1, b:[1,2,3,4], rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.deepEqual(dbdocs[id_str][params.fname], [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to decrement
								test.deepEqual(doc[params.fname], [1,2,3,4,5]);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
	
}


exports["api.remote.push: valid params, existing field as nonarray"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b", value:5};
	var dbdocs = {};
		
		//document WITH b non-array field.
		dbdocs["1234"] = {_id:"1234",a:1, b:"this is not an array", rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.notEqual(typeof dbdocs[id_str][params.fname], "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'b' not an array"});
		test.expect(7);
		test.done();
		
	});
	
	
}

exports["api.remote.push: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:[1], rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.push: valid params, non existing field"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b", value:5};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234", a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field.
							}
		}}
	});
	
	api.remote.push(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @1234"});
		test.ok(flag);
		test.expect(7);
		test.done();
	});			
		
}


exports["api.remote.pop: invalid params"] = function(test){
	
var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b"};
	
	api.remote.pop(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.pop(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.pop(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
		
	
	test.done();	
	
	
}

exports["api.remote.pop: valid params, existing field as array, explicit catalog, db async"] = function(test){
	

	var params = {wid:"1234", uid:620793114, fname:"b", catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["1234"] = {_id:"1234",a:1, b:[1,2,3,4], rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.deepEqual(dbdocs[id_str][params.fname], [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to pop
								test.deepEqual(doc[params.fname], [1,2,3]);								
																								
								setTimeout(function(){//db 500ms saving document
									
									ret_handler(null,doc);
								},500);
									
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
	
}

exports["api.remote.pop: valid params, existing field as nonarray"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITH b non-array field.
		dbdocs["1234"] = {_id:"1234",a:1, b:"this is not an array", rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.notEqual(typeof dbdocs[id_str][params.fname], "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because field not array
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'b' not an array"});
		test.ok(flag);
		test.expect(8);
		test.done();
		
	});
		
		
}


exports["api.remote.pop: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:[1], rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.pop: valid params, non existing field"] = function(test){
	

	var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234", a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.pop(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @1234"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
			
	
}

exports["api.remote.pull: invalid params"] = function(test){
	
var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b"};
	
	api.remote.pull(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.pull(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.pull(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});	
		
	
	test.done();
	
}


exports["api.remote.pull: valid params, existing field as array, explicit catalog, db async"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b", catalog:"dummy"};
	var dbdocs = {};
		
		//document WITH b array field.
		dbdocs["1234"] = {_id:"1234",a:1, b:[1,2,3,4], rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pop procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "dummy");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.deepEqual(dbdocs[id_str][params.fname], [1,2,3,4]); //b:[1,2,3,4]
								
								setTimeout(function(){//db 500ms delay retrieving document
									
									ret_handler(null,dbdocs[id_str]);
								},500);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"dummy");
								
								//field fname to pull
								test.deepEqual(doc[params.fname], [2,3,4]);								
																								
								setTimeout(function(){//db 500ms delay saving document
									
									ret_handler(null,doc);
								},500);	
							}
		}}
	});
	
	api.remote.pull(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		test.expect(9);
		test.done();
		
	});
		
	
}

exports["api.remote.pull: valid params, existing field as nonarray"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITH b non-array field.
		dbdocs["1234"] = {_id:"1234",a:1, b:"this is not an array", rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pull procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								test.notEqual(typeof dbdocs[id_str][params.fname], "object"); //b:"this is not an array"
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.pull(params,function(err,val){
		
		test.equal(val,null);
		test.deepEqual(err,{code:-4, message:"Field 'b' not an array"});
		test.ok(flag);
		test.expect(8);
		test.done();
		
	});
		
	
}


exports["api.remote.pop: valid params, wid not found"] = function(test){
	
	var params = {wid:"5678", uid:620793114, fname:"a", value:4}; 
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:[1], rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for push procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.equal(dbdocs[id_str], undefined);																
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because wid not found.
							}
		}}
	});
	
	api.remote.pull(params,function(err,val){
		
		test.notEqual(err,null);
		test.equal(val,null);
		test.deepEqual(err,{ code: -7, message: "Document not found: @docs:5678" });
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
		
}


exports["api.remote.pull: valid params, non existing field"] = function(test){
	
var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234", a:1, rcpts:[620793115]};	
	
	var flag = 1;
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for pull procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								flag = 0;	//should not reach this because non existing field
							}
		}}
	});
	
	api.remote.pull(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field 'b' not exists @1234"});
		test.ok(flag);
		test.expect(7);
		test.done();
		
	});
				
	
}
