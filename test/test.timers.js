var sandbox = require("sandboxed-module");

exports["module exported functions"] = function(test){
	
	var timers = require("../lib/timers");
	
	test.notEqual( timers.add_timer_type, undefined );
	test.notEqual( timers.start_timer, undefined );	
	test.notEqual( timers.load, undefined );
	test.done();
	
}


exports["timers.start_timer"] = function(test){
	
	//This document expires in 1 sec.
	var etime = new Date().getTime() + 500;
	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							removeById:function( col_str, id_str, ret_handler ){
																
								test.equal(col_str,"timers");
								test.equal(id_str,"505c3cc67c0877830b000034");
								test.expect(6);
								test.done();
								ret_handler();
							},
							save:function(col_name, obj, ret_handler){
																
								test.equal(col_name,"timers");
								test.deepEqual(obj,{etime:etime,type_name:"dummy",data:{test:1}});
								obj._id = "505c3cc67c0877830b000034"
								ret_handler(null,obj);								
							}
		}}
	});
	
	timers.add_timer_type("dummy",function( data ){
				
		test.deepEqual(data, {test:1});
		test.ok(1);
	});
	
	
	timers.start_timer( {etime:etime,type_name:"dummy",data:{test:1}} );
	
}

exports["timers.load"] = function(test){
	
		
	var arr_timers = [{type_name:"dummy",etime:1379699594550,data:{catalog:"docs"}},{type_name:"dummy",etime:1379699595550,data:{catalog:"docs"}},{type_name:"dummy",etime:1379699598550,data:{catalog:"docs"}}];
	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									
									test.equal(col_str,"timers");
									test.deepEqual(criteria,{});	
									ret_handler(null,arr_timers);								
							}
				}		
		}
	});
	
	//this function will be called from load
	var ncall = 0;
	timers.start_timer = function( timer_data){
				
		test.deepEqual(timer_data,arr_timers[ncall++]);
								
	}
	
	timers.load();
	test.expect(5);
	test.done();
}
