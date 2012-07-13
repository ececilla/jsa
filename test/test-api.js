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
	test.equal(api.initrcpts, null);
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
	}); 
	
	
	test.done();
	
}

exports["api.remote.create: valid params, non initrcpts"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}};	    
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");								
								test.equal( doc.test, params.doc.test );
								test.equal( doc.uid, params.uid );
								test.deepEqual( doc.rcpts, [params.uid]);
								
								//save doc to db...returns with _id:12345
								ret_handler(null,{_id:12345});	
							}
		}}
	});
		
	
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});		
	});
	test.done();
}

exports["api.remote.create: valid params, initrcpts, ev_create"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}},
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
	
	
	api.initrcpts = function(doc,ret_handler){ret_handler(ircpts)};
	api.on("ev_create", function(msg){
		
		test.equal(msg.ev_type,"ev_create");
		test.notEqual(msg.ev_tstamp,undefined);
		test.notEqual(msg.ev_data,undefined);
		
	});
	
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});		
	});
	test.done();
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

exports["api.remote.join: valid params, uid not in rcpts"] = function(test){
	
	var params = {wid:"1234", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["1234"] = {_id:"1234",a:1,b:"test1234", rcpts:[620793115]},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115]};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");
								test.deepEqual(doc.rcpts, [620793115, 620793114]);
																
								//save doc to db...returns with _id:12345
								ret_handler(null,doc);	
							}
		}}
	});
	
	api.remote.join(params, function(err,val){//endpoint.js interface
		
		test.equal(err,null);
		test.notEqual(val.doc, undefined);
		test.equal(val.doc.rcpts, undefined);
		test.equal(val.doc._id, undefined);
		test.notEqual(val.doc.wid, undefined);
		test.equal(val.doc.wid, "1234");
		
	});
	
	test.done();
}


exports["api.remote.join: valid params, uid in rcpts"] = function(test){
	
	var params = {wid:"1234", uid:620793114};
	var dbdocs = {};//documents at db
		dbdocs["1234"] = {_id:"1234",a:1,b:"test1234", rcpts:[620793115, 620793114]},
		dbdocs["5678"] = {_id:"5678",a:2,b:"test5678", rcpts:[620793115]};
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for join procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");
								test.deepEqual(doc.rcpts, [620793115, 620793114]);
																
								//save doc to db...returns with _id:12345
								ret_handler(null,doc);	
							}
		}}
	});
	
	api.remote.join(params, function(err,val){
		
		test.equal(err,null);
		test.equal(val.doc, undefined);
		test.notEqual(val.reach, undefined);
		test.equal(val.reach, 2);
		
	});
	
	test.done();
}

exports["api.remote.add: invalid params"] = function(test){
	
	var api = require("../lib/api");
	
	//wid missing	
	var params = {miss_wid:"12345", uid:620793114, fname:"b"};
	
	api.remote.add(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//uid missing
	params = {wid:"12345", miss_uid:620793114, fname:"b"};
	api.remote.add(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	//fname missing
	params = {wid:"12345", uid:620793114, miss_fname:"b"};
	api.remote.add(params, function(err,val){
		
		test.equal(err.code,-2);
		test.equal(val,null);
	});
	
	test.done();
	
}

exports["api.remote.add: valid params, non existing field"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234",a:1, rcpts:[620793115]};	
	
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
								
								test.equal(col_str,"docs");
								
								//field fname added
								test.notEqual(doc[params.fname], undefined);
								test.deepEqual( doc[params.fname], {} );
																								
								ret_handler(null,doc);	
							}
		}}
	});
	
	api.remote.add(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		
	});
	
	test.done();
}

exports["api.remote.add: valid params, existing field"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITH b field.
		dbdocs["1234"] = {_id:"1234", a:1, b:2, rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.notEqual(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							}
		}}
	});
	
	api.remote.add(params,function(err,val){
		
		test.equal(val,null);
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field b already exists @1234"})
		
	});
			
	test.done();
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


exports["api.remote.remove: valid params, existing field"] = function(test){
	
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
								
								ret_handler(null,dbdocs[id_str]);
								
							},
							save:function(col_str,doc,ret_handler){
								
								test.equal(col_str,"docs");
								
								//field fname removed
								test.equal(doc[params.fname], undefined);								
																								
								ret_handler(null,doc);	
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.equal(err,null);
		test.equal(val,0);
		
	});
	
	test.done();
		
}


exports["api.remote.remove: valid params, nonexisting field"] = function(test){
	
	var params = {wid:"1234", uid:620793114, fname:"b"};
	var dbdocs = {};
		
		//document WITHOUT b field.
		dbdocs["1234"] = {_id:"1234", a:1, rcpts:[620793115]};	
	
	var api = sandbox.require("../lib/api",{
		requires:{"./db":{	//db mock module for add procedure
							select: function(col_str, id_str, ret_handler){
								
								test.equal(col_str, "docs");
								test.equal(id_str, params.wid);
								test.notEqual(dbdocs[id_str], undefined);								
								test.equal(dbdocs[id_str][params.fname], undefined);
								
								ret_handler(null,dbdocs[id_str]);
								
							}
		}}
	});
	
	api.remote.remove(params,function(err,val){
		
		test.notEqual(err,null);		
		test.deepEqual(err,{code:-3, message:"Field b not exists @1234"})
		
	});
			
	test.done();
		
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

exports["api.remote.set: valid params"] = function(test){
	
	
	
	test.done();
}
