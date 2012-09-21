
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

exports["util.list_remote_procedures"] = function(test){
	
	var util = require("../lib/util");
	test.notEqual(util.list_remote_procedures, undefined);
	test.done();	
}

exports["util.change_console_log_printing_format"] = function(test){
	
	var util = require("../lib/util");
	test.notEqual(util.change_console_log_printing_format, undefined);
	test.done();
}


exports["util.start_expire_timer"] = function(test){
	
	//This document expires in 1 sec.
	var doc = {etime:new Date().getTime() + 1000,wid:"505c3cc67c0877830b000001"};
	
	var util = sandbox.require("../lib/util",{
		requires:{"./db":{
							remove_expired:function( col_str, id_str, ret_handler ){
								
									test.equal(col_str,"docs");
									test.equal(id_str,"505c3cc67c0877830b000001");
									ret_handler();
							}
		}}
	});
	
	util.start_expire_timer("docs", doc, function(){
		
		test.expect(2);
		test.done();
	})
	
}



