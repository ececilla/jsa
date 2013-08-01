/*
 * RPC-API to manipulate json documents on the server. These documents
 * are stored in a mongodb database.
 */

var db = require("./db");
var util  =require("./util");
var time = require("./time");
var timers = require("./timers");
var CONST = require("./constants");

var async = require("async");
var nutil = require("util");
var _ = require("underscore");
var log4js = require("log4js");
log4js.configure("log4js.json",{});
var logger = log4js.getLogger("api");

var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();
	
/*
 * Register listener so other modules can listen to what happens
 * to this module.
 * 
 */
exports.on = function( ev_type, ret_handler ){
	
	emitter.on(ev_type, function( ctx, rcpts, tag ){
		
		var ev_obj = {
			ev_type:ev_type,
			ev_tstamp: time.now(),
			ev_ctx:util.clone(ctx)
		};
		if(tag)
			ev_obj.ev_tag = tag;
										
		ret_handler( ev_obj, rcpts );
	});		
}

/*
 * emit an event as it was generated inside the api.
 * rcpts and tag parameters are both optional.
 */
var emit = exports.emit = function( ev_type, ctx, rcpts, tag ){	
	
	if(rcpts && !util.is_array(rcpts)){
		
		tag = rcpts;
		rcpts = undefined;
	}	
		
	emitter.emit(ev_type, ctx, rcpts, tag  );
}

/*
 * Namespace for public functions: all functions in the remote namespace
 * will be accessible as an rpc procedure to remote callers and made public to the 
 * front module (server.js) to local callers: srv.api.docs.$proc_name(params, ret_handler);
 */

