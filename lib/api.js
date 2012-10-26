/*
 * RPC-API to manipulate json documents on the server. These documents
 * are stored in a mongodb database.
 */
//TODO: test all api methods from cli interface checking all constraints and return values.
var db = require("./db");
var util  =require("./util");
var time = require("./time");
var async = require("async");
//var sandbox = require("./sandbox");
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
			ctx.doc.etime = ctx.doc.ctime + ctx.params.ttl * 1000;		
		
																													
		db.save(ctx.doc.catalog, ctx.doc, function(err){
			
			if(!err){			
										
				ctx.doc.wid = "" + ctx.doc._id;
				delete ctx.doc._id;																															
				if(ctx.config.emit){
								
					ctx.payload = ctx.doc;
					emit( "ev_api_create", ctx );
				}
				
				ctx.config.save = 0;//indicate sandbox not to save doc							
				ret_handler(null, ctx.doc);
				
				if(ctx.doc.etime){
																								
						time.create_remove_timer( {tid:ctx.doc.wid, etime:ctx.doc.etime, data:{catalog:ctx.params.catalog}} );												
				}															
			}else						
				ret_handler(err,null);				
		});
										
	},

	/*
	 * Delete a document by id
	 */
	dispose : function(ctx, ret_handler){
	
		ctx.config.save = 0;					
		db.removeById( ctx.params.catalog, ctx.params.wid, function(err, val){
							
			if(!err){
				if(ctx.config.emit){
				
					ctx.payload = ctx.params;
					emit( "ev_api_dispose", ctx );
				}
				ret_handler(null,val);
			}else
				ret_handler(err,null);
										
		});
				
	},


	/*
	 * Add a recipient by uid to the document's rcpts list.
	 */
	join : function( ctx, ret_handler ){
		
		ctx.config.save = 0;
		
		if(ctx.doc.rcpts.indexOf(ctx.params.uid) == -1 ){
			
			
			ctx.doc.rcpts.push(ctx.params.uid);					
			db.save(ctx.doc.catalog, ctx.doc, function(err){
					
				if(!err){			
											
					ctx.doc.wid = "" + ctx.doc._id;
					delete ctx.doc._id;	
					if(ctx.config.emit){																									
					
						ctx.payload = ctx.params;
						emit( "ev_api_join", ctx );
					}											
					ret_handler(null, ctx.doc);
																									
				}else						
					ret_handler(err,null);				
			});
			
		}else{	
														
			ret_handler(null,1);
		}
																																																							
	},

	/*
	 * Remove a recipient by uid from the document's rcpts list.
	 */
	unjoin : function( ctx, ret_handler ){
																																													
			ctx.doc.rcpts.splice(ctx.doc.rcpts.indexOf(ctx.params.uid),1); //remove uid from rcpts list.
			ret_handler(null,1);									
	
	},
		

	/*
	 * Remove a field from the document.
	 */
	remove : function(ctx, ret_handler){
		
																																		
			try{										
				util.del_field(ctx.doc, ctx.params.fname );
				ret_handler(null,1);
				
			}catch(err){
				
				ret_handler({code:-3, message:err.message},null);
				return;
			}				
													
	},

	/*
	 * Set a value to the field or create it if not exists.
	 */
	set : function( ctx, ret_handler){
																
			util.set_field(ctx.doc, ctx.params.fname, ctx.params.value );
			ret_handler(null,1);
											
	},



	/*
	 * Push a value to an array field.
	 */
	push : function(ctx, ret_handler){
																				
			var arr = util.get_field(ctx.doc,ctx.params.fname);									
			arr.push(ctx.params.value);
			ret_handler(null,1);
				
														
	},


	/*
	 * Pops the last value of the array field in the document.
	 */
	pop : function(ctx, ret_handler){
									
			var arr = util.get_field(ctx.doc,ctx.params.fname);																		
			
			if(arr.pop){//check if field is an array, has pop method.				
				arr.pop();
				ret_handler(null,1);
			}else{
				
				ret_handler({code:-4, message:"Wrong type: #" + ctx.params.catalog + "/" + ctx.params.wid + ":" + ctx.params.fname + " not array"},null);
				
			}
																		
	},


	/*
	 * Pops the first value of the array field in the document.
	 */
	shift : function(ctx, ret_handler){			
													
				var arr = util.get_field(ctx.doc,ctx.params.fname);
								
				if(arr.shift){//check if field is an array				
					arr.shift();
					ret_handler(null,1);
				}else{
				
					ret_handler({code:-4, message:"Wrong type: #" + ctx.params.catalog + "/" + ctx.params.wid + ":" + ctx.params.fname + " not array"},null);
				
				}	
														
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
		
		ctx.config.save = 0;
		
		if(ctx.params.fname){			
			ret_handler(null, util.get_field(ctx.doc, ctx.params.fname));
		}else{
			ctx.doc.wid = "" + ctx.doc._id;
			delete ctx.doc._id;
			ret_handler(null, ctx.doc);
		}	
	}

}
  
	   	
	   

