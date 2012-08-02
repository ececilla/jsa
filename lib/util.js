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
 * Function to check if a user id has access to a document
 */
exports.check_access = function( params, doc ){
		
	return doc.uid == params.uid || (doc.rcpts != undefined && doc.rcpts.indexOf(params.uid) >= 0); 				
}
