var util = require("./util");
var _ = require("underscore");

var post_options = {
		
	host:"android.googleapis.com",
	port:"80",
	path:"/gcm/send",
	method:"POST",
	headers:{
		"Content-Type":"application/json"						
	}				
};

/*
 * configure provider with api key.
 */
exports.configure = function( api_key ){
	
	post_options.headers.Authorization = "key=" + api_key;
}

/*
 * Push data to rcpts via google cloud messaging.
 */
exports.push = function( push_ids, ev_msg, ret_handler){
	
	if(!post_options.headers.Authorization){
		
		ret_handler && ret_handler("apikey not configured for gcm push provider",null);
		return;
	}
					
	var post_msg = {registration_ids:push_ids, data:ev_msg};	
	util.http_post(post_options, JSON.stringify(post_msg),function(response_str){
					
		try{
			var resp  =	JSON.parse(response_str);			
			ret_handler && ret_handler(null,resp);
		}catch(err){
			
			ret_handler && ret_handler(response_str,null);
		}
	});
	
}