exports.remote = {
	
	/*
	 * Register a new user into the system
	 */
	register: function(ctx, ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
				
		ctx.doc = util.clone(ctx.params.user);
		if(ctx.doc.password)//if password param is supplied change it for its md5 hashstring.
			ctx.doc.password = util.hash(ctx.doc.password);			
		ctx.doc.ctime = time.now();
		ctx.doc.utime = ctx.doc.ctime;
		ctx.doc.uname = ctx.doc.name.toUpperCase();														
		ctx.params.catalog = "users";
		
		db.save("users", ctx.doc, function(err){
					
			if(!err){
				
				ctx.doc.uid = "" + ctx.doc._id;
				delete ctx.doc._id;				
				ctx.payload = ctx.doc;							
				ctx.config.save = CONST.DISABLE();											
				ret_handler(null,ctx.doc);
			}else{
													
				ret_handler(err,null);
			}	
		});				
	},
	
	/*
	 * Create a new document.	 
	 */
	create: function( ctx, ret_handler ){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
										 						
		ctx.doc = util.clone(ctx.params.doc);				
		ctx.doc.uid = ctx.params.uid;
		ctx.doc.catalog = ctx.params.catalog;
		ctx.doc.rcpts = ctx.params.rcpts;	
		ctx.doc.ctime = time.now();
		ctx.doc.utime = ctx.doc.ctime;
		
		if(ctx.params.ttl)					
			ctx.doc.etime = ctx.doc.ctime + ctx.params.ttl * CONST.MILLIS_IN_A_SECOND();		
		
		async.series([
			function(next){//save new document
				db.save(ctx.doc.catalog, ctx.doc, function(err){
					
					if(err)
						next(err);
					else{	
						ctx.doc.wid = "" + ctx.doc._id;
						delete ctx.doc._id;						
						next();
					}	
				});
			},			
			function(next){//emit event
				if(ctx.config.emit){
								
					ctx.payload = ctx.doc;
					emit( "ev_api_create", ctx );					
				}
				next();
			},
			function(next){//start expiring-document timer
				if(ctx.doc.etime){
											
					timers.schedule_timer({
											etime:ctx.doc.etime, 
											type_name:"expiring_doc", 
											data:{catalog:ctx.params.catalog, wid:ctx.doc.wid}
										},function(err){
											
											next(err);
										}
										);																																				
				}else
					next();				
			}
			
		],function(err){//return document and disable document saving			
			if(err)
				ret_handler(err,null);
			else{
				ctx.config.save = CONST.DISABLE();
				ctx.config.emit = CONST.DISABLE();
				ret_handler(null,ctx.doc);				
			}	
		});
										
	},

	/*
	 * Delete a document by id
	 * TODO: stop or remove removal timer	 
	 */
	dispose: function(ctx, ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
							
		db.removeById( ctx.params.catalog, ctx.params.wid, function(err, val){
							
			if(!err){				
				
				ctx.config.save = CONST.DISABLE();							
				ret_handler(null,CONST.OK());
			}else{
				ret_handler(err,null);
			}
										
		});
				
	},


	/*
	 * Add a recipient by push_id to the document's rcpts list.
	 */
	join: function( ctx, ret_handler ){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
				
		var rcpt = _.findWhere(ctx.doc.rcpts,{push_id:ctx.user.push_id});				
		if( !rcpt ){
			
			rcpt = {uid: "" + ctx.user._id, push_id:ctx.user.push_id, push_type:ctx.user.push_type || "gcm"};
			if( util.is_array(ctx.params.ev_types) ){
				rcpt.ev_types = ctx.params.ev_types;
			}else if( util.is_object(ctx.params.ev_types) && (ctx.params.ev_types.$push || ctx.params.ev_types.$set) ){
				
				rcpt.ev_types =  ctx.params.ev_types.$push || ctx.params.ev_types.$set;				
			}
						
			ctx.doc.rcpts.push(rcpt);							
			var doc = util.clone(ctx.doc);
			doc.wid = "" + doc._id;
			delete doc._id;
								
			ret_handler(null,doc);//send document back to recently joined user
			
		}else{	
			if(ctx.params.ev_types){
								
				if(util.is_array(ctx.params.ev_types)){
				
					rcpt.ev_types = ctx.params.ev_types;
				}else if( util.is_object(ctx.params.ev_types) && ctx.params.ev_types.$push ){
				
					rcpt.ev_types = rcpt.ev_types.concat( ctx.params.ev_types.$push );
				}else if( util.is_object(ctx.params.ev_types) && ctx.params.ev_types.$pop ){
					
					for(var j=0; j < 5 && j < ctx.params.ev_types.$pop;j++)
						rcpt.ev_types.pop();
				
				}else if( util.is_object(ctx.params.ev_types) && ctx.params.ev_types.$set  ){
					
					rcpt.ev_types = ctx.params.ev_types.$set;	
				}else if( util.is_object(ctx.params.ev_types) && ctx.params.ev_types.$remove  ){					
					
					rcpt.ev_types = _.reject(rcpt.ev_types,function(ev_type){
									
									return _.contains(ctx.params.ev_types.$remove, ev_type);
					});
				}
				ret_handler(null,CONST.OK());	
			}else{											
				ctx.config.save = CONST.DISABLE();
				ret_handler(null,CONST.OK());
			}
		}
																																																							
	},

	/*
	 * Remove a recipient by uid from the document's rcpts list.
	 */
	unjoin: function( ctx, ret_handler ){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
			
		//Remove user push_id from rcpts list
		ctx.doc.rcpts = _.reject(ctx.doc.rcpts,function(rcpt){
			
			return rcpt.push_id == ctx.user.push_id;
		});																																													
		
		ret_handler(null,CONST.OK());									
	
	},
		

	/*
	 * Remove a field from the document.
	 */
	remove: function(ctx, ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
						
		async.series([
		
		function(next){
			
			var modifier = {$unset:{}};
			modifier.$unset[ctx.params.fname] = 1;			
			
			db.update( ctx.params.catalog, ctx.params.wid, modifier ,function(err){
							
				next(err);									
			});
		},
		function(next){
			
			var last_subfield = ctx.params.fname.substring(ctx.params.fname.lastIndexOf(".")+1,ctx.params.fname.length);
			
			if( !util.is_number(last_subfield) ){
				next();
			}else{
				
				var modifier = {$pull:{}};
				modifier.$pull[ctx.params.fname.substring(0,ctx.params.fname.lastIndexOf("."))] = null;				
				
				db.update( ctx.params.catalog, ctx.params.wid, modifier ,function(err){
							
					next(err);									
				});						
			}						
		}],function(err){
												
			if(!err){
				
				ctx.config.save = CONST.DISABLE();	
				ret_handler(null, CONST.OK());											
			}else{				
				ret_handler(err,null);
			}
		});
																							
	},

	/*
	 * Set a value to the field or create it if not exists.
	 */
	set: function( ctx, ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
			
		var modifier = {$set:{}};
		modifier.$set[ctx.params.fname] = ctx.params.value;	
		
		db.update( ctx.params.catalog, ctx.params.wid, modifier ,function(err){
						
			if(!err){
								
				ctx.config.save = CONST.DISABLE();							
				ret_handler(null,CONST.OK());
			}else{
				ret_handler(err,null);
			}				
		});
											
	},


	/*
	 * Push a value to an array field.
	 */
	push: function(ctx, ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
						
		var modifier = {$push:{}};
		modifier.$push[ctx.params.fname] = ctx.params.value;	
		
		db.update( ctx.params.catalog, ctx.params.wid, modifier ,function(err){
						
			if(!err){				
				
				ctx.config.save = CONST.DISABLE();							
				ret_handler(null,CONST.OK());
			}else{
				ret_handler(err,null);
			}						
		});
																		
	},		


	/*
	 * Pops the last value of the array field in the document.
	 */
	pop: function(ctx, ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
										
		var modifier = {$pop:{}};
		modifier.$pop[ctx.params.fname] = 1;	
		
		db.update( ctx.params.catalog, ctx.params.wid, modifier ,function(err){
						
			if(!err){				
				
				ctx.config.save = CONST.DISABLE();							
				ret_handler(null,CONST.OK());
			}else{
				ret_handler(err,null);
			}
									
		});
																					
	},


	/*
	 * Pops the first value of the array field in the document.
	 */
	shift: function(ctx, ret_handler){			
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
														
		var modifier = {$pop:{}};
		modifier.$pop[ctx.params.fname] = -1;	
		
		db.update( ctx.params.catalog, ctx.params.wid, modifier ,function(err){
						
			if(!err){
				
				ctx.config.save = CONST.DISABLE();							
				ret_handler(null,CONST.OK());
			}else{
				ret_handler(err,null);
			}
									
		});
																			
	},

	
	/*
	 * get a whole document, some subfield or a set of subfields.
	 */
	get: function(ctx, ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
			
		var projection = {_id:0};		
		if( ctx.params.fname && typeof ctx.params.fname == "string"){
			
			projection[ctx.params.fname] = 1;
		}else if(ctx.params.fname && util.is_array(ctx.params.fname)){
			_.each(ctx.params.fname,function(field){
				
				projection[field] = 1; 
			});
		}else if(ctx.params.fname && util.is_object(ctx.params.fname))
			projection = ctx.params.fname;
		
		db.select(ctx.params.catalog, ctx.params.wid, projection, function(err,obj){
			
			if( obj && obj._id ){
				
				if(ctx.params.catalog == "users")
					obj.uid = "" + obj._id;
				else
					obj.wid = "" + obj._id;	
				delete obj._id;
			}
			
			ctx.config.save = CONST.DISABLE();
			ret_handler(err,obj);
			
		});
		
	},
			
	
	/*
	 * Search documents stored in a catalog matching a specific criteria, ex:	 
	 * db.waves.search( { loc:{$within:{$box:[[0,0],[3,42]]}}, $and:[{keywords:"busco"},{hashtags:"#mecanica2?"}] } )
	 * jsa.api.search({catalog:"waves",criteria:[{keywords:"profesor"},{hashtags:"#mecanica2"},{loc:{$within:{$box:[[0,0],[1,1]]}}}]});
	 */
	search: function(ctx,ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
			
		ctx.params.projection = ctx.params.projection || {}; 										
		db.criteria(ctx.params.catalog, ctx.params.criteria, {}, ctx.params.projection, function(err,docs){
						
			for( i=0, docs=docs||[]; i < docs.length; i++ ){
				
				if(ctx.params.catalog == "users")
					docs[i].uid = "" + docs[i]._id; 
				else
					docs[i].wid = "" + docs[i]._id;
				delete docs[i]._id;					
			}
									
			ctx.config.save = CONST.DISABLE();				
			ret_handler(err,docs);
		});
		
	},
	
	/*
	 * Route a message from origin user to end user. No db access. Can be used as a signalling mechanism.
	 * ex: user is writing signalling.. 
	 */
	signal: function(ctx,ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
							
		if(!util.is_array(ctx.params.uids))
			ctx.params.uids = [ctx.params.uids];
				
		var criteria = {$or:_.map(ctx.params.uids,function(uid){
			
			return {_id:uid};
		})};
				
		db.criteria("users", criteria, {},{push_id:1,push_type:1,_id:0},function(err,rcpts){
			
			if(err){
				
				ret_handler(err,null);
				return;	
			}else if(ctx.config.emit){
				
				ctx.payload = ctx.params.msg;
				emit("ev_api_signal",ctx, rcpts);
			}
			ctx.config.save = CONST.DISABLE();
			ctx.config.emit = CONST.DISABLE();
			ret_handler(null,1);
			
		});
				
	},
	
	/*
	 * Return server time back to the client to synchronize clocks.
	 */
	time: function(ctx, ret_handler){
		
		if(srv.config.app.debug)
			logger.debug("\nctx:\n" + nutil.inspect(ctx));
			
		ctx.config.save = CONST.DISABLE();
		ctx.config.emit = CONST.DISABLE();
		ret_handler(null,time.now());
	}

}
  
var srv = require("./server");	   	
	   

