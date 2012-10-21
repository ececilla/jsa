var db = require("./db");
var util = require("./util");
var srv = require("./server");
var api = require("./api");
var constraints = {pre:{}, post:{}};

/*
 * Load document from db.
 */
function load_document(params, ret_handler){//maybe move code to util.load_document					
	
	if(params && params.wid){
		
		db.select(params.catalog, params.wid, function(err,doc){
			
			if(err)
				ret_handler(err,null);
			else if(!err && !doc)
				ret_handler({code:-7, message:"Document not found: #" + params.catalog + "/" + params.wid }, null);	
			else							
				ret_handler(null,doc);			
		});
	}else
		ret_handler(null,null);
	
}

/*
 * Add constraint as a pre or post constraint.
 */
function add_constraint( constraints, proc_name, cons_name, func_handler){
	
	
	if(!constraints[proc_name])
		constraints[proc_name] = {};
		
	if(func_handler == undefined && typeof cons_name == "function"){
		
		func_handler = cons_name;		
		cons_name = Math.random().toString(36).substring(2,10);		
	}	
		
	constraints[proc_name][cons_name] = function(params, doc){
		
		return func_handler(params,doc);
								
	};
	
	return exports;
	
}

/*
 * Plug constraint after the remote procedure.
 */
exports.add_constraint_post =  function( proc_name, cons_name, func_handler ){
	
	return add_constraint(constraints.post, proc_name, cons_name, func_handler);
}

/*
 * Plug constraint before the remote procedure.
 */
exports.add_constraint_pre =  function( proc_name, cons_name, func_handler ){
	
	return add_constraint(constraints.pre, proc_name, cons_name, func_handler);
}



/*
 * Execute all constaints for proc_name procedure, if no constraints returns an error object execution continues
 * calling api.remote[proc_name].
 */
exports.execute = function( proc_name, params, ret_handler){
	
	if( !api.remote[proc_name] || !srv.api.config.procedures[proc_name] ){
						
		ret_handler({code:-32600, message:"Method not found."},null);		
		return;
    }
        
    var aux = srv.db.config.default_catalog;
	var ctx = (params && params.params && params.config && params.doc)? params: { params:params||{},  config:{save:1, emit:1} };
	ctx.params.catalog = ctx.params.catalog || "docs"; //srv.db.config.default_catalog or srv.api.config.default_catalog
	
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
		
		if(err)
			ret_handler(err,null);
		else{
			
			//constraints post document load	
			for( key in constraints.post[proc_name] ){
		
				var err = constraints.post[proc_name][key](ctx);
				if(err){
							
					ret_handler(err,null);
					return;
				}									
			}
			
			//All constraints satisfied, so execute procedure.				
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
			});
			
		}
		
	});
			
}

exports.constraints = {
		
	is_owner: function(ctx){
		
			if( ctx.params.uid != ctx.doc.uid ){
			
				return {code:-2, message:"No access permission: not owner"};
			}
	},
	
	in_rcpts: function(ctx){
		
		if( !ctx.doc.rcpts || ctx.doc.rcpts.indexOf(ctx.params.uid) == -1 ){
		
			return {code:-2, message:"No access permission: not in rcpts"};
		}
	},
	
	not_in_rcpts: function(ctx){
		
		if( ctx.doc.rcpts.indexOf(ctx.params.uid) != -1 ){
		
			return {code:-2, message:"No access permission: already in rcpts"};
		}
	},
	
	user_catalog: function(ctx){
		
		if(ctx.params.catalog == "events" || ctx.params.catalog == "timers"){
		
			return {code:-2, message:"No access permission: system catalog"};
		}
	},
	
	is_joinable: function(ctx){
		
		if(!ctx.doc.rcpts){
		
			return {code:-2, message:"No access permission: not joinable/unjoinable"};
		}
	},
		
	
	is_reserved: function(ctx){
		
		if(ctx.params.fname == "rcpts" || ctx.params.fname == "_id" || ctx.params.fname == "uid" || ctx.params.fname == "ctime" || ctx.params.fname == "etime" || ctx.params.fname == "catalog"){			
		
			return {code:-3, message:"Reserved word not allowed as field name: " + ctx.params.fname };
		}
	},
	
	field_not_exists: function(ctx){
		
		if(util.get_field(ctx.doc,ctx.params.fname)){
			
			return {code:-3, message:"Already exists: #" + ctx.params.catalog + "/" + ctx.params.wid + "[" + ctx.params.fname + "]"};
		}
	},
	
	field_exists: function(ctx){
				
		if(!util.get_field(ctx.doc,ctx.params.fname)){
			
			return {code:-3, message:"Not exists: #" + ctx.params.catalog + "/" + ctx.params.wid + "[" + ctx.params.fname + "]"};
		}
	},
	
	field_type: function(type){ 
		
			return function(ctx){
			
				if(typeof util.get_field(ctx.doc,ctx.params.fname) != type ){
				
					return {code:-4, message:"Wrong type: #" + ctx.params.catalog + "/" + ctx.params.wid + "[" + ctx.params.fname + "] not " + type};
				}				
		}
	},
	
	param_type : function(param_name, type){ 
		
			return function(ctx){
			
				if(typeof ctx.params[param_name] != type ){
				
					return {code:-4, message:"Wrong parameter type: "+ param_name +" not " + type };
				}				
		}
	}, 
	
	is_required: function(field){ 
		
			return function(ctx){
			
				if(!ctx.params[field]){
					
					return {code:-4, message:field  + " parameter required"};	
				}				
		}
	},
			
	
};
