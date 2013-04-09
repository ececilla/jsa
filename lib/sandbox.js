var db = require("./db");
var util = require("./util");
var srv = require("./server");
var api = require("./api");
var async = require("async");

var _ = require("underscore");

var constraints={};
var plugins = {};
var stopwords;

exports.init = function(){
		
	constraints[srv.config.db.default_catalog] = {pre:{}, post:{}}; 
	plugins[srv.config.db.default_catalog] = {_in:{},_out:{},_mid:{}};	
	stopwords = util.read_lines(srv.config.app.stopwords_file);
}

/*
 * Load doc and user from db.
 */
function load_objects(ctx, ret_handler){					
	
	async.parallel(
		[function(next){//load document
			
			if(ctx.params && ctx.params.wid && ctx.doc === undefined ){
				
				db.select(ctx.params.catalog, ctx.params.wid,{_id:1,ctime:1,etime:1,rcpts:1}, function(err,doc){
					
					ctx.doc = doc;
					if(!err && !doc)
						next({code:-1, message:"Document not found: #" + ctx.params.catalog + "/" + ctx.params.wid }, null);	
					else													
						next(err);
								
				});
			}else
				next();
		},
		
		function(next){//load user
			
			if(ctx.params && ctx.params.uid && ctx.user === undefined){
				
				db.select("users",ctx.params.uid,{_id:1,wids:1,push_id:1,push_type:1},function(err,user){
					
					ctx.user = user;					
					if( !err && !user){							
						next({code:-1, message:"User not found: #users/" + ctx.params.uid });
					}else						
						next(err);
						
				});
			}else
				next();
			
		}],function(err){			
			ret_handler(err);
		}
	);	
	
}


/*
 * Add a plugin for incoming, middle or outgoing phase step. 
 */
