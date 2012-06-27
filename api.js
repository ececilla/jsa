/*
 * RPC-API to manipulate json documents on the server. These documents
 * are stored in a mongodb database.
 */

var db = require("./db");

var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();
	
/*
 * Namespace for public functions: all functions in this namespace
 * will be accessible as a rpc procedure.
 */
exports.remote = {};	
			

/*
 * Register listeners to the rpc-api events using a delegation pattern for EventEmitter.
 * 
 */
exports.on = function( ev_type, ret_handler ){
	
	emitter.on(ev_type, function( params ){
							
		ret_handler( {						
						ev_type:ev_type,
						ev_tstamp:new Date().getTime(),
						ev_data:params								
					 } );
	});		
}


/*
 * Create a new document.
 */
exports.remote.create = function( params, ret_handler ){
	
	if( !(params.uid && params.doc) ){
				
		ret_handler({code:-2, message:"Missing parameters:(uid,doc)"},null);
		return;		
	}
	
	params.doc.rcpts = [ params.uid ];
	db.save("docs", params.doc, function(err, val){
		
		if(!err){			
						
			ret_handler(null, {wid:""+val._id});			
			emitter.emit( "ev_create", params);			
		}else
			ret_handler(err,null);				
	});		
}


/*
 * Add a recipient to the document.
 */
exports.remote.join = function( params, ret_handler ){
	
	if( !(params.wid && params.uid) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid)"},null);
		return;		
	}	
	
	db.select("docs",params.wid, function(err,obj){
		
		if(!err){
			
			if( obj.rcpts.indexOf(params.uid) == -1 )
				obj.rcpts.push(params.uid);
			else{
				ret_handler(null,{reach:obj.rcpts.length});
				return;
			}	
			
			params.doc = obj;
			db.save("docs", obj, function(err, val){
				
				if(!err){			
										
					ret_handler(null, {reach:obj.rcpts.length});			
					emitter.emit( "ev_join", params);			
				}else
					ret_handler(err,null);				
			});	
		}else
			ret_handler(err,null);
	});

}

/*
 * Add a field to the document.
 */
exports.remote.add = function(params, ret_handler){

	if( !(params.wid && params.uid && params.fname ) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid,fname)"},null);
		return;		
	}	
	
	db.select("docs", params.wid, function(err, obj){
		
		if(!err){
			
			if(obj[params.fname]){				
				
				ret_handler({code:-3, message:"Field " + params.fname+  " already exists @" + params.wid},null);			
				
			}else{
				
				obj[params.fname] = {};
				params.doc = obj;
				db.save("docs", obj, function(err,val){
					
					if(!err){
						ret_handler(null,0);
						emitter.emit("ev_add", params);
					}else
						ret_handler(err,null);	
				});
			}
						
		}else
			ret_handler(err,null);
		
	});
	
}

/*
 * Remove a field from the document.
 */
exports.remote.remove = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname ) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid,fname)"},null);
		return;		
	}	
	
	db.select("docs", params.wid, function(err, obj){
		
		if(!err){
			
			if(obj[params.fname]){				
				
				delete obj[params.fname];
				params.doc = obj;
				db.save("docs", obj, function(err,val){
					
					if(!err){
						ret_handler(null,0);
						emitter.emit("ev_rem", params);
					}else
						ret_handler(err,null);	
				});			
				
			}else
				ret_handler({code:-3, message:"Field " + params.fname+  " does not exist @" + params.wid},null);											
						
		}else
			ret_handler(err,null);
		
	});
	
}

/*
 * Set a value to the field or create it if not exists.
 */
exports.remote.set = function( params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname && params.value ) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid,fname,value)"},null);
		return;		
	}
	
	db.select("docs", params.wid, function(err, obj){
		
		if(!err){
			
			if(obj[params.fname]){
							
				obj[params.fname] = params.value;
				params.doc = obj;
				db.save("docs", obj, function(err,val){
					
					if(!err){
						ret_handler(null,0);
						emitter.emit("ev_set", params);
					}else
						ret_handler(err,null);	
				});
			}else
				ret_handler({code:-3, message:"Field " + params.fname+  " does not exist @" + params.wid},null);
						
		}else
			ret_handler(err,null);
		
	});	
}


