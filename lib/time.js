var db = require("./db");

/*
 * timers object
 */
timers = {};

/*
 * current time, all time in the app must be retrieved from here!
 */
var now = exports.now = function(){
	
	return new Date().getTime();
}


/*
 * Creates a timer object and stores its information into the db.
 * timer_data = {tid:,etime:,data:}
 */
var create_timer  = function(  timer_handler, timer_data ){
	
	
	if( typeof timer_data != "object" || (!timer_data.tid || !timer_data.etime) ){
		
		throw new Error("timer_data not correct, must contain: {etime,tid}");
	}		
	
	var timer_id = Object.keys(timers).length + "";
	var interval = timer_data.etime - now();
	
	if(interval > 0){
			
		db.save("timers",timer_data,function(err,val){
		
			if(err)
				throw err;
				
			timers[timer_id] = { 
			
				tid: timer_data.tid,
				etime: new Date(timer_data.etime),
				_: setTimeout(function(){
					
						db.remove("timers",{tid:timer_data.tid}, function(err){
							
							delete timers[timer_id];
							
							if(err)
								throw err;
							
							timer_handler();								
						});														
					},interval)
			};	
		});
		
	}else{		
	
		timer_handler();
	}
	
}


/*
 * Function to plot al active timers.
 */
exports.show = function(){
	
	for( key in timers ){
		
		console.log(timers[key].tid + ":" + timers[key].etime.toGMTString() );				
	}
}

/*
 * Launch a timer passing the timer handler to remove the document and its related events when it expires.
 */
var create_remove_timer = exports.create_remove_timer = function( timer_data, ret_handler ){
	
						
	create_timer( function(){
											
			db.remove_global(timer_data.data.catalog, timer_data.tid, function(err,n){
																							
				if(!err){
					if(ret_handler)
						ret_handler();
				}else
					throw err;
			});
	}, timer_data );	
	
		
}

/*
 * Load timers from db.
 */
exports.load_remove_timers = function(ret_handler){
	
	db.criteria("timers", {}, {etime:1}, function( err, arr_timers ){
		
		arr_timers.forEach(function(elem_timer, index, array) {
			
	    	create_remove_timer(elem_timer);	    	
		});
		
		if(ret_handler)
			ret_handler(arr_timers.length);		
	});
	
}

