var sm = require("sandboxed-module");
	


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
	
	//both missing
	var params = {miss_uid:620793114, miss_doc:{test:"test doc"}};
	api.remote.create(params, function(err,val){
		
		test.equal(err.code,-2);
	});
	
	//uid missing
	params = {miss_uid:620793114, doc:{test:"test doc"}};
	api.remote.create(params, function(err,val){
		
		test.equal(err.code,-2);
	});
	
	//doc missing
	params = {uid:620793114, miss_doc:{test:"test doc"}};
	api.remote.create(params, function(err,val){
		
		test.equal(err.code,-2);
	}); 
	
	
	test.done();
	
}


exports["api.remote.create: valid params, non initrcpts"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}};	    
	var api = sm.require("../lib/api",{
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



exports["api.remote.create:valid params, initrcpts"] = function(test){
	
	var params = {uid:620793114, doc:{test:"test"}},
	    ircpts = [620793115];
	var api = sm.require("../lib/api",{
		requires:{"./db":{
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
	
	api.remote.create(params, function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{wid:"12345"});		
	});
	test.done();
}
