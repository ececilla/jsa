var api = require("./api");
var db = require("./db");

var constraints = {};

/*
 * Load document from db.
 */
function load_document(params, ret_handler){//maybe move code to util.load_document					
	
	if(params.wid){
		
		db.select(params.catalog, params.wid, function(err,doc){
			
			if(err)
				ret_handler(err,null);
			else if(!err && !doc)
				ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);	
			else							
				ret_handler(null,doc);			
		});
	}else
		ret_handler(null,null);
	
}


/*
 * Add a constraint on the remote procedure.
 */
exports.add_constraint =  function( proc_name, cons_name, func_handler ){
	
	if(!constraints[proc_name])
		constraints[proc_name] = {};
		
	constraints[proc_name][cons_name] = function(params, doc){
		
		return func_handler(params,doc);
								
	};
	return exports;
}

/*
 * Execute all constaints for proc_name procedure, if no constraints returns an error object execution continues
 * calling api.remote[proc_name].
 */
exports.execute = function( proc_name, params, ret_handler){
	
	var ctx = {params:params};
	ctx.params.catalog = ctx.params.catalog || "docs"; //srv.db.config.default_catalog or srv.api.config.default_catalog
	
	load_document(params, function(err,doc){
		
		ctx.doc = doc;
		
		if(err)
			ret_handler(err,null);
		else{
				
			for( key in constraints[proc_name] ){
		
				var err = constraints[proc_name][key](ctx);
				if(err){
					ret_handler(err,null);
					return;
				}									
			}
			
			api.remote[proc_name](ctx, function(err,val){
				
				if(err){					
					ret_handler(err,null);
					return;
				}else if(ctx.doc){
										
					db.save(ctx.params.catalog, ctx.doc, function(err){
						
						if(err)
							ret_handler(err,null);
						else
							ret_handler(null,val);
					});
				}else{
					ret_handler(null,val);
				}
			});
		}
		
	});
	
	
	
		
}
	


