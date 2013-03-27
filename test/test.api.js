var sandbox = require("sandboxed-module");
	

exports["module exported functions"] = function(test){
		
	var api = require("../lib/api");
		
	test.notEqual(api.remote,undefined);
	test.notEqual(api.remote.create,undefined);
	test.notEqual(api.remote.register,undefined);
	test.notEqual(api.remote.dispose,undefined);
	test.notEqual(api.remote.join,undefined);	
	test.notEqual(api.remote.remove,undefined);
	test.notEqual(api.remote.set,undefined);
	test.notEqual(api.remote.push,undefined);
	test.notEqual(api.remote.pop,undefined);
	test.notEqual(api.remote.shift,undefined);	
	test.notEqual(api.remote.get,undefined);
	test.notEqual(api.remote.search,undefined);
	
	test.notEqual(api.on,undefined);
	test.equal(api.rcpts, null);
	
	test.expect(14);
	test.done();
}


exports["api.emit:params, no explicit rcpts"] = function(test){
	
	var api = require("../lib/api");				
	var ctx = {params:{foo:1, bar:5}, doc:undefined, config:{}};
	
	api.on("ev_dummy", function(msg, rcpts){
		
		test.equal(msg.ev_type, "ev_dummy");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(typeof msg.ev_tstamp, "number");
		test.deepEqual(msg.ev_ctx, ctx);
		test.equal(rcpts, undefined);
		test.done();
	});
	
	api.emit("ev_dummy", ctx);
				
}


exports["api.emit:params, explicit rcpts"] = function(test){
	
	var api = require("../lib/api");			
	var ctx = {params:{foo:1, bar:5}, doc:undefined, config:{}};
	var emit_rcpts = [1,2,3];
	
	api.on("ev_foo", function(msg, rcpts){
		
		test.equal(msg.ev_type, "ev_foo");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(typeof msg.ev_tstamp, "number");
		test.deepEqual(msg.ev_ctx, ctx);
		test.deepEqual(rcpts, emit_rcpts);
		test.equal(msg.ev_tag,undefined);
		test.expect(6);
		test.done();
	});
	
	api.emit("ev_foo", ctx, emit_rcpts);
				
}

exports["api.emit:params, explicit rcpts, tag"] = function(test){
	
	var api = require("../lib/api");			
	var ctx = {params:{foo:1, bar:5}, doc:undefined};
	var emit_rcpts = [1,2,3];
	
	api.on("ev_foo2", function(msg, rcpts){
		
		test.equal(msg.ev_type, "ev_foo2");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(typeof msg.ev_tstamp, "number");
		test.deepEqual(msg.ev_ctx, ctx);
		test.deepEqual(rcpts, emit_rcpts);
		test.equal(msg.ev_tag,"tag1");
		test.expect(6);
		test.done();
	});
	
	api.emit("ev_foo2", ctx, emit_rcpts, "tag1");
				
}

exports["api.emit:params, tag"] = function(test){
	
	var api = require("../lib/api");			
	var ctx = {params:{foo:1, bar:5}, doc:undefined};	
	
	api.on("ev_foo3", function(msg, rcpts){
		
		test.equal(msg.ev_type, "ev_foo3");
		test.notEqual(msg.ev_tstamp, undefined);
		test.equal(typeof msg.ev_tstamp, "number");
		test.deepEqual(msg.ev_ctx, ctx);
		test.equal(rcpts, undefined);
		test.equal(msg.ev_tag,"tag1");
		test.expect(6);
		test.done();
	});
	
	api.emit("ev_foo3", ctx, "tag1");
				
}

