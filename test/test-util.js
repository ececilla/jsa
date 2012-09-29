
var sandbox = require("sandboxed-module");

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


exports["util.set_field:existing field-path"] = function(test){
		
	var util = require("../lib/util");	
	var doc = {x:{y:{z:1}}};	
	
	util.set_field(doc,"x.y.z",5);
	
	test.equal( doc.x.y.z, 5);
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



exports["util.add_console_log_printing_format"] = function(test){
	
	var util = require("../lib/util");
	test.notEqual(util.add_console_log_printing_format, undefined);
	test.done();
}


exports["util.start_expire_timer"] = function(test){
	
	//This document expires in 1 sec.
	var doc = {etime:new Date().getTime() + 1000, wid:"505c3cc67c0877830b000001"};
	
	var util = sandbox.require("../lib/util",{
		requires:{"./db":{
							remove_expired:function( col_str, id_str, ret_handler ){
								
									test.equal(col_str,"docs");
									test.equal(id_str,"505c3cc67c0877830b000001");
									ret_handler();
							}
		}}
	});
	
	util.start_expire_timer({catalog:"docs",etime:doc.etime,wid:doc.wid}, function(){
		
		test.expect(2);
		test.done();
	})
	
}

exports["util.load_expire_timers"] = function(test){
	
	//This document expires in 1 sec.
	var arr_timers = [{wid:666,etime:1379699594550,catalog:"docs"},{wid:777,etime:1379699595550,catalog:"docs"},{wid:111,etime:1379699598550,catalog:"docs"}];
	
	var util = sandbox.require("../lib/util",{
		requires:{"./db":{
							criteria:function( col_str, criteria, order_field, ret_handler ){
								
									
									test.equal(col_str,"timers");
									test.deepEqual(criteria,{});	
									ret_handler(null,arr_timers);								
							}
				}		
		}
	});
	
	//this function will be called from load_expire_timers
	var ncall = 0;
	util.start_expire_timer = function( timer, ret_handler){
				
		test.deepEqual(timer,arr_timers[ncall++]);
		
						
	}
	
	util.load_expire_timers();
	test.expect(5);
	test.done();
}



