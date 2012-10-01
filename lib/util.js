var m = require("moment");
var db = require("./db");


/*
 * Function to check db id.
 */
exports.isHex = function( wid ){				
	
	var str = wid.split("");
	for(i in str){
		
		if(str[i] > "f")
			return false;
	}
	return true;
	
}

/*
 * Function to check if a user id has access to a document. By now, a user has acces to a document if
 * has the ownership of the document or belongs to the rcpts list of the document.
 */
exports.check_access = function( params, doc ){
		
	return doc.uid == params.uid || (doc.rcpts != undefined && doc.rcpts.indexOf(params.uid) >= 0); 				
}


/*
 * gets inner field of the object
 */
var get_field = exports.get_field =  function( obj, fname ){
		
	if( obj == undefined )
		return undefined;
			
	var idx = fname.indexOf(".");	
	if(  idx != -1 ){
						
		obj = obj[fname.substr(0,idx)];
		fname = fname.substr(idx+1,fname.length-1);				
		return get_field(obj,fname);
	}else		
		return obj[fname];	
		
}


/*
 * sets the inner field of the object to the value.
 */
var set_field = exports.set_field = function(obj, fname, value ){
	
		
	var idx = fname.indexOf(".");
	 	
	if(  idx != -1 ){
		
		var cfield = fname.substr(0,idx);															
		if( obj[cfield] == undefined )
			obj[cfield] = {};
		obj = obj[cfield];		 
		fname = fname.substr(idx+1,fname.length-1);				
										
		set_field(obj,fname,value);
	}else		
		obj[fname] = value;
	
}

/*
 * deletes inner field of the object.
 */
var del_field = exports.del_field = function(obj, fname ){
	
	if( obj == undefined )
		return;
		
	var idx = fname.indexOf(".");	 
	if(  idx != -1 ){
		
		var cfield = fname.substr(0,idx);															
		if( obj[cfield] == undefined )
			obj[cfield] = {};
		obj = obj[cfield];		 
		fname = fname.substr(idx+1,fname.length-1);				
										
		del_field(obj,fname);
	}else		
		delete obj[fname];
	
}


/*
 * Change default behaviour of console.log to print timestamp before any message
 * TODO: si se llama mas de una vez los timestamp de van superponiendo a la izquierda del mensaje.
 */
var f = console.log;
exports.add_console_log_printing_format = function(){
	
	console.tlog = function(){
		
		var args = Array.prototype.slice.call(arguments);
		args[0] = "[%s] " + args[0];
		args.splice(1,0,m().format("DD/MM/YYYY H:mm:ss"));
		f.apply(this, args);	
	
	}

}

/*
 * Creates a timer.
 */
timers = {};
var create_timer = exports.create_timer = function(  timer_handler, timer_data ){
	
	if(!timer_data || typeof timer_data != "object"){
		
		throw new Error("timer_data not correct, must contain: {etime,wid}");
	}	
	var timer_id = Object.keys(timers).length + "";
	var interval = timer_data.etime - new Date().getTime();
	
	if(interval > 0){	
		
		timers[timer_id] = { 
			
			wid: timer_data.wid,
			etime: new Date(timer_data.etime),
			_: setTimeout(function(){
			
				timer_handler();
				delete timers[timer_id];	
				
			},interval)
		};
	}else{
		
		timer_handler();
	}
	
}


/*
 * Function to plot al active timers.
 */
exports.show_timers = function(){
	
	for( key in timers ){
		
		console.log(timers[key].wid + ":" + timers[key].etime.toGMTString() );				
	}
}

/*
 * Launch a timer passing the timer handler to remove the document and its related events when it expires.
 */
exports.start_expire_timer = function( timer_data, ret_handler ){
	
						
	create_timer( function(){
											
			db.remove_expired(timer_data.catalog, timer_data.wid, function(err,n){
																							
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
exports.load_expire_timers = function(ret_handler){
	
	db.criteria("timers", {}, {etime:1}, function( err, arr_timers ){
		
		arr_timers.forEach(function(elem_timer, index, array) {
			
	    	exports.start_expire_timer(elem_timer);	    	
		});
		
		if(ret_handler)
			ret_handler(arr_timers.length);		
	});
	
}





