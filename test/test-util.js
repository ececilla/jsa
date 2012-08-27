var util = require("../lib/util");

exports["util.get_field:existing field-path"] = function(test){
		
	var doc = {x:{y:{z:1}}};
	test.equal(util.get_field(doc,"x.y.z"), 1);
	test.done()
}

exports["util.get_field:existing single field"] = function(test){
		
	var doc = {x:1};
	test.equal(util.get_field(doc,"x"), 1);
	test.done();
}


exports["util.get_field:non existing field-path"] = function(test){
		
	var doc = {x:{y:{z:1}}};
	test.equal(util.get_field(doc,"x.nonexisting.z"), undefined);
	test.done()
}


exports["util.set_field:existing field-path"] = function(test){
		
	var doc = {x:{y:{z:1}}};	
	
	util.set_field(doc,"x.y.z",5);
	
	test.equal( doc.x.y.z, 5);
	test.done();
}


exports["util.set_field:existing single field"] = function(test){
		
	var doc = {x:1};	
	
	util.set_field(doc,"x",5);
	
	test.equal( doc.x, 5);
	test.done();
}


exports["util.set_field:non existing field-path"] = function(test){
		
	var doc = {x:{y:{z:1}}};	
	
	util.set_field(doc,"x.nonexisting.z",5);
	
	test.equal( doc.x.y.z,1 );	
	test.equal(doc.x.nonexisting.z,5)
	
	test.done();
}


exports["util.del_field:existing field-path"] = function(test){
		
	var doc = {x:{y:{z:1}}};	
	
	util.del_field(doc,"x.y.z");
	
	test.equal( doc.x.y.z, undefined );	
	test.deepEqual(doc,{x:{y:{}}});
	
	test.done();
}

exports["util.del_field:existing single field"] = function(test){
		
	var doc = {x:1};	
	
	util.del_field(doc,"x");
	
	test.equal(doc.x, undefined );
	test.deepEqual( doc, {} );	
	
	
	test.done();
}




exports["util.del_field:non existing field-path"] = function(test){
		
	var doc = {x:{y:{z:1}}};	
	
	util.del_field(doc,"x.nonexisting.z");
	
	test.equal( doc.x.y.z, 1 );			
	test.done();
}



