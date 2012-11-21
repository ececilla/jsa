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
						ev_ctx:ctx								
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
 * front module (server.js) to local callers: $mod_name.api.docs.$proc_name(params, ret_handler);
 */

exports.remote = {
	
	/*
	 * Create a new document.	 
	 */
	create : function( ctx, ret_handler ){
							 						
		ctx.doc = util.clone(ctx.params.doc);				
		ctx.doc.uid = ctx.params.uid;
		ctx.doc.catalog = ctx.params.catalog;
		ctx.doc.rcpts = ctx.params.rcpts;	
		ctx.doc.ctime = time.now();
		if(ctx.params.ttl)					
			ctx.doc.etime = ctx.doc.ctime + ctx.params.ttl * CONST.MILLIS_IN_A_SECOND();		
		
																													
		db.save(ctx.doc.catalog, ctx.doc, function(err){
			
			if(!err){			
										
				ctx.doc.wid = "" + ctx.doc._id;
				delete ctx.doc._id;																															
				if(ctx.config.emit){
								
					ctx.payload = ctx.doc;
					emit( "ev_api_create", ctx );
				}								
				
				if(ctx.doc.etime){
											
					timers.start_timer({
										etime:ctx.doc.etime, 
										type_name:"expiring_doc", 
										data:{catalog:ctx.params.catalog, wid:ctx.doc.wid}}
									   );																																				
				}
				ctx.config.save = CONST.DISABLE();							
				ret_handler(null, ctx.doc);
																			
			}else						
				ret_handler(err,null);				
		});
										
	},

	/*
	 * Delete a document by id
	 */
	dispose : function(ctx, ret_handler){
	
		ctx.config.save = CONST.DISABLE();				
		db.removeById( ctx.params.catalog, ctx.params.wid, function(err, val){
							
			if(!err){
				if(ctx.config.emit){
				
					ctx.payload = ctx.params;
					emit( "ev_api_dispose", ctx );
				}
				ret_handler(null,CONST.OK());
			}else
				ret_handler(err,null);
										
		});
				
	},


	/*
	 * Add a recipient by uid to the document's rcpts list.
	 */
	join : function( ctx, ret_handler ){
						
		if(ctx.doc.rcpts.indexOf(ctx.params.uid) == -1 ){
						
			ctx.doc.rcpts.push(ctx.params.uid);				
			var doc = util.clone(ctx.doc);
			doc.wid = "" + doc._id;
			delete doc._id;
			ctx.user.wids.push(doc.wid);			
			ret_handler(null,doc);
			
		}else{	
														
			ret_handler(null,CONST.OK());
		}
																																																							
	},

	/*
	 * Remove a recipient by uid from the document's rcpts list.
	 */
	unjoin : function( ctx, ret_handler ){
																																													
		ctx.doc.rcpts.splice(ctx.doc.rcpts.indexOf(ctx.params.uid),1); //remove uid from rcpts list.
		ctx.user.wids.splice(ctx.user.wids.indexOf("" + ctx.doc._id));//remove wid from user wids list.
		ret_handler(null,CONST.OK());									
	
	},
		

	/*
	 * Remove a field from the document.
	 */
	remove : function(ctx, ret_handler){
																																																			
		util.del_field(ctx.doc, ctx.params.fname );
		ret_handler(null,CONST.OK());
																							
	},

	/*
	 * Set a value to the field or create it if not exists.
	 */
	set : function( ctx, ret_handler){
																
		util.set_field(ctx.doc, ctx.params.fname, ctx.params.value );
		ret_handler(null,CONST.OK());
											
	},



	/*
	 * Push a value to an array field.
	 */
	push : function(ctx, ret_handler){
																				
			var arr = util.get_field(ctx.doc,ctx.params.fname);									
			arr.push(ctx.params.value);
			ret_handler(null,CONST.OK());
																		
	},


	/*
	 * Pops the last value of the array field in the document.
	 */
	pop : function(ctx, ret_handler){
									
			var arr = util.get_field(ctx.doc,ctx.params.fname);																												
			arr.pop();
			ret_handler(null,CONST.OK());
																					
	},


	/*
	 * Pops the first value of the array field in the document.
	 */
	shift : function(ctx, ret_handler){			
													
				var arr = util.get_field(ctx.doc,ctx.params.fname);																
				arr.shift();
				ret_handler(null,CONST.OK());
																			
	},

	/*
	 * events ack procedure
	 */
	ack : function(params, ret_handler){
	
		if( !(params.uid && params.tstamp) ){
					
			ret_handler({code:-2, message:"Missing parameters:{uid:,tstamp:}"},null);
			return;		
		}
		
		emit("ev_api_ack", params);
		
		if(ret_handler)
			ret_handler(null,0);
					
	},
	
	/*
	 * get a document or subfield
	 */
	get: function(ctx, ret_handler){
		
		ctx.config.save = CONST.DISABLE();
		
		if(ctx.params.fname){
						
			ret_handler(null, util.get_field(ctx.doc, ctx.params.fname));
		}else{
			
			ctx.doc.wid = "" + ctx.doc._id;
			delete ctx.doc._id;
			ret_handler(null, ctx.doc);
		}	
	}

}
  
	   	
	   

