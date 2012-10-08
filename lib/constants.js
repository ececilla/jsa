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
         DEBUG:1         
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

