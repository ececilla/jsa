var db = require("./db");
var time = require("./time");
var util = require("./util");
var async = require("async");

/*
 * Object to hold all timer type handlers.
 */
var timer_type_handlers = {};

/*
 * Load all timers 
 */
exports.load  = function(ret_handler){
	
	db.criteria("timers", {}, {etime:1}, function( err, arr_timers ){
		
		arr_timers.forEach(function(timer_data, index, array) {
						
	    	exports.start_timer( timer_data );	    	
		});
		
		if(ret_handler)
			ret_handler(arr_timers.length);		
	});
}


/*
 * Add a timer type.
 */
exports.add_timer_type = function( type_name, timer_type_handler ){
	
	timer_type_handlers[type_name] = timer_type_handler;
}

/*
 * Add a new timer
 */
exports.start_timer = function( timer_data ){
	
	if( typeof timer_data != "object" || (!timer_data.etime || !timer_data.type_name) ){
		
		throw new Error("timer_data not correct, must contain: {etime,type_name}");
	}		
			
	var interval = timer_data.etime - time.now();	
	
	if(interval > 0){
		
		async.series(
		[
			function(next){
				
				timer_data._id?
					next():
					db.save("timers", timer_data, function(err,val){
						
						if(err)
							throw err;
						else
							next();
					});					
			},
			function(next){
				
				setTimeout(function(){
					if(timer_type_handlers[timer_data.type_name ])
						timer_type_handlers[timer_data.type_name ]( timer_data.data );
					else
						console.log("warn: timer type '%s' not registered",timer_data.type_name);
						
					db.removeById("timers",""+timer_data._id, function(err){
																
						if(err)
							throw err;
																			
					});														
				},interval);	
					
			}
			
		]);					
	}else{		
		
		if(timer_type_handlers[timer_data.type_name ])
			timer_type_handlers[timer_data.type_name ]( timer_data.data );
		else
			console.log("warn: timer type %s not registered",timer_data.type_name);		
	}
			
}
	
	

