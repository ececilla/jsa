/*
 * RPC-API to manipulate json documents on the server. These documents
 * are stored in a mongodb database.
 */

var db = require("./db");
var util  =require("./util");
var time = require("./time");
var timers = require("./timers");
var async = require("async");
var CONST = require("./constants");

var _ = require("underscore");

var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();
	
/*
 * Register listeners to the rpc-api events so other modules can listen to what happens
 * to this module.
 * 
 */
exports.on = function( ev_type, ret_handler ){
	
	emitter.on(ev_type, function( ctx, rcpts ){
							
		ret_handler( {						
						ev_type:ev_type,
						ev_tstamp: time.now(),
						ev_ctx:util.clone(ctx)								
					 }, rcpts );
	});		
}

/*
 * emit an event as it was generated inside the api.
 */
var emit = exports.emit = function( ev_type, ctx, rcpts ){
	
	emitter.emit(ev_type, ctx, rcpts );
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
		
		ctx.doc = util.clone(ctx.params.user);
		if(ctx.doc.password)//if password param is supplied change it for its md5 hashstring.
			ctx.doc.password = util.hash(ctx.doc.password);
		ctx.doc.wids = [];	
		ctx.doc.ctime = time.now();
		ctx.doc.utime = ctx.doc.ctime;							
		ctx.params.catalog = "users";						
		
		db.save("users", ctx.doc, function(err){
					
			if(err)
				ret_handler(err,null);
			else{	
				ctx.doc.uid = "" + ctx.doc._id;
				delete ctx.doc._id;
				delete ctx.doc.wids;
				if(ctx.config.emit){
					
					ctx.payload = ctx.doc; 
					emit( "ev_api_register", ctx );					
				}	
				
				ctx.config.save = CONST.DISABLE();		
				ctx.config.emit = CONST.DISABLE();					
				ret_handler(null,ctx.doc);
			}	
		});				
	},
	
	/*
	 * Create a new document.	 
	 */
	create: function( ctx, ret_handler ){
							 						
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
			function(next){//update user wids list
								
				ctx.user.wids.push(ctx.doc.wid);
				db.save("users",ctx.user,function(err){
					
					if(err)
						next(err);
					else
						next();	
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
											
					timers.start_timer({
										etime:ctx.doc.etime, 
										type_name:"expiring_doc", 
										data:{catalog:ctx.params.catalog, wid:ctx.doc.wid}
										});																																				
				}
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
	 */
	dispose: function(ctx, ret_handler){
						
		db.removeById( ctx.params.catalog, ctx.params.wid, function(err, val){
							
			if(!err){
				if(ctx.config.emit){
				
					ctx.payload = ctx.params;
					emit( "ev_api_dispose", ctx );					
				}
				
				ctx.config.save = CONST.DISABLE();			
				ctx.config.emit = CONST.DISABLE();
				ret_handler(null,CONST.OK());
			}else
				ret_handler(err,null);
										
		});
				
	},


	/*
	 * Add a recipient by push_id to the document's rcpts list.
	 */
	join: function( ctx, ret_handler ){
			
		var rcpt = _.findWhere(ctx.doc.rcpts,{push_id:ctx.user.push_id});				
		if( !rcpt ){
			
			rcpt = {uid: "" + ctx.user._id, push_id:ctx.user.push_id, push_type:ctx.user.push_type || gcm};
			if( util.is_array(ctx.params.ev_types) ){
				rcpt.ev_types = ctx.params.ev_types;
			}else if( util.is_object(ctx.params.ev_types) && (ctx.params.ev_types.$push || ctx.params.ev_types.$set) ){
				
				rcpt.ev_types =  ctx.params.ev_types.$push || ctx.params.ev_types.$set;				
			}
						
			ctx.doc.rcpts.push(rcpt);							
			var doc = util.clone(ctx.doc);
			doc.wid = "" + doc._id;
			delete doc._id;
			ctx.user.wids.push(doc.wid);			
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
		
		//Remove user push_id from rcpts list
		ctx.doc.rcpts = _.reject(ctx.doc.rcpts,function(rcpt){
			
			return rcpt.push_id == ctx.user.push_id;
		});																																													
		
		//Remove document wid from user wids list		
		ctx.user.wids = _.reject(ctx.user.wids, function(wid){
			
			return wid == "" + ctx.doc._id;
		});
				
		ret_handler(null,CONST.OK());									
	
	},
		

	/*
	 * Remove a field from the document.
	 */
	remove: function(ctx, ret_handler){
		
		var obj = util.get_field(ctx.doc, ctx.params.fname);
		if(util.is_array(obj)){
			if(ctx.params.value !== undefined){
				obj = _.reject(obj,function(elem){
					
					return elem == ctx.params.value;
				});
				util.set_field(ctx.doc, ctx.params.fname, obj);
			}else
				util.del_field(ctx.doc, ctx.params.fname );
		}else																																																	
			util.del_field(ctx.doc, ctx.params.fname );
		
		ret_handler(null,CONST.OK());
																							
	},

	/*
	 * Set a value to the field or create it if not exists.
	 */
	set: function( ctx, ret_handler){
		
		if(util.is_array(ctx.params.fname)){
						
			_.each(ctx.params.fname,function(cfname){
				
				util.set_field(ctx.doc, cfname, ctx.params.value);
			});
			
		}else														
			util.set_field(ctx.doc, ctx.params.fname, ctx.params.value );
		ret_handler(null,CONST.OK());
											
	},



	/*
	 * Push a value to an array field.
	 */
	push: function(ctx, ret_handler){
																				
			var arr = util.get_field(ctx.doc,ctx.params.fname);									
			arr.push(ctx.params.value);
			ret_handler(null,CONST.OK());
																		
	},


	/*
	 * Pops the last value of the array field in the document.
	 */
	pop: function(ctx, ret_handler){
									
			var arr = util.get_field(ctx.doc,ctx.params.fname);																												
			arr.pop();
			ret_handler(null,CONST.OK());
																					
	},


	/*
	 * Pops the first value of the array field in the document.
	 */
	shift: function(ctx, ret_handler){			
													
				var arr = util.get_field(ctx.doc,ctx.params.fname);																
				arr.shift();
				ret_handler(null,CONST.OK());
																			
	},

	
	/*
	 * get a whole document, some subfield or a set of subfields.
	 */
	get: function(ctx, ret_handler){
		
				
		ctx.config.save = CONST.DISABLE();
		if(ctx.params.fname){//get field/s from document
			
			if(util.is_array(ctx.params.fname)){ //get all fields passed in and build an structure
				
				var ret_value = {};
				_.each(ctx.params.fname,function(cfname){
					
					var ivalue = util.get_field(ctx.doc, cfname);
					if(ivalue != undefined)
						util.set_field(ret_value, cfname, ivalue);
				});				
				ret_handler(null,ret_value);
			}else						
				ret_handler(null, util.get_field(ctx.doc, ctx.params.fname));
		}else{//get whole document.
			
			if(ctx.params.catalog == "users")
				ctx.doc.uid = "" + ctx.doc._id;
			else
				ctx.doc.wid = "" + ctx.doc._id;			
			delete ctx.doc._id;
			ret_handler(null, ctx.doc);
		}
		
	},
			
	
	/*
	 * Search documents stored in a catalog matching a specific criteria, ex:	 
	 * db.waves.search( { loc:{$within:{$box:[[0,0],[3,42]]}}, $and:[{keywords:"busco"},{hashtags:"#mecanica2?"}] } )
	 * jsa.api.search({catalog:"waves",criteria:[{keywords:"profesor"},{hashtags:"#mecanica2"},{loc:{$within:{$box:[[0,0],[1,1]]}}}]});
	 */
	search: function(ctx,ret_handler){
												
		db.criteria(ctx.params.catalog, ctx.params.criteria, {}, function(err,docs){
						
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
						
		if(!util.is_array(ctx.params.uids))
			ctx.params.uids = [ctx.params.uids];
		
		var rcpts = [];			
		async.forEachSeries(ctx.params.uids,function(cuid,next){
			
			db.select("users", cuid, function(err,user){
				
				rcpts.push({push_id:user.push_id, push_type:user.push_type});	
				next(err);
			});
			
		},function(err){
			
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
		
	}

}
  
	   	
	   

