var db = require("../lib/db");

exports["module exported objects"] = function(test){
		
	test.notEqual(db.connect, undefined);
	test.notEqual(db.save, undefined);
	test.notEqual(db.select, undefined);
	test.notEqual(db.remove, undefined);
	test.done()
}


exports["module init:db.connect before any operation"] = function(test){
	
	
	test.throws(
		function(){
			db.save();
		},
		Error		
	);
	test.done();
}

//mock mongodb driver to fake connect

