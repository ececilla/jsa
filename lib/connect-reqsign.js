
var crypto = require("crypto");

exports = module.exports = function(options){
	
	return function(req,res,next){

		if(options.auth_secret){

			var auth_hline = req.headers["authorization"];			    				    	
	    	var key = auth_hline && auth_hline.substring(auth_hline.indexOf("=",auth_hline)+1,auth_hline.length);			    				    				   	    	
	    	var expected_key = hash( (req.body || "") + options.auth_secret );
	    				    				    	
	    	if(key !== expected_key || !auth_hline){
	    		
	    		next({status:401});	    		
	    		return;
	    	}
		}
		next();
	}
}

var hash = function(str){

	return crypto.createHash("md5").update(str).digest("base64");
}