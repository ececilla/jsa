var db = require("../lib/db");

exports["module exported functions"] = function(test){
		
	test.notEqual(db.connect, undefined);
	test.notEqual(db.save, undefined);
	test.notEqual(db.select, undefined);
	test.notEqual(db.remove, undefined);
	test.notEqual(db.removeById, undefined);
	test.notEqual(db.remove_global, undefined);
	test.notEqual(db.criteria, undefined);
	test.notEqual(db.close, undefined);
	test.notEqual(db.prepare, undefined);
	test.done();
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

