var m = require("moment");
var db = require("./db");
var api = require("./api");


exports.get_remote_operations = function(){
	
	var ops = [];
	
	for( key in api.remote )				
		ops.push(key);
	
	return ops;
}

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
 *  var x = {a:1,b:"kdjfklsdf",c:[5,6,7],d:{e:1,f:"fksdkf",g:[8,9,0]}};
 */
var set_field = exports.set_field = function(obj, fname, value, index ){
			
	var idx = fname.indexOf(".");
	 	
	if(  idx != -1 ){
		
		var cfield = fname.substr(0,idx);															
		if( obj[cfield] == undefined )
			obj[cfield] = {};
		obj = obj[cfield];		 
		fname = fname.substr(idx+1,fname.length-1);				
										
		set_field(obj,fname,value,index);
	}else{		
		
		if(index != undefined){
						
			if(typeof obj[fname] == "object")
				obj[fname][index] = value;
			else
				throw new Error("Cannot index");	
		}else				
			obj[fname] = value;
	}
		
}

/*
 * deletes inner field of the object.
 */
var del_field = exports.del_field = function(obj, fname, index ){
	
	if( obj == undefined )
		return;
		
	var idx = fname.indexOf(".");	 
	if(  idx != -1 ){
		
		var cfield = fname.substr(0,idx);															
		if( obj[cfield] == undefined )
			obj[cfield] = {};
		obj = obj[cfield];		 
		fname = fname.substr(idx+1,fname.length-1);				
										
		del_field( obj, fname, index);
	}else{		
		if(index != undefined){
						
			if(typeof obj[fname] == "object")
				obj[fname].splice(index,1);
			else
				throw new Error("Cannot index");	
		}else				
			delete obj[fname];
		
	}
	
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




