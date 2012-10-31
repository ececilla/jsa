var db = require("./db");
var util = require("./util");
var srv = require("./server");
var api = require("./api");
var async = require("async");

var constraints = {pre:{}, post:{}};
var plugins = {};

/*
 * Load document from db.
 */
function load_document(params, ret_handler){//maybe move code to util.load_document					
	
	if(params && params.wid){
		
		db.select(params.catalog, params.wid, function(err,doc){
			
			if(err)
				ret_handler(err,null);
			else if(!err && !doc)
				ret_handler({code:-1, message:"Document not found: #" + params.catalog + "/" + params.wid }, null);	
			else							
				ret_handler(null,doc);			
		});
	}else
		ret_handler(null,null);
	
}

/*
 * Add a plugin 
 */
exports.add_plugin = function(proc_name, plugin_name, func_handler){
	
	if(!plugins[proc_name])
		plugins[proc_name] = {};
	
	if(func_handler == undefined && typeof plugin_name == "function"){
		
		func_handler = plugin_name;
		plugin_name = util.generate_rstring(10);
	}	
	
	plugins[proc_name][plugin_name] = function(ctx, end_handler){
	
		func_handler(ctx, end_handler);
	}
	
	return exports;
}

/*
 * Add constraint as a pre or post constraint.
 */
function add_constraint( constraints, proc_name, cons_name, func_handler){
	
	
	if(!constraints[proc_name])
		constraints[proc_name] = {};
		
	if(func_handler == undefined && typeof cons_name == "function"){
		
		func_handler = cons_name;		
		cons_name = util.generate_rstring(10);		
	}	
		
	constraints[proc_name][cons_name] = function(ctx){
		
		return func_handler(ctx);
								
	};
	
	return exports;
	
}

/*
 * Plug constraint after the document load.
 */
exports.add_constraint_post =  function( proc_name, cons_name, func_handler ){
	
	return add_constraint(constraints.post, proc_name, cons_name, func_handler);
}

/*
 * Plug constraint before the document load.
 */
exports.add_constraint_pre =  function( proc_name, cons_name, func_handler ){
	
	return add_constraint(constraints.pre, proc_name, cons_name, func_handler);
}



/*
 * Execute all constaints for proc_name procedure, if no constraints returns an error object execution continues
 * calling api.remote[proc_name].
 */
exports.execute = function( proc_name, params, ret_handler){
	
	if( !api.remote[proc_name] ){
						
		ret_handler({code:-32601, message:"Method not found."},null);		
		return;
    }else if(!srv.api.config.procedures[proc_name] ){
    	
    	ret_handler({code:-32604, message:"Method not available."},null);
    	return;
    }else if(!srv.config.app || !srv.config.app.status){
    	
    	ret_handler({code:-32603, message:"Server not started"});
    	return;
    }
        
    
	var ctx = (params && params.params && params.config && params.doc)? params: { params:params||{},  config:{save:1, emit:1} };
	ctx.params.catalog = ctx.params.catalog || srv.config.db.default_catalog;
	
	//Execute plugins to transform ctx some way.
	async.forEachSeries(Object.keys(plugins[proc_name]||{}),function(plugin_name,end_handler){
		
		plugins[proc_name][plugin_name](ctx, end_handler);
							
	},function(){//plugins executed
	
		//constraints pre document load.
	    for( key in constraints.pre[proc_name] ){
			
			var err = constraints.pre[proc_name][key](ctx);
			if(err){
						
				ret_handler(err,null);
				return;
			}									
		}
				
		load_document(params, function(err,doc){//document load
			
			ctx.doc = doc || ctx.doc || {};
			
			if(err){
				ret_handler(err,null);
				return;
			}else{
				
				//constraints post document load	
				for( key in constraints.post[proc_name] ){
			
					var err = constraints.post[proc_name][key](ctx);
					if(err){
								
						ret_handler(err,null);
						return;
					}									
				}
				
								
				//All constraints satisfied and plugins executed, so execute procedure.				
				api.remote[proc_name](ctx, function(err,val){
					
					if(err){					
						ret_handler(err,null);
						return;
					}else if(ctx.config.save){
											
						db.save(ctx.params.catalog, ctx.doc, function(err){
							
							if(err)
								ret_handler(err,null);
							else{
								if(ctx.config.emit){						
										
									ctx.payload = ctx.payload || ctx.params;
									api.emit("ev_api_" + proc_name, ctx);
								}							
								ret_handler(null,val);
							}
						});
					}else{
						
						ret_handler(null,val);
					}
				});//end execute
														
			}
			
		});
	});
			
}

