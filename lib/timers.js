var db = require("./db");
var time = require("./time");
var util = require("./util");
var CONST = require("./constants");

var async = require("async");
var _ = require("underscore");


/*
 * Object to hold all timer type handlers.
 */
var timer_type_handlers = {};

/*
 * Array to hold all timers dued to execution within the next 5 minutes.
 */
var timers = [];
var reload_timeout;
var queue_timeout;

exports.begin = function(reload_period, ret_handler){
	
	if(typeof reload_period === "function"){
		ret_handler = reload_period;
		reload_period = undefined;
	}
	if( !reload_timeout )
		reload( reload_period || CONST.TIMERS_RELOAD_PERIOD_MS(), ret_handler);
	
}

exports.end = function(){
	
	clearTimeout(reload_timeout);
	clearTimeout(queue_timeout);
	reload_timeout = undefined;
	queue_timeout = undefined;
}


/*
 * Return timers in timer queue
 */
exports.get_timers = function(){
	
	return util.clone(timers);
}


/*
 * Reload persisted timers within a time frame.
 */
var reload = exports.reload = function(reload_period, ret_handler){		
	
	//Select all timers within a future temporal window of reload_period ms.	
	db.criteria("timers", {etime:{$lt:time.now() + reload_period}}, {etime:1}, function( err, arr_timers ){ 
		
		if(err){
			if(ret_handler){
				ret_handler(err);
				return;
			}else
				throw err;
		}
				
		timers = timers.concat(arr_timers);
		if( !queue_timeout && timers.length > 0 ){
			
			pick_timer();
		}
		reload_timeout = setTimeout(function(){
								
			reload(reload_period);									
		},reload_period);
		
		ret_handler && ret_handler();
	});
}


/*
 * Add/Register a timer type and its handler.
 */
exports.add_timer_type = function( type_name, timer_type_handler ){
	
	timer_type_handlers[type_name] = timer_type_handler;
}


/*
 * Pick a new timer to start from timer queue.
 */
var pick_timer = exports.pick_timer = function(){		
	
	var timer = timers.shift();
	if( timer ){
		
		start_timer(timer);
	}else{
		
		queue_timeout = undefined;
	}
		
}

/*
 * Schedule new timers for future execution.
 */
var schedule_timer = exports.schedule_timer = function( newTimer, ret_handler ){
				
	var next_reload_time = new Date(reload_timeout._idleStart).getTime() + reload_timeout._idleTimeout;	
	if( newTimer.etime < next_reload_time ){
		
		timers.splice(_.sortedIndex( timers, newTimer, function( timer ){
						
			return timer.etime;	
		}),0,newTimer);
		
		if( !queue_timeout )
			pick_timer();		
	}	
			
	save_timer(newTimer, ret_handler );
	
	
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
											
		queue_timeout = setTimeout(function(){
			
			execute_timer(timer);
			pick_timer();									
		},interval);					
						
	}else{	//execute timer now because has expired.		
		execute_timer(timer);
		pick_timer();
		//ret_handler();	
	}
			
}

/*
 * Execute timer object 
 * 
 * 1) execute registered timer function providing timer data as parameter
 * 2) remove timer object from db
 */
var execute_timer = exports.execute_timer = function(timer, ret_handler){
		
	if(timer_type_handlers[timer.type_name ])
		timer_type_handlers[timer.type_name ]( timer.data );//make async
	else
		throw new Error("Timer type was unregistered:" + timer.type_name);
		
	remove_timer(timer, ret_handler);
}


/*
 * Remove timer from db
 */
var remove_timer = exports.remove_timer = function( timer, ret_handler ){
	
	var timer_id = "" + timer._id;			
	db.removeById("timers", timer_id, ret_handler || function(err){
		
		if(err)														
			throw err;															
	});		
}

/*
 * Save timer object into db
 */
var save_timer = exports.save_timer = function( timer, ret_handler ){		
	
	if( !timer_type_handlers[timer.type_name] ){
		
		ret_handler("Timer type not registered");
		return;
	}
	
	db.save("timers", timer, ret_handler || function(err){
						
		if(err)
			throw err;
	});
}	

	

