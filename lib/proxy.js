/*
 * Inject plugins into modules by name. Example of usage:
 * 
 * var dummy = require("./lib/dummy");
 * 
 * proxy.add_plugin("a",function(ctx,next){ctx.params.p1=1;next();});
 * proxy.add_plugin("a",function(ctx,next){ctx.params.p2=1;next();});
 * proxy.add_plugin("a",function(ctx,next){ctx.params.p3=1;next();});
 * 
 * proxy.inject(dummy);
 * 
 */
var async = require("async");

var plugins = {};


/*
 * Add plugin to plugins repository.
 */
exports.add_plugin = function( proc_name, plugin_handler ){
	
	if(!plugins[proc_name])
		plugins[proc_name] = [];
		
	plugins[proc_name].push(plugin_handler);
	
}


/*
 * Inject plugins into modules.
 */
exports.inject = function(modulee){
	
	for(key in plugins){
		
		(function(){
			
			var scopekey = key;		
			var f = modulee[scopekey];
			if(f){
				modulee[scopekey] = function(any,ret_handler){
									
					async.forEachSeries(plugins[scopekey],function(plugin_handler,next){
						
						plugin_handler(any,function(){
							
							next();					
						})
					},function(err){
						
						if(!err)
							f(any,ret_handler);	
					});					
				}
			}
						
		})();
	}

}
