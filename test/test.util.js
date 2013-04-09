
var sandbox = require("sandboxed-module");

exports["util.http_post"] = function(test){
	
	var callbacks = {};
	var util = sandbox.require("../lib/util",{
		requires:{"http":{
							request:function( post_options,  ret_handler ){
								
								test.deepEqual(post_options,{
				
									host:"android.googleapis.com",
									port:"80",
									path:"/gcm/send",
									method:"POST"				
								});								
								ret_handler({//http_res
									
									setEncoding: function( encoding ){
										
										test.equal(encoding,"utf8");
									},
									on:function(ev_type, fn){
										
										test.ok( ev_type === "end" || ev_type === "data");										
										callbacks[ev_type] = fn;						
									}
									
								});
								
								return  { //http_req
									write:function(post_body){
										
										test.equal(post_body,"a=1");
										setTimeout(function(){
											
											callbacks["data"]("this is a message");
										},100);
										setTimeout(function(){
											
											callbacks["end"]();
										},500);
									},
									end: function(){
										
										test.ok(true);
									}
								};
								
								
								
							}
		}}
	});
	
	var post_options = {
				
		host:"android.googleapis.com",
		port:"80",
		path:"/gcm/send",
		method:"POST"				
	};	
	
	util.http_post(post_options,"a=1",function(data){
		
		test.equal(data,"this is a message");
		test.expect(7);										
		test.done();
	});
	
}

exports["util.tokenize"] = function(test){
	
	var util = require("../lib/util");
	var str = ["this is a test1,test2;test3,test4 test5.test6 test7"];
	var tokens = util.tokenize(str);
	test.deepEqual(tokens,["this","is","a","test1","test2","test3","test4","test5","test6","test7"]);
	test.deepEqual(util.tokenize("foo;bar dummy"),["foo","bar","dummy"]);
	test.done();
	
}

exports["util.has_joined: true"] = function(test){
	
	var util = require("../lib/util");
	var rcpts_arr = [{push_id:"123", push_type:"web"},{push_id:"456",push_type:"gcm"},{push_id:"789",push_type:"gcm"}];
	test.ok(util.has_joined(rcpts_arr,"123"));
	test.done();
	
}

exports["util.has_joined: false"] = function(test){
	
	var util = require("../lib/util");
	var rcpts_arr = [{push_id:"123", push_type:"web"},{push_id:"456",push_type:"gcm"},{push_id:"789",push_type:"gcm"}];
	test.equal( false, util.has_joined(rcpts_arr,"124"));
	test.done();
	
}


exports["util.has_joined: undefined"] = function(test){
	
	var util = require("../lib/util");
	var rcpts_arr = [{push_id:"123", push_type:"web"},{push_id:"456",push_type:"gcm"},{push_id:"789",push_type:"gcm"}];
	test.equal( false, util.has_joined(rcpts_arr,undefined));
	test.done();
	
}


exports["util.is_array: true"] = function(test){
	
	var util = require("../lib/util");
	var obj = [1,2,3];
	test.ok( util.is_array(obj) );
	test.done();	
	
}


exports["util.is_array: false"] = function(test){
	
	var util = require("../lib/util");
	var obj = {};
	test.equal( false, util.is_array(obj) );
	obj = "";
	test.equal( false, util.is_array(obj) );
	obj = 5;
	test.equal( false, util.is_array(obj) );
	obj = function(){}
	test.equal( false, util.is_array(obj) );
	test.done();	
	
}

exports["util.get_field:existing field-path"] = function(test){
	
	var util = require("../lib/util");	
	var doc = {x:{y:{z:1}}};
	test.equal(util.get_field(doc,"x.y.z"), 1);
	test.done()
}

exports["util.get_field:existing single field"] = function(test){
	
	var util = require("../lib/util");	
	var doc = {x:1};
	test.equal(util.get_field(doc,"x"), 1);
	test.done();
}


exports["util.get_field:non existing field-path"] = function(test){
	
	var util = require("../lib/util");	
	var doc = {x:{y:{z:1}}};
	test.equal(util.get_field(doc,"x.nonexisting.z"), undefined);
	test.done()
}


exports["util.get_field:existing array index"] = function(test){
	
	var util = require("../lib/util");	
	var doc = {x:{y:{z:[1,2,3]}}};
	test.equal(util.get_field(doc,"x.y.z.2"), 3);
	test.done();
}


exports["util.get_field:non existing array index"] = function(test){
	
	var util = require("../lib/util");	
	var doc = {x:{y:{z:[1,2,3]}}};
	test.equal(util.get_field(doc,"x.y.z.10"), undefined);
	test.done();
}


