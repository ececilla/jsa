var db = require("./db");
var time = require("./time");
var util = require("./util");

var async = require("async");
var _ = require("underscore");
/*
 * Object to hold all timer type handlers.
 */
var timer_type_handlers = {};

/*
 * Load all timers 
 */
exports.load  = function(ret_handler){
	
	db.criteria("timers", {}, {etime:1}, function( err, arr_timers ){
		
		_.each(arr_timers,function(timer_data){
			
			start_timer(timer_data);
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
var start_timer = exports.start_timer = function( timer ){
	
	if( typeof timer != "object" || (!timer.etime || !timer.type_name) ){
		
		throw new Error("timer not correct, must contain: {etime,type_name}");
	}		
			
	var interval = timer.etime - time.now();//time interval to execute the timer.	
	
	if(interval > 0){
		
		async.series(
		[
			function(next){//save timer data into db
				
				timer._id?
					next():
					db.save("timers", timer, function(err){
						
						if(err)
							throw err;
						else
							next();
					});					
			},
			function(next){//prepare timer for future execution.
				
				setTimeout(function(){
					execute_timer(timer);									
				},interval);	
					
			}
			
		]);					
	}else{	//execute timer business logic now because it is a timer from the past	
		
		execute_timer(timer);
			
	}
			
}

/*
 * Execute timer structure: 
 * 
 * 1) execute registered timer function
 * 2) remove timer object from db
 */
var execute_timer = exports.execute_timer = function(timer){
	
	if(timer_type_handlers[timer.type_name ])
		timer_type_handlers[timer.type_name ]( timer.data );
	else
		throw new Error("Timer type not registered:" + timer.type_name);
		
	remove_timer(timer);
}


/*
 * Remove a timer from db
 */
var remove_timer = exports.remove_timer = function(timer,ret_handler){
	
	var timer_id = "" + timer._id;
	db.removeById("timers", timer_id, ret_handler || function(err){
		
		if(err)														
			throw err;															
	});		
}
	
	

