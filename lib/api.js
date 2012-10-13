/*
 * RPC-API to manipulate json documents on the server. These documents
 * are stored in a mongodb database.
 */

var db = require("./db");
var util  =require("./util");
var time = require("./time");
var async = require("async");

var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();
	
/*
 * Namespace for initialization functions
 */
exports.config = {};

/*
 * Setup the initial list of rcpts for a document. This logic must be provided  outside
 * the api and will be invoked inside the create procedure. If not function is provided the 
 * initial list of rcpts is set to a single recipient: the owner of the document.
 * Ex:
 * 
 * var api = require("./api");
 * api.init.rcpts = function(doc,db_ro, ret_handler){ret_handler([620793111]);};
 * 
 * 
 */	
exports.rcpts = null;


/*
 * create_handler list with a default handler: generate events for all documents within docs catalog.
 */
var _chandlers = [
	
	function( params ){
		
		if( params.notifiable == undefined )
			return params.catalog == "docs";
		else	
			return params.notifiable;

}];	


function is_notifying_doc( params ){
	
	for (i in _chandlers){
		if( _chandlers[i](params) )
			return true;
	}	
}

/*
 * Add a create handler to the handlers list. These create_handler functions decide whether or not
 * the document should generate ev_api_create event.
 */
exports.config.add_create_handler = function( create_handler ){
	
	_chandlers.unshift(create_handler);
}



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
	 * 	 
	 */
	create : function( ctx, ret_handler ){
							 						
		ctx.doc = util.clone(ctx.params.doc);				
		ctx.doc.uid = ctx.params.uid;
		ctx.doc.catalog = ctx.params.catalog;	
		ctx.doc.ctime = time.now();
		if(ctx.params.ttl)					
			ctx.doc.etime = ctx.doc.ctime + ctx.params.ttl * 1000;		
		
		if( is_notifying_doc(ctx.params) )
			ctx.doc.rcpts = [ctx.params.uid];
		
		async.series([
			function(next){
				 
				if(ctx.doc.rcpts && exports.rcpts){
					
					exports.rcpts( ctx.doc, function(rcpts){
											
						var idx = rcpts.indexOf(ctx.doc.uid);
						if( idx != -1 )
							rcpts.splice(idx,1);
						ctx.doc.rcpts = ctx.doc.rcpts.concat(rcpts); 
						next();						
					});								
				}else
					next();							
			},
			function(next){ 														
													
				db.save(ctx.doc.catalog, ctx.doc, function(err){
					
					if(!err){			
												
						ctx.doc.wid = "" + ctx.doc._id;
						delete ctx.doc._id;																											
						emit( "ev_api_create", ctx );
						ctx.config.save = 0;							
						ret_handler(null, {doc:ctx.doc});
						
						if(ctx.doc.etime){
																										
								time.create_remove_timer( {tid:ctx.doc.wid, etime:ctx.doc.etime, data:{catalog:ctx.params.catalog}} );												
						}															
					}else						
						ret_handler(err,null);				
				});
				
				next();
			}			
		]);
		
	},

	/*
	 * Delete a document by id
	 */
	dispose : function(ctx, ret_handler){
	
		ctx.config.save = 0;					
		db.removeById( ctx.params.catalog, ctx.params.wid, function(err, val){
							
			if(!err){
				
				emit( "ev_api_dispose", ctx );
				ret_handler(null,val);
			}else
				ret_handler(err,null);
										
		});
				
	},


	/*
	 * Add a recipient by uid to the document's rcpts list.
	 */
	join : function( ctx, ret_handler ){
															
		ctx.doc.rcpts.push(ctx.params.uid);		
		db.save(ctx.doc.catalog, ctx.doc, function(err){
				
			if(!err){			
										
				ctx.doc.wid = "" + ctx.doc._id;
				delete ctx.doc._id;																										
				emit( "ev_api_join", ctx );
				ctx.config.save = 0;							
				ret_handler(null, {doc:ctx.doc});
																								
			}else						
				ret_handler(err,null);				
		});
																																																							
	},

	/*
	 * Remove a recipient by uid from the document's rcpts list.
	 */
	unjoin : function( ctx, ret_handler ){
				
																																										
			ctx.doc.rcpts.splice(ctx.doc.rcpts.indexOf(ctx.params.uid),1); //remove uid from rcpts list.
			ret_handler(null,1);									
	
	},


	/*
	 * Add a field to the document.
	 */
	add : function(ctx, ret_handler){
		
			//required(wid,uid,fname,value)
			//reserved(rcpts,_id,uid)
			//in_rcpts
			//not_exists
					
																				
			util.set_field( ctx.doc, ctx.params.fname, ctx.params.value );
			ret_handler(null,1);													
		
	},

	/*
	 * Remove a field from the document.
	 */
	remove : function(ctx, ret_handler){
		
			//param required(wid,uid,fname)
			//reserved(rcpts,_id,uid)
			//type required(object)
																															
			try{										
				util.del_field(ctx.doc, ctx.params.fname, ctx.params.index );
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
		
			//required(wid,uid,fname,value)
			//reserved(rcpts,_id,uid)
						
						
			try{										
				util.set_field(ctx.doc, ctx.params.fname, ctx.params.value, ctx.params.index );
				ret_handler(null,1);
			}catch(err){
				
				ret_handler({code:-3, message:err.message},null);				
			}			
					
	},



	/*
	 * Push a value to an array field.
	 */
	push : function(ctx, ret_handler){
		
			//required(wid,uid,fname,value)
			//field_exists()
													
			//check if field is an array, has push method.
			if(arr.push)				
				arr.push(params.value);
			else{
				
				ret_handler({code:-4, message:"Wrong type: #" + ctx.params.catalog + "/" + ctx.params.wid + "[" + ctx.params.fname + "] not array"},null);				
			}	
														
	},


	/*
	 * Pops the last value of the array field in the document.
	 */
	pop : function(ctx, ret_handler){
						
				
			var arr = util.get_field(ctx.doc,ctx.params.fname);
															
			//check if field is an array, has pop method?
			if(arr.pop)				
				arr.pop();
			else{
				ret_handler({code:-4, message:"Wrong type: #" + ctx.params.catalog + "/" + ctx.params.wid + "[" + ctx.params.fname + "] not array"},null);
				return;
			}
																		
	},


	/*
	 * Pulls the first value of the array field in the document.
	 */
	shift : function(ctx, ret_handler){			
													
				var arr = util.get_field(ctx.doc,ctx.params.fname);
				
				//check if field is an array
				if(arr.shift)				
					arr.shift();
				else{
					ret_handler({code:-4, message:"Wrong type: #" + ctx.params.catalog + "/" + ctx.params.wid + "[" + ctx.params.fname + "] not array"},null);
					return;
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
					
	}

}