exports["util.get_field:existing subarray"] = function(test){
	
	var util = require("../lib/util");	
	var doc = {x:{y:{z:[1,2,3,4,5,6,7]}}};
	test.deepEqual(util.get_field(doc,"x.y.z.2-5"), [3,4,5,6]);
	test.done();
}


exports["util.get_field:existing subarray, no second index"] = function(test){
	
	var util = require("../lib/util");	
	var doc = {x:{y:{z:[1,2,3,4,5,6,7]}}};
	test.deepEqual(util.get_field(doc,"x.y.z.1-"), [2,3,4,5,6,7]);
	test.done();
}


exports["util.set_field:existing field-path"] = function(test){
		
	var util = require("../lib/util");	
	var doc = {x:{y:{z:1}}};	
	
	util.set_field(doc,"x.y.z",5);
	
	test.equal( doc.x.y.z, 5);
	test.done();
}

exports["util.set_field:existing field-path array"] = function(test){
		
	var util = require("../lib/util");	
	var doc = {x:{y:{z:[4,5,6]}}};	
	
	util.set_field(doc,"x.y.z.3",7);
	
	test.deepEqual( doc.x.y.z, [4,5,6,7]);
	test.done();
}

exports["util.set_field:non existing field-path array"] = function(test){
		
	var util = require("../lib/util");	
	var doc = {x:{y:{z:1}}};	
	
	util.set_field(doc,"x.y.z.3",7) 
	test.equal(doc.x.y.z,1);
	test.done();
}


exports["util.set_field:existing single field"] = function(test){
		
	var util = require("../lib/util");
	var doc = {x:1};	
	
	util.set_field(doc,"x",5);
	
	test.equal( doc.x, 5);
	test.done();
}


exports["util.set_field:non existing field-path"] = function(test){
		
	var util = require("../lib/util");
	var doc = {x:{y:{z:1}}};	
	
	util.set_field(doc,"x.nonexisting.z",5);
	
	test.equal( doc.x.y.z,1 );	
	test.equal(doc.x.nonexisting.z,5)
	
	test.done();
}




exports["util.del_field:existing field-path"] = function(test){
		
	var util = require("../lib/util");
	var doc = {x:{y:{z:1}}};	
	
	util.del_field(doc,"x.y.z");
	
	test.equal( doc.x.y.z, undefined );	
	test.deepEqual(doc,{x:{y:{}}});
	
	test.done();
}

exports["util.del_field:existing field-path array"] = function(test){
		
	var util = require("../lib/util");
	var doc = {x:{y:{z:[4,5,6]}}};	
	
	util.del_field(doc,"x.y.z.1");	
	test.deepEqual( doc.x.y.z, [4,6] );		
	
	test.done();
}


exports["util.del_field:non existing field-path array"] = function(test){
		
	var util = require("../lib/util");
	var doc = {x:{y:{z:1}}};	
	
	util.del_field(doc,"x.y.z.1");					
	test.done();
}



exports["util.del_field:existing single field"] = function(test){
		
	
	var util = require("../lib/util");
	var doc = {x:1};	
	
	util.del_field(doc,"x");
	
	test.equal(doc.x, undefined );
	test.deepEqual( doc, {} );	
	
	
	test.done();
}


exports["util.del_field:non existing field-path"] = function(test){
		
	var util = require("../lib/util");
	var doc = {x:{y:{z:1}}};	
	
	util.del_field(doc,"x.nonexisting.z");
	
	test.equal( doc.x.y.z, 1 );			
	test.done();
}

exports["util.find_field:existing field"] = function(test){
		
	var util = require("../lib/util");
	var doc = {x:{y:{z:1}},z:4};	
	
	util.find_field(doc,"z",function(obj,fname){
		
		obj[fname] = {dummy:obj[fname]};
	});
	
	test.deepEqual( doc, {x:{y:{z:{dummy:1}}},z:{dummy:4}} );			
	test.done();
}

exports["util.find_field:non existing field"] = function(test){
		
	var util = require("../lib/util");
	var doc = {x:{y:{z:1}},z:4};	
	
	util.find_field(doc,"s",function(obj,fname){
		
		obj[fname] = {dummy:obj[fname]};
	});
	
	test.deepEqual( doc, {x:{y:{z:1}},z:4} );			
	test.done();
}

exports["util.uptime_hm"] = function(test){
	
	var util = require("../lib/util");
		
	test.equal(util.uptime_hm(120),"0 h, 2 m");
	test.equal(util.uptime_hm(1500),"0 h, 25 m");
	test.equal(util.uptime_hm(3600),"1 h, 0 m");
	test.equal(util.uptime_hm(3601),"1 h, 0 m");
	test.equal(util.uptime_hm(3660),"1 h, 1 m");
	
	test.done();
	
}





