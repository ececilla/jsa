var db = require("./db");


/*
 * Store event into event catalog.
 */
exports.save  = function(ev_msg, ret_handler){
		
	
	db.save("events", ev_msg,function(err){
						
		delete ev_msg._id;
		ret_handler(err);		
	});				
		
}