function add_plugin(plugins, proc_name, plugin_name, func_handler){
	
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
 * Add plugin for incoming call phase
 */
exports.add_plugin_in =  function( proc_name, plugin_name, func_handler, catalog_name ){
	
	catalog_name = catalog_name || srv.config.db.default_catalog;
	if( !plugins[catalog_name] )
		plugins[catalog_name] = {_in:{},_out:{},_mid:{}};
		
	return add_plugin(plugins[catalog_name]._in, proc_name, plugin_name, func_handler);
}

/*
 * Add plugin for in-the-middle call phase
 */
exports.add_plugin_mid =  function( proc_name, plugin_name, func_handler, catalog_name ){
	
	catalog_name = catalog_name || srv.config.db.default_catalog;
	if( !plugins[catalog_name] )
		plugins[catalog_name] = {_in:{},_out:{},_mid:{}};
		
	return add_plugin(plugins[catalog_name]._mid, proc_name, plugin_name, func_handler);
}


/*
 * Add plugin for outcoming call phase
 */
exports.add_plugin_out =  function( proc_name, plugin_name, func_handler, catalog_name ){
	
	catalog_name = catalog_name || srv.config.db.default_catalog;
	if( !plugins[catalog_name] )
		plugins[catalog_name] = {_in:{},_out:{},_mid:{}};
		
	return add_plugin(plugins[catalog_name]._out, proc_name, plugin_name, func_handler);
}



/*
 * Copy constraints from one catalog to another.
 */
exports.copy_constraints = function(catalog_from, catalog_to){
	
	constraints[catalog_to] = util.clone(constraints[catalog_from]);
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
exports.add_constraint_post =  function( proc_name, cons_name, func_handler, catalog_name ){
	
	catalog_name = catalog_name || srv.config.db.default_catalog;
	if( !constraints[catalog_name] )
		constraints[catalog_name] = {pre:{},post:{}};
		
	return add_constraint(constraints[catalog_name].post, proc_name, cons_name, func_handler);
}


/*
 * Plug constraint before the document load.
 */
exports.add_constraint_pre =  function( proc_name, cons_name, func_handler, catalog_name ){
	
	catalog_name = catalog_name || srv.config.db.default_catalog;
	if( !constraints[catalog_name] )
		constraints[catalog_name] = {pre:{},post:{}};
		
	return add_constraint(constraints[catalog_name].pre, proc_name, cons_name, func_handler);
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
    }else if(!(srv.config.app  && srv.config.app.status)){
    	
    	ret_handler({code:-32603, message:"Server not started"},null);
    	return;
    }
        
    //params may come from another function, in that case params refer to ctx.
	var ctx = (params && params.params && params.config && params.doc)? params: { params:params||{},  config:{save:1, emit:1} };
	ctx.params.catalog = ctx.params.catalog || srv.config.db.default_catalog;
	
	/*
	 * sandbox pipeline:
	 */
	async.series([
			
	function(next_phase){ //execute plugins_in		
				
		async.forEachSeries(Object.keys(plugins[ctx.params.catalog] && plugins[ctx.params.catalog]._in[proc_name]||{}),function(plugin_name,next){
						
			plugins[ctx.params.catalog]._in[proc_name][plugin_name](ctx, function(err){
									
				next(err || ctx.err);							
			});
		},function(err){
			next_phase(err);
		});				
	},
								
	function(next_phase){ //constraints pre objects(data document and user document) load
										
		var err;
		if(constraints[ctx.params.catalog]){
		    for( key in constraints[ctx.params.catalog].pre[proc_name] ){
				
				if(err = constraints[ctx.params.catalog].pre[proc_name][key](ctx))			
					break;																						
			}
		}
		if(err)
			next_phase(err);
		else	
			next_phase();
	},
	
	function(next_phase){ //data document and user document load	
			
		load_objects(ctx, function(err){
			
			ctx.doc = ctx.doc || {};
			next_phase(err);
		});
	},	
	
	function(next_phase){ //execute plugins_mid		
		
		async.forEachSeries(Object.keys(plugins[ctx.params.catalog] && plugins[ctx.params.catalog]._mid[proc_name]||{}),function(plugin_name,next){
			
			plugins[ctx.params.catalog]._mid[proc_name][plugin_name](ctx, function(err){
									
				next(err || ctx.err);							
			});
		},function(err){
			next_phase(err);
		});				
	},		
	
	function(next_phase){ //constraints post objects(data document and user document) load						
								
		var err;
		if(constraints[ctx.params.catalog]){
			for( key in constraints[ctx.params.catalog].post[proc_name] ){
		
				if( err = constraints[ctx.params.catalog].post[proc_name][key](ctx) )
					break;																																			
			}
		}
		if(err)
			next_phase(err);
		else	
			next_phase();				
	},		
	
	function(next_phase){ //execute api procedure
																	
		api.remote[proc_name](ctx, function(err,val){
			
			ctx.retval = util.clone(val);//return value returned over ctx.retval
			next_phase(err);
		});
	},
	
	function(next_phase){ //execute plugins_out
		
		async.forEachSeries(Object.keys(plugins[ctx.params.catalog] && plugins[ctx.params.catalog]._out[proc_name]||{}),function(plugout_name,next){
								
			plugins[ctx.params.catalog]._out[proc_name][plugout_name](ctx, function(err){
				
				next(err || ctx.err);
			});
								
		},function(err){
			next_phase(err);	
		});
		
	},
	
	function(next_phase){//save  user
		
		if(ctx.user && (ctx.config.save == 1 || ctx.config.save.user == 1)){
			
			db.save("users", ctx.user, function(err){
				
				next_phase(err);
			});					
		}else
			next_phase();		
	},
	
	function(next_phase){//save  doc
		
		if(ctx.doc && (ctx.config.save == 1 || ctx.config.save.doc == 1)){
			
			db.save(ctx.params.catalog, ctx.doc, function(err){
				
				next_phase(err);
			});					
		}else
			next_phase();		
	},
	
	/*
	 * Emit event for other modules to react, ex:evmngr
	 * These other modules in order to receive the event must be registered
	 * to the api sink via api.on(...)
	 */
	function(next_phase){ 	
		
		if(ctx.config && ctx.config.emit){						
								
			ctx.payload = ctx.payload || ctx.params;			
			api.emit("ev_api_" + proc_name, ctx, ctx.config.tag);			
		}
		next_phase();
	}
	],function(err){ //return context or error
		
		if(err)
			ret_handler(err,null);
		else	
			ret_handler(null,ctx);	
		
	});
					 			
}

exports.constraints = {
		
	is_owner: function(ctx){
		
			if( ctx.params.uid != ctx.doc.uid ){
			
				return {code:-2, message:"No access permission: not owner"};
			}
	},
	
	has_joined: function(ctx){
		
		if( !ctx.doc.rcpts || !util.has_joined(ctx.doc.rcpts,ctx.user.push_id)){
		
			return {code:-3, message:"No access permission: not joined"};
		}
	},
	
	not_joined: function(ctx){
		
		if( ctx.doc.rcpts.indexOf(ctx.params.uid) != -1 ){
		
			return {code:-4, message:"No access permission: already joined"};
		}
	},
	
	not_catalog: function(ctx){
				
		return {code:-5, message:"No access permission: restricted catalog"};
	},
	
	user_catalog: function(ctx){
		
		if(!_.contains(srv.config.db.user_catalogs,ctx.params.catalog)){		
			
			return {code:-6, message:"No access permission: not user catalog"};
		}
	},
	
	is_joinable: function(ctx){
		
		if(!ctx.doc.rcpts){
		
			return {code:-7, message:"No access permission: not joinable/unjoinable"};
		}
	},
			
	is_reserved: function(ctx){
		
		if(ctx.params.fname == "rcpts" || ctx.params.fname == "_id" || ctx.params.fname == "uid" 
		|| ctx.params.fname == "ctime" || ctx.params.fname == "etime" || ctx.params.fname == "catalog"){			
		
			return {code:-8, message:"Reserved word not allowed as field name: " + ctx.params.fname };
		}
	},
		
	
	field_exists: function(ctx){
				
		if(ctx.params.fname){
			if( util.get_field(ctx.doc,ctx.params.fname) == undefined){
				
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
	
	some_required: function(fields){
		
		return function(ctx){
						
			if(!_.some(fields,function(field){
				return _.contains(Object.keys(ctx.params),field);
			})){
				return {code:-15, message:fields  + " one parameter required"};
			}
		}
	},
					
	is_protected:function(protected_fnames){
		
		return function(ctx){			
			
			if(!util.is_array(protected_fnames))
				protected_fnames = [protected_fnames];
			
			var params_fname;
			if(!util.is_array(ctx.params.fname))
				params_fname = [ctx.params.fname];
			else
				params_fname = ctx.params.fname;
					
			if( _.some(params_fname,function(elem){return _.contains(protected_fnames,elem)}) ){
				
				return {code:-13, message:"Protected field not allowed as field name"}; 
			}		
		}
	},
	
	is_disabled: function(ctx){
		
		return {code:-14, message:"operation disabled for catalog "  + ctx.params.catalog};
	}			
	
};

exports.plugins = {
	
	url_transform : function(ctx,next){
		
		util.parse_url(ctx);		
		next();
	},
	
	/*
	 * Plugin to extract keywords from specified fields:
	 * ex: 	sandbox.plugins.extract_keywords("subject");
	 * 		sandbox.plugins.extract_keywords("body")
	 */
	extract_keywords: function(keywords_field){
		
		return function(ctx, next){
			
			if( ctx.params.doc && ctx.params.doc[keywords_field] && _.isString( ctx.params.doc[keywords_field]) ){
								
				var tokens = util.tokenize(ctx.params.doc[keywords_field]);				
				var keywords = _.chain(tokens)
								.reject(function(token){//reject empty tokens
									
									return token.length == 0;
								})
								.reject(function(token){//reject hashtag as a keyword
					
									return  token.substring(0,1) == "#";
								})
								.map(function(token){//get rid of punctuation and convert to lowercase
									
									return token.replace("?","")																							
												.replace(":","")
												.replace("!","")
												.toLowerCase();
								})
								.reject(function(token){//reject stopwords
									
									return _.contains(stopwords, token);	
								})								
								.value();
								
				if( ctx.params.doc.keywords ){
					ctx.params.doc.keywords = ctx.params.doc.keywords.concat(keywords);
					ctx.params.doc.keywords = _.uniq(ctx.params.doc.keywords);
				}else
					ctx.params.doc.keywords = keywords;
			}
			next();
		}
	},
	
	
	extract_hashtags: function(hashtags_field){
		
		return function(ctx,next){
			
			if( ctx.params.doc && ctx.params.doc[hashtags_field] && _.isString( ctx.params.doc[hashtags_field]) ){
				
				var tokens = ctx.params.doc[hashtags_field].split(" ");
				var hashtags = _.filter(tokens, function(token){
														
									return token.substring(0,1) == "#";
								});	
				
				if( ctx.params.doc.hashtags ){
					ctx.params.doc.hashtags =  ctx.params.doc.hashtags.concat(hashtags);
					ctx.params.doc.hashtags = _.uniq(ctx.params.doc.hashtags);	 
				}else
					ctx.params.doc.hashtags = hashtags;	
			}	
			next();
		}
	},
	
	notifying_doc : function(ctx,next){
		
		if(ctx.params.notifiable == undefined){
			if(ctx.params.catalog == srv.config.db.default_catalog){
				ctx.params.rcpts = ctx.params.rcpts || [];
				ctx.params.rcpts.push( {uid:"" + ctx.user._id, push_id:ctx.user.push_id, push_type:ctx.user.push_type} );
			}
		}else if(ctx.params.notifiable){
			ctx.params.rcpts = ctx.params.rcpts || [];
			ctx.params.rcpts.push( {uid:"" + ctx.user._id, push_id:ctx.user.push_id, push_type:ctx.user.push_type} ); 
		}		
		next();	
	},
	
	notifying_catalog:function(catalog){ 
		
		return function(ctx,next){
			
			if(ctx.params.catalog == catalog){				
				ctx.params.rcpts = ctx.params.rcpts || [];	
				ctx.params.rcpts.push( {uid:"" + ctx.user._id, push_id:ctx.user.push_id, push_type:ctx.user.push_type} );
			}	
			next();	
		}
	},
	
	rewrite_id:function(ctx,next){
				
		if(ctx.retval){
			
			if(util.is_array(ctx.retval)){
				for(var i=0; i < ctx.retval.length; i++){
					if(ctx.retval[i]._id !== undefined){
						if(ctx.params.catalog == "users"){
						
							ctx.retval[i].uid = "" + ctx.retval[i]._id;
							delete ctx.retval[i]._id;
						}else{
						
							ctx.retval[i].wid = "" + ctx.retval[i]._id;
							delete ctx.retval[i]._id;
						}
					}	
				}
			}else{
					
				if( ctx.retval._id !== undefined ){
					if(ctx.params.catalog == "users"){
					
						ctx.retval.uid = "" + ctx.retval._id;
						delete ctx.retval._id;
					}else{
					
						ctx.retval.wid = "" + ctx.retval._id;
						delete ctx.retval._id;
					}
				}
			}
		}
		next();
		
	},
	
	external_config: function(ctx,next){
		
		if(ctx.params.config){
			
			for(key in ctx.params.config){
				
				ctx.config[key] = ctx.params.config[key]; 
			}
			delete ctx.params.config;
		}
			
		next();
	}
}