/*
 *  Increment integer value of a field.
 */
exports.remote.incr = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname ) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid,fname)"},null);
		return;		
	}	

	db.select("docs", params.wid, function(err, obj){
		
		if(!err){
			if(obj[params.fname]){
				
				obj[params.fname]++;
				params.doc = obj;
				db.save("docs", obj, function(err,val){
					
					if(!err){
						ret_handler(null,0);
						emitter.emit("ev_incr", params);
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field " + params.fname+  " does not exist @" + params.wid},null);
		}else
			ret_handler(err,null);
		
	});		
		
}


/*
 * Decrement integer value of a field.
 */
exports.remote.decr = function( params, ret_handler ){
	
	if( !(params.wid && params.uid && params.fname ) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid,fname)"},null);
		return;		
	}	

	db.select("docs", params.wid, function(err, obj){
		
		if(!err){
			if(obj[params.fname]){
				
				obj[params.fname]--;
				params.doc = obj;
				db.save("docs", obj, function(err,val){
					
					if(!err){
						ret_handler(null,0);
						emitter.emit("ev_decr", params);
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field " + params.fname+  " does not exist @" + params.wid},null);
		}else
			ret_handler(err,null);	
	});	
		
}


/*
 * Push a value to an array field.
 */
exports.remote.push = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname  && params.value) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid,fname,value)"},null);
		return;		
	}	

	db.select("docs", params.wid, function(err, obj){
		
		if(!err){
			if(obj[params.fname]){
				
				//check if field is an array
				if(obj[params.fname].push)				
					obj[params.fname].push(params.value);
				else{
					ret_handler({code:-4, message:"Field '" + params.fname+  "' not an array"},null);
					return;
				}	
				
				params.doc = obj;
				db.save("docs", obj, function(err,val){
					
					if(!err){
						ret_handler(null,0);
						emitter.emit("ev_push", params);
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field " + params.fname+  " does not exist @" + params.wid},null);
		}else
			ret_handler(err,null);
		
	});		
	
}


/*
 * Pops the last value of the array field in the document.
 */
exports.remote.pop = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid,fname)"},null);
		return;		
	}	

	db.select("docs", params.wid, function(err, obj){
		
		if(!err){
			if(obj[params.fname]){
				
				//check if field is an array, has pop method?
				if(obj[params.fname].pop)				
					obj[params.fname].pop();
				else{
					ret_handler({code:-4, message:"Field '" + params.fname+  "' not an array"},null);
					return;
				}	
				
				params.doc = obj;
				db.save("docs", obj, function(err,val){
					
					if(!err){
						ret_handler(null,0);
						emitter.emit("ev_pop", params);
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field " + params.fname+  " does not exist @" + params.wid},null);
		}else
			ret_handler(err,null);
		
	});			
}


/*
 * Pulls the first value of the array field in the document.
 */
exports.remote.pull = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname) ){
				
		ret_handler({code:-2, message:"Missing parameters:(wid,uid,fname)"},null);
		return;		
	}	

	db.select("docs", params.wid, function(err, obj){
		
		if(!err){
			if(obj[params.fname]){
				
				//check if field is an array
				if(obj[params.fname].shift)				
					obj[params.fname].shift();
				else{
					ret_handler({code:-4, message:"Field '" + params.fname+  "' not an array"},null);
					return;
				}	
				
				params.doc = obj;
				db.save("docs", obj, function(err,val){
					
					if(!err){
						ret_handler(null,0);
						emitter.emit("ev_pull", params);
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field " + params.fname+  " does not exist @" + params.wid},null);
		}else
			ret_handler(err,null);
		
	});			
}




