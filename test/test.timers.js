
var sandbox = require("sandboxed-module");
var time = require("../lib/time");

exports["module exported functions"] = function(test){
	
	var timers = require("../lib/timers");
	
	test.notEqual( timers.add_timer_type, undefined );
	test.notEqual( timers.start_timer, undefined );
	test.notEqual( timers.pick_timer, undefined );
	test.notEqual( timers.schedule_timer, undefined );
	test.notEqual( timers.save_timer, undefined );
	test.notEqual( timers.remove_timer, undefined );
	test.notEqual( timers.execute_timer, undefined );	
	test.notEqual( timers.reload, undefined );
	test.notEqual( timers.begin, undefined );
	test.notEqual( timers.end, undefined );
	test.done();
	
}

exports["timers.start_timer: error parameters"] = function(test){
		
	var flags = [1,1];
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							removeById:function( col_str, id_str, ret_handler ){
								
								flags[0] = 0;																						
								ret_handler(null);
							},
							save:function(col_name, obj, ret_handler){
								flags[1] = 0;																
								ret_handler(null);								
							}
				}}
	});
	
	
	timers.add_timer_type("foo",function( data ){
						
	});
	
	
	timers.start_timer({type_name:"dummy",data:{test:1}},function(err){
		
		test.equal(err, "Timer parameter structure must contain: {etime, type_name}");				
		test.done();
	});			
	
}

exports["timers.start_timer: unregistered"] = function(test){
	
	//This document expires in 1 sec.
	var etime = time.now() + 500;
	var flags = [1,1];
	var timers = require("../lib/timers");
	
	
	timers.add_timer_type("foo",function( data ){
						
	});
	

	timers.start_timer( {etime:etime,type_name:"dummy",data:{test:1}},function(err){
		
		test.notEqual(err,undefined);
		test.ok(flags[0]);
		test.ok(flags[1]);
		test.expect(3);	
		test.done();
	});
					
}

exports["timers.pick_timer"] = function(test){
				
	var num = 0;	
	var now = time.now();
	var timers_arr = [{_id:"asda",etime: now + 200, type_name:"foo", data:{test:1}}, {_id:"jhjd",etime: now + 300, type_name:"foo", data:{test:2}}];
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
																	
									num++;						
									test.equal(col_str,"timers");
									test.notEqual(criteria["etime"],undefined);
									if(num == 1)	
										ret_handler(null,timers_arr);
									else
										ret_handler(null,[]);								
							},
							removeById:function(col_str, id_str, ret_handler){
																
								test.equal(col_str,"timers");
								test.equal(id_str,"jhjd");								
								ret_handler(null);
							}
				}		
		}
	});
	var flag = 0;
	timers.add_timer_type("foo",function( data ){

		test.deepEqual(data,{test:2});		
		flag = 1;		
	});	
	
	timers.reload(500);
	timers.end();
	timers.pick_timer();
	setTimeout(function(){
		
		test.ok(flag);			
		test.done();	
	},500);
				
}

exports["timers.begin:empty"] = function(test){
				
	var num = 0;	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									num++;						
									test.equal(col_str,"timers");
									test.notEqual(criteria["etime"],undefined);	
									ret_handler(null,[]);								
							}
				}		
		}
	});
		
	
	timers.begin(500);
	timers.begin();
	timers.begin();	
	setTimeout(function(){ 
		
		timers.end();		
		test.done(); 
	
	},1500);
}

exports["timers.begin:callback"] = function(test){
				
	var num = 0;	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									num++;						
									test.equal(col_str,"timers");
									test.notEqual(criteria["etime"],undefined);	
									ret_handler(null,[]);								
							}
				}		
		}
	});
		
	
	timers.begin(500,function(){
		
		timers.end();	
		test.done();
	});
			
}


exports["timers.reload:empty"] = function(test){
				
	var num = 0;	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									num++;						
									test.equal(col_str,"timers");
									test.notEqual(criteria["etime"],undefined);	
									ret_handler(null,[]);								
							}
				}		
		}
	});
		
	
	timers.reload(500);	
	setTimeout(function(){ 
		
		timers.end();		
		test.done(); 
	
	},1500);
}


exports["timers.reload:2 future timers"] = function(test){
				
	var num = 0;	
	var now = time.now();
	var timers_arr = [{etime: now + 2000, type_name:"foo", data:{test:1}}, {etime: now + 3000, type_name:"foo", data:{test:2}}];
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									num++;						
									test.equal(col_str,"timers");
									test.notEqual(criteria["etime"],undefined);
									if(num == 1)	
										ret_handler(null,timers_arr);
									else
										ret_handler(null,[]);								
							}
				}		
		}
	});
	var flag = 1;
	timers.add_timer_type("foo",function( data ){
				
		flag = 0;		
	});	
	
	timers.reload(500);	
	setTimeout(function(){ 
		
		timers.end();
		test.ok(flag);
		test.deepEqual(timers.get_timers(),[{etime:now + 3000, type_name:"foo", data:{test:2}}])				
		test.done(); 
	
	},1500);
}

exports["timers.reload:1 past timers"] = function(test){
				
	var num = 0;	
	var now = time.now();
	var timers_arr = [{_id:"hh879384", etime: now -1000, type_name:"foo", data:{test:1}}];
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									num++;						
									test.equal(col_str,"timers");
									test.notEqual(criteria["etime"],undefined);
									if(num == 1)	
										ret_handler(null,timers_arr);
									else
										ret_handler(null,[]);								
							},
							removeById:function(col_str, id_str, ret_handler){
								
								test.equal(col_str,"timers");
								test.equal(id_str,"hh879384");								
								ret_handler(null);
							}
				}		
		}
	});
	
	timers.add_timer_type("foo",function( data ){
				
		test.deepEqual(data,{test:1});		
	});	
	
	timers.reload(500);	
	setTimeout(function(){ 
		
		timers.end();
		
		test.deepEqual(timers.get_timers(),[]);				
		test.done(); 
	
	},1500);
}

