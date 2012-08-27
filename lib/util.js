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





