/*
 * module with constant values.
 * var CONST = require("./lib/constants");
 * CONST.PUSH() == 1
 */
module.exports = (function() {
     
     var arr_private = {
         "PUSH": 1,
         "PULL": 0,
         "ENABLE":1,
         "DISABLE":0         
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
