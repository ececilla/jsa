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
 * Load all persisted timers
 */
exports.load  = function(ret_handler){
	
	db.criteria("timers", {}, {etime:1}, function( err, arr_timers ){
		
		if(err){
			ret_handler(err);
			return;
		}
		
		async.forEach(arr_timers,function(timer,next){
			
			start_timer(timer,function(err){ next(err); });
		},function(err){			
			
			ret_handler(err,arr_timers.length);
		});
		
	});
}


/*
 * Add/Register a timer type and its handler.
 */
exports.add_timer_type = function( type_name, timer_type_handler ){
	
	timer_type_handlers[type_name] = timer_type_handler;
}


/*
 * Start a new timer
 */
var start_timer = exports.start_timer = function( timer, ret_handler ){
	
	if( typeof timer != "object" || (!timer.etime || !timer.type_name) ){		
	
		ret_handler("Timer parameter structure must contain: {etime, type_name}");
		return;
	}
	
	if(timer_type_handlers[timer.type_name] == undefined){	
	
		ret_handler("Timer type not registered:" + timer.type_name);
		return;
	}
			
	var interval = timer.etime - time.now();//time interval to execute the timer.	
	
	if(interval > 0){
		
		async.series(
		[
			function(next){//save timer data into db
				
				timer._id?
					next():
					db.save("timers", timer, function(err){
						
						next(err);
					});					
			},
			function(next){//prepare timer for future execution.
				
				setTimeout(function(){
					execute_timer(timer);									
				},interval);	
				next();	
			}
			
		],function(err){							
			
			ret_handler(err);
				
		});					
	}else{	//execute timer business logic right now because it is an already expired timer.	
		
		execute_timer(timer);
			
	}
			
}

/*
 * Execute timer structure: 
 * 
 * 1) execute registered timer function
 * 2) remove timer object from db
 */
var execute_timer = exports.execute_timer = function(timer, ret_handler){
	
	if(timer_type_handlers[timer.type_name ])
		timer_type_handlers[timer.type_name ]( timer.data );
	else
		throw new Error("Timer type was unregistered:" + timer.type_name);
		
	remove_timer(timer, ret_handler);
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
	
	