exports["timers.schedule_timers: inside reload window"] = function(test){
				
	var num = 0;	
	var now = time.now();
	var timers_arr = [{_id:"udhfs",etime: now + 200, type_name:"foo", data:{test:1}},{_id:"ufufs",etime: now + 400, type_name:"foo", data:{test:2}}, {_id:"jf8a",etime: now + 800, type_name:"foo", data:{test:4}}];
	var newTimer = {etime: now + 600, type_name:"foo", data:{test:3}}
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
								num++;						
								test.equal(col_str,"timers");
								test.notEqual(criteria["etime"],undefined);
								if(num == 1)	
									ret_handler(null,timers_arr);
								else
									ret_handler(null,[]);								
							},
							save:function(col_name, obj, ret_handler){
																
								test.equal(col_name,"timers");																																	
								obj._id="hjdd";
								var timers_arr = timers.get_timers();								
								test.deepEqual(timers_arr,[{_id:"ufufs",etime: now + 400, type_name:"foo", data:{test:2}},{_id:"hjdd",etime: now + 600, type_name:"foo", data:{test:3}}, {_id:"jf8a",etime: now + 800, type_name:"foo", data:{test:4}}]);								
								ret_handler(null);
							},
							removeById:function( col_str, id_str, ret_handler ){
								
								test.equal(col_str,"timers");
								
							}
				}		
		}
	});
	
	timers.add_timer_type("foo",function( data ){
				
		test.notEqual(data, undefined);
	});	
	
	timers.reload(1000);		
	timers.schedule_timer(newTimer);	
		
	setTimeout(function(){ 
		
		timers.end();		
		test.deepEqual(timers.get_timers(),[]);				
		test.done(); 
	
	},1000);
}

exports["timers.schedule_timers: outside reload window"] = function(test){
				
	var num = 0;	
	var now = time.now();
	var timers_arr = [{_id:"udhfs",etime: now + 200, type_name:"foo", data:{test:1}},{_id:"ufufs",etime: now + 400, type_name:"foo", data:{test:2}}, {_id:"jf8a",etime: now + 800, type_name:"foo", data:{test:4}}];
	var newTimer = {etime: now + 1500, type_name:"foo", data:{test:3}}
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
								num++;						
								test.equal(col_str,"timers");
								test.notEqual(criteria["etime"],undefined);
								if(num == 1)	
									ret_handler(null,timers_arr);
								else
									ret_handler(null,[]);								
							},
							save:function(col_name, obj, ret_handler){
																
								test.equal(col_name,"timers");																																	
								obj._id="hjdd";
								var timers_arr = timers.get_timers();								
								test.deepEqual(timers_arr,[{_id:"ufufs",etime: now + 400, type_name:"foo", data:{test:2}}, {_id:"jf8a",etime: now + 800, type_name:"foo", data:{test:4}}]);								
								ret_handler(null);
							},
							removeById:function( col_str, id_str, ret_handler ){
								
								test.equal(col_str,"timers");
								
							}
				}		
		}
	});
	
	timers.add_timer_type("foo",function( data ){
				
		test.notEqual(data, undefined);	
	});	
	
	timers.reload(1000);		
	timers.schedule_timer(newTimer);	
		
	setTimeout(function(){ 
		
		timers.end();		
		test.deepEqual(timers.get_timers(),[]);				
		test.done(); 
	
	},1900);
}




/*
exports["timers.schedule_timer"] = function(test){
	var etime = time.now() + 500;		
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							removeById:function( col_str, id_str, ret_handler ){
																
								test.equal(col_str,"timers");
								test.equal(id_str,"505c3cc67c0877830b000034");
								test.expect(7);
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
	
	
	timers.start_timer( {etime:etime,type_name:"dummy",data:{test:1}},function(err){
		test.ok(1)
	});
	
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
								test.expect(6);
								test.done();	
								ret_handler(null);
							}
				}		
		}
	});
		
	timers.add_timer_type("dummy",function(timer){
		
		test.deepEqual(timer,{foo:"bar"});
		
	});
	timers.load(function(err){
		
		test.equal(err,undefined);
	});
	
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

exports["timers.save_timer: error parameters"] = function(test){
		
	var flag = 1;
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							
							save:function(col_name, obj, ret_handler){
								
								flag = 0;																
								ret_handler(null);								
							}
		}}
	});
	
	
	timers.add_timer_type("foo",function( data ){
						
	});
	
	var timer = {etime:time.now(), type_name:"bar",data:{test:1}};
	timers.save_timer(timer,function(err){
		
		test.ok(flag);		
		test.equal(err,"Timer type not registered");
		test.notEqual(err, undefined);		
		test.expect(3);
		test.done();
	});			
	
}

exports["timers.save_timer: success"] = function(test){
	
	var etime = time.now();	
	var timers = sandbox.require("../lib/timers",{
		requires:{"./db":{
							
							save:function(col_name, obj, ret_handler){
								
								test.equal(col_name,"timers");
								test.deepEqual(obj,{etime:etime,type_name:"foo",data:{test:1}});																
								ret_handler(null);								
							}
		}}
	});
	
	
	timers.add_timer_type("foo",function( data ){
						
	});
	
	var timer = {etime:etime, type_name:"foo", data:{test:1}};
	timers.save_timer( timer, function(err){
					
		test.equal(err, undefined);		
		test.expect(3);
		test.done();
	});			
	
}
*/