exports.constraints = {
		
	is_owner: function(ctx){
		
			if( ctx.params.uid != ctx.doc.uid ){
			
				return {code:-2, message:"No access permission: not owner"};
			}
	},
	
	has_joined: function(ctx){
		
		if( !ctx.doc.rcpts || ctx.doc.rcpts.indexOf(ctx.params.uid) == -1 ){
		
			return {code:-3, message:"No access permission: not joined"};
		}
	},
	
	not_joined: function(ctx){
		
		if( ctx.doc.rcpts.indexOf(ctx.params.uid) != -1 ){
		
			return {code:-4, message:"No access permission: already joined"};
		}
	},
	
	not_system_catalog: function(ctx){
		
		if( srv.config.db.system_catalogs.indexOf(ctx.params.catalog) != -1 ){
		//if(ctx.params.catalog == "events" || ctx.params.catalog == "timers"){
		
			return {code:-5, message:"No access permission: system catalog"};
		}
	},
	
	user_catalog: function(ctx){
		
		if( srv.config.db.user_catalogs.indexOf(ctx.params.catalog) == -1 ){
			
			return {code:-6, message:"No access permission: not user catalog"};
		}
	},
	
	is_joinable: function(ctx){
		
		if(!ctx.doc.rcpts){
		
			return {code:-7, message:"No access permission: not joinable/unjoinable"};
		}
	},
		
	
	is_reserved: function(ctx){
		
		if(ctx.params.fname == "rcpts" || ctx.params.fname == "_id" || ctx.params.fname == "uid" || ctx.params.fname == "ctime" || ctx.params.fname == "etime" || ctx.params.fname == "catalog"){			
		
			return {code:-8, message:"Reserved word not allowed as field name: " + ctx.params.fname };
		}
	},
		
	
	field_exists: function(ctx){
				
		if(ctx.params.fname){
			if(!util.get_field(ctx.doc,ctx.params.fname)){
				
				return {code:-9, message:"Not exists: #" + ctx.params.catalog + "/" + ctx.params.wid + ":" + ctx.params.fname};
			}
		}
	},
		
	field_type: function(type){ 
		
			return function(ctx){
				
				var obj = util.get_field(ctx.doc,ctx.params.fname);
				
				if(type == "array"){
					
					if(typeof obj != "object" || !obj.push || !obj.pop || !obj.shift || !obj.unshift  ){
						
						return {code:-10, message:"Wrong type: #" + ctx.params.catalog + "/" + ctx.params.wid + ":" + ctx.params.fname + " not array"};
					}
				}else{
							
					if(typeof obj != type ){
					
						return {code:-10, message:"Wrong type: #" + ctx.params.catalog + "/" + ctx.params.wid + ":" + ctx.params.fname + " not " + type};
					}		
				}		
		}
	},
	
	param_type : function(param_name, type){ 
		
			return function(ctx){
			
				if(typeof ctx.params[param_name] != type ){
				
					return {code:-11, message:"Wrong parameter type: "+ param_name +" not " + type };
				}				
		}
	}, 
	
	is_required: function(field){ 
		
			return function(ctx){
			
				if(!ctx.params[field]){
					
					return {code:-12, message:field  + " parameter required"};	
				}				
		}
	},
			
	
};

exports.plugins = {
	
	url_transform : function(ctx,next){
		
		util.parse_url(ctx);
		next();
	},
	
	notifying_doc : function(ctx,next){
		
		if(ctx.params.notifiable == undefined){
			if(ctx.params.catalog == srv.config.db.default_catalog)
				ctx.params.rcpts = [ctx.params.uid];
		}else if(ctx.params.notifiable){
			ctx.params.rcpts = [ctx.params.uid];
		}
		next();	
	},
	
	notifying_catalog:function(catalog){ 
		
		return function(ctx,next){
			
			if(ctx.params.catalog == catalog)
				ctx.params.rcpts = [ctx.params.uid];
			next();	
		}
	}
}
