var sandbox = require("sandboxed-module");
var time = require("../lib/time");

exports["module exported functions"] = function(test){
	
	var timers = require("../lib/timers");
	
	test.notEqual( timers.add_timer_type, undefined );
	test.notEqual( timers.start_timer, undefined );
	test.notEqual( timers.remove_timer, undefined );
	test.notEqual( timers.execute_timer, undefined );	
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

exports["timers.load:empty"] = function(test){
				
	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									
									test.equal(col_str,"timers");
									test.deepEqual(criteria,{});	
									ret_handler(null,[]);								
							}
				}		
		}
	});
		
	
	timers.load();
	test.expect(2);
	test.done();
}

exports["timers.load:1 future timer"] = function(test){
	
		
	var arr_timers = [{_id:"hh879384",type_name:"dummy",etime:time.now()+3000,data:{foo:"bar"}}];
	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									
									test.equal(col_str,"timers");
									test.deepEqual(criteria,{});	
									ret_handler(null,arr_timers);								
							},
							
							removeById:function(col_str, id_str, ret_handler){
								
								test.equal(col_str,"timers");
								test.equal(id_str,"hh879384");
								test.expect(5);
								test.done();	
								ret_handler(null);
							}
				}		
		}
	});
		
	timers.add_timer_type("dummy",function(timer){
		
		test.deepEqual(timer,{foo:"bar"});
		
	});
	timers.load();
	
}

exports["timers.load:1 past timer"] = function(test){
	
		
	var arr_timers = [{_id:"hh879384",type_name:"dummy",etime:time.now()-1000,data:{foo:"bar"}}];
	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									
									test.equal(col_str,"timers");
									test.deepEqual(criteria,{});	
									ret_handler(null,arr_timers);								
							},
							
							removeById:function(col_str, id_str, ret_handler){
								
								test.equal(col_str,"timers");
								test.equal(id_str,"hh879384");
								test.expect(5);
								test.done();	
								ret_handler(null);
							}
				}		
		}
	});
		
	timers.add_timer_type("dummy",function(timer){
		
		test.deepEqual(timer,{foo:"bar"});
		
	});
	timers.load();
	
}

