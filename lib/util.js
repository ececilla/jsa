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
 * List remote procedures
 */
exports.list_remote_procedures = function( api ){
	
	var list = " ";
	for(key in api.remote){
		
		list += key + " ";
	}
	return list;
}


/*
 * Change default behaviour of console.log to print timestamp before any message
 * TODO: si se llama mas de una vez los timestamp de van superponiendo a la izquierda del mensaje.
 */
var f = console.log;
exports.change_console_log_printing_format = function(){
	
	console.log = function(){
		
		var args = Array.prototype.slice.call(arguments);
		args[0] = "[%s] " + args[0];
		args.splice(1,0,m().format("DD/MM/YYYY H:mm:ss"));
		f.apply(this, args);	
	
	}

}

/*
 * Launch a timer passing the handler to remove doc and its related events when it expires.
 */
exports.start_expire_timer = function( catalog, doc, ret_handler ){
	
	
	var interval = doc.etime - new Date().getTime();
	
	if(interval > 0) 
		setTimeout( function(){
			
				
				db.remove_expired(catalog, doc.wid, function(err,n){
										
					if(!err)
						if(ret_handler)
							ret_handler(n);
					else
						throw err;
				});
		}, interval );
	
}





