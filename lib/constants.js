/*
 * module with constant values.
 * var CONST = require("./lib/constants");
 * CONST.PUSH() == 1
 */
module.exports = (function() {
     
     var arr_private = {
         PUSH: 1,
         PULL: 0,
         ENABLE:1,
         DISABLE:0,
         RUNNING:1,
         STOPPED:0,
         DEBUG:1,
         MILLIS_IN_A_SECOND:1000,
         OK:1,
         REDIS_MAX_ATTEMPTS:5,
         HTTP_OK:200,
         HTTP_BAD_REQUEST:400,
         HTTP_NOT_FOUND:404         
     };
  
    var ret = {};
    for(key in arr_private){
    	
    	(function(){
    		var $ = key;
    		ret[$] = function(){ return arr_private[$] };
    	})();
    }
    return ret;
})();

/*
 * Define global constants as: CONST.DEBUG,CONST.PULL, etc...
 * var _ = require(./lib/constants);
 */

try{	
	Object.defineProperty(global,"JSA", {get:function(){
			
		return {
			PUSH:1,
			PULL:0,
			ENABLE:1,
			DISABLE:0,
			DEBUG:1
		};	
	}});
	
}catch(err){}	

