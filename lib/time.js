/*
 * Current time, all time in the app must be retrieved from here!
 */
exports.now = function(){
	
	return new Date().getTime();
}

/*
 * Return Date object from millis
 */
exports.date = function(millis){
	
	return new Date(millis);
}

