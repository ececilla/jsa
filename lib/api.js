/*
 * RPC-API to manipulate json documents on the server. These documents
 * are stored in a mongodb database.
 */

var db = require("./db");
var util  =require("./util");
var async = require("async");

var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();
	
/*
 * Namespace for public functions: all functions in the remote namespace
 * will be accessible as an rpc procedure to remote callers and made public to the 
 * front module (server.js) to local callers: $mod_name.api.docs.$proc_name(params, ret_handler);
 */
exports.remote = {};


/*
 * Namespace for initialization functions
 */
exports.init = {};

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
				
		return params.catalog == "docs";
				
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
exports.init.add_create_handler = function( create_handler ){
	
	_chandlers.unshift(create_handler);
}



/*
 * Register listeners to the rpc-api events so other modules can listen to what happens
 * to this module.
 * 
 */
exports.on = function( ev_type, ret_handler ){
	
	emitter.on(ev_type, function( params, rcpts ){
							
		ret_handler( {						
						ev_type:ev_type,
						ev_tstamp:new Date().getTime(),
						ev_data:params								
					 }, rcpts );
	});		
}

/*
 * emit an event as it was generated inside the api.
 */
var emit = exports.emit = function( ev_type, params, rcpts ){
	
	emitter.emit(ev_type, params, rcpts );
}



/*
 * Create a new document.
 * 
 * params.uid : document owner id. 
 * params.doc : doc object.
 * params.catalog: catalog name to store the document. (optional)
 */
exports.remote.create = function( params, ret_handler ){
		
	if(!params || !(params.uid && params.doc ) ){
		
		if(ret_handler)		
			ret_handler({code:-2, message:"Missing parameters:{uid:,doc:,(optional)catalog:}"},null);
		else
			throw new Error("Missing parameters:{uid:,doc:,(optional)catalog:}");
		return;					
	}
	 
	if( typeof params.doc !== "object"){
	
		if(ret_handler)		
			ret_handler({code:-2, message:"Wrong parameter type doc: must be an object"},null);
		else
			throw new Error("Wrong parameter doc: must be an object");
		return;
	} 
	
	if( params.catalog && params.catalog == "events"){
		
		if(ret_handler)		
			ret_handler({code:-2, message:"Cannot write to events catalog"},null);
		else
			throw new Error("Cannot write to events catalog");
		return;
	}
	
	params.doc.uid = params.uid;	
	params.catalog = params.catalog || "docs";
	
	if( is_notifying_doc(params) )
		params.doc.rcpts = [params.uid];
	
	async.series([
		function(next){
			 
			if(params.doc.rcpts && exports.rcpts){
				
				exports.rcpts( params.doc, {select:db.select}, function(rcpts){
										
					var idx = rcpts.indexOf(params.uid);
					if( idx != -1 )
						rcpts.splice(idx,1);
					params.doc.rcpts = params.doc.rcpts.concat(rcpts); 
					next();						
				});								
			}else
				next();							
		},
		function(next){ 
			
			params.doc.ctime = new Date().getTime();
			if(params.ttl)
				params.doc.etime = params.doc.ctime + params.ttl * 1000;	
								
			db.save(params.catalog, params.doc, function(err, doc){
				
				if(!err){			
					var id = "" + doc._id;																	
					emit( "ev_api_create", params );
					if(ret_handler)
						ret_handler(null, {wid:id});
					
					if(doc.etime){
						
						db.save("timers",{wid:id, catalog:params.catalog, etime:doc.etime},function(err,val){
							
							if(!err)
								util.start_expire_timer( {catalog:params.catalog, etime:doc.etime, wid:doc.wid} );
							else
								throw err;
						});
					}															
				}else
					if(ret_handler)
						ret_handler(err,null);				
			});
			next();
		}			
	]);
		
}


/*
 * Add a recipient by uid to the document's rcpts list.
 */
exports.remote.join = function( params, ret_handler ){
	
	if( !(params.wid && params.uid) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"},null);
		return;		
	}	
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}
	
	params.catalog = params.catalog || "docs";
	db.select(params.catalog, params.wid, function(err,doc){
		
		if(!err && doc){
			
			if( typeof doc.rcpts == "undefined" ){
				
				ret_handler({code:-7, message:"Not reportable document: @" + params.catalog + ":" + params.wid }, null);
				return;
										
			}else if( doc.rcpts.indexOf(params.uid) == -1 ){
				
				
				params.doc = doc;												
				emit( "ev_api_join", params );
																			
				doc.rcpts.push(params.uid); //add uid to rcpts list.
				db.save(params.catalog, doc, function(err, val){
										
					if(!err){
						delete doc.rcpts;									
						doc.wid = doc._id;
						delete doc._id;				
						ret_handler(null, {doc:doc});												
					}else
						ret_handler(err,null);				
				});	
			}else{	
							
				ret_handler(null,{reach:doc.rcpts.length}); //TODO: already joined.
				return;
			}	
		}else if(!err && !doc){
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);										
		}else
			ret_handler(err,null);
	});

}

/*
 * Remove a recipient by uid from the document's rcpts list.
 */
exports.remote.unjoin = function( params, ret_handler ){
	
	if( !(params.wid && params.uid) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,(optional)catalog:}"},null);
		return;		
	}
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}	
	
	params.catalog = params.catalog || "docs";
	
	db.select(params.catalog, params.wid, function(err,doc){
		
		if(!err && doc){
						
			if(!doc.rcpts){										
				
				ret_handler({code:-8, message:"Document @" + params.catalog + ":" + params.wid +" has no rcpts" }, null);
				return;
			}
			
			var idx = doc.rcpts.indexOf(params.uid);
			if( idx != -1 ){
																															
				doc.rcpts.splice(idx,1); //remove uid from rcpts list.
				db.save(params.catalog, doc, function(err, val){
										
					if(!err){
						
						params.doc = doc;												
						emit( "ev_api_unjoin", params );				
						ret_handler(null,0);												
					}else
						ret_handler(err,null);				
				});	
			}else{	
				ret_handler({code:-9, message:"uid " +  params.uid +  " not found: @" + params.catalog + ":" + params.wid+".rcpts" }, null);							
				return;
			}	
		}else if(!err && !doc){
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);										
		}else
			ret_handler(err,null);
	});

}


/*
 * Add a field to the document.
 */
exports.remote.add = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname && params.value != undefined ) ){ //value: default value
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,fname:,value:,(optional)catalog:}"},null);
		return;		
	}	
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}
	
	if( params.fname == "rcpts" || params.fname == "_id" || params.fname == "uid" ){
		
		ret_handler({code:-2, message:"Reserved word for field name: " + params.fname},null);
		return;
	}	
	
	params.catalog = params.catalog || "docs";//default catalog
	
	db.select(params.catalog, params.wid, function(err, doc){
		
		if(!err && doc){
			
			//Check access to this document
			if( !util.check_access(params,doc)){
				
				ret_handler({code:-3, message:params.uid + " has no access @"+ params.catalog +":"+ doc._id + ", must join first"},null);
				return;
			}
			
			//check field non-existence
			if( util.get_field(doc,params.fname) ){				
				
				ret_handler({code:-3, message:"Field '" + params.fname+  "' already exists @" + params.catalog+":" + params.wid},null);							
				
			}else{
				
				util.set_field( doc, params.fname, params.value );				
							
				db.save(params.catalog, doc, function(err,val){
										
					if(!err){
						
						params.doc = doc;
						emit("ev_api_add", params);
						ret_handler(null,0);
						
					}else
						ret_handler(err,null);	
				});
			}
		}else if(!err && !doc){
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);				
		}else
			ret_handler(err,null);
		
	});
	
}

/*
 * Remove a field from the document.
 */
exports.remote.remove = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname ) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,fname:,(optional)catalog:}"},null);
		return;		
	}
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}
	
	if( params.fname == "rcpts" || params.fname == "_id" || params.fname == "uid" ){
		
		ret_handler({code:-2, message:"Reserved word for field name: " + params.fname},null);
		return;
	}	
	
	params.catalog = params.catalog || "docs";
	
	db.select(params.catalog, params.wid, function(err, doc){
		
		if(!err && doc){
			
			//Check access to this document
			if( !util.check_access(params,doc)){
				
				ret_handler({code:-3, message:params.uid + " has no access @"+ params.catalog +":"+ doc._id + ", must join first"},null);
				return;
			}
			
			if( util.get_field(doc, params.fname) ){				
								
				util.del_field(doc, params.fname);
							
				db.save(params.catalog, doc, function(err,val){
					
					if(!err){
						
						params.doc = doc;
						emit("ev_api_rem", params);
						ret_handler(null,0);
						
					}else
						ret_handler(err,null);	
				});			
				
			}else
				ret_handler({code:-3, message:"Field '" + params.fname+  "' not exists @" + params.catalog + ":"+ params.wid},null);											
		}else if(!err && !doc){
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);				
		}else
			ret_handler(err,null);
		
	});
	
}

/*
 * Set a value to the field or create it if not exists.
 */
exports.remote.set = function( params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname && params.value != undefined ) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,fname:,value:,(optional)catalog:}"},null);
		return;		
	}
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}
	
	if( params.fname == "rcpts" || params.fname == "_id" || params.fname == "uid" ){
		
		ret_handler({code:-2, message:"Reserved word for field name: " + params.fname},null);
		return;
	}
	
	params.catalog = params.catalog || "docs";
	
	db.select(params.catalog, params.wid, function(err, doc){
		
		if(!err && doc){
			
			//Check access to this document
			if( !util.check_access(params,doc)){
				
				ret_handler({code:-3, message:params.uid + " has no access @"+ params.catalog +":"+ doc._id + ", must join first"},null);
				return;
			}
			
			if(util.get_field(doc,params.fname)){
														
				util.set_field(doc, params.fname, params.value );
								
				db.save(params.catalog, doc, function(err,val){
					
					if(!err){
						
						params.doc = doc;
						emit("ev_api_set", params);	
						ret_handler(null,0);
						
					}else
						ret_handler(err,null);	
				});
			}else
				ret_handler({code:-3, message:"Field '" + params.fname+  "' not exists @" + params.catalog + ":" + params.wid},null);
		}else if(!err && !doc)
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);				
		else
			ret_handler(err,null);
		
	});	
}


/*
 *  Increment integer value of a field.
 */
exports.remote.incr = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname ) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,fname:,(optional)catalog}"},null);
		return;		
	}
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}	

	params.catalog = params.catalog || "docs";

	db.select(params.catalog, params.wid, function(err, doc){
		
		if(!err && doc){
			
			//Check access to this document
			if( !util.check_access(params,doc)){
				
				ret_handler({code:-3, message:params.uid + " has no access @"+ params.catalog +":"+ doc._id + ", must join first"},null);
				return;
			}
			
			var value = util.get_field(doc,params.fname); 
			if( value ){
												
				//check if field is a number
				if(typeof value == "number"){				
					
					util.set_field( doc, params.fname, value + 1 );
					
				}else{
					ret_handler({code:-4, message:"Field '" + params.fname+  "' not a number"},null);
					return;
				}
								
				db.save(params.catalog, doc, function(err,val){
					
					if(!err){
						
						params.doc = doc;
						emit("ev_api_incr", params);
						ret_handler(null,0);
						
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field '" + params.fname+  "' not exists @" + params.catalog + ":" + params.wid},null);
		}else if(!err && !doc)
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);		
		else
			ret_handler(err,null);
		
	});		
		
}


/*
 * Decrement integer value of a field.
 */
exports.remote.decr = function( params, ret_handler ){
	
	if( !(params.wid && params.uid && params.fname ) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,fname:,(optional)catalog:}"},null);
		return;		
	}	
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}	


	params.catalog = params.catalog || "docs";

	db.select(params.catalog, params.wid, function(err, doc){
		
		if(!err && doc){
			
			//Check access to this document
			if( !util.check_access(params,doc)){
				
				ret_handler({code:-3, message:params.uid + " has no access @"+ params.catalog +":"+ doc._id + ", must join first"},null);
				return;
			}
			
			var value = util.get_field(doc, params.fname);
			if(value){
				
				//check if field is a number
				if(typeof value == "number"){				
					
					util.set_field(doc, params.fname, value-1);
				}else{
					ret_handler({code:-4, message:"Field '" + params.fname+  "' not a number"},null);
					return;
				}				
								
				db.save(params.catalog, doc, function(err,val){
					
					if(!err){
						
						params.doc = doc;
						emit("ev_api_decr", params);
						ret_handler(null,0);						
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field '" + params.fname+  "' not exists @" + params.catalog + ":" + params.wid},null);
		}else if(!err && !doc)
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);
		else
			ret_handler(err,null);	
	});	
		
}


/*
 * Push a value to an array field.
 */
exports.remote.push = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname  && params.value != undefined) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,fname:,value:,(optional)catalog:}"},null);
		return;		
	}	
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}	
	
	params.catalog = params.catalog || "docs";

	db.select(params.catalog, params.wid, function(err, doc){
		
		if(!err && doc){
			
			//Check access to this document
			if( !util.check_access(params,doc)){
				
				ret_handler({code:-3, message:params.uid + " has no access @"+ params.catalog +":"+ doc._id + ", must join first"},null);
				return;
			}
			
			var arr = util.get_field(doc,params.fname);
			if(arr){
												
				//check if field is an array, has push method.
				if(arr.push)				
					arr.push(params.value);
				else{
					ret_handler({code:-4, message:"Field '" + params.fname+  "' not an array"},null);
					return;
				}	
								
				db.save(params.catalog, doc, function(err,val){
					
					if(!err){
						
						params.doc = doc;
						emit("ev_api_push", params);
						ret_handler(null,0);
						
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field '" + params.fname+  "' not exists @" +  params.catalog + ":" + params.wid},null);
		}else if(!err && !doc)
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);
		else
			ret_handler(err,null);
		
	});		
	
}


/*
 * Pops the last value of the array field in the document.
 */
exports.remote.pop = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,fname:,(optional)catalog:}"},null);
		return;		
	}
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}

	params.catalog = params.catalog || "docs";

	db.select(params.catalog, params.wid, function(err, doc){
		
		if(!err && doc){
			
			//Check access to this document
			if( !util.check_access(params,doc)){
				
				ret_handler({code:-3, message:params.uid + " has no access @"+ params.catalog +":"+ doc._id + ", must join first"},null);
				return;
			}
			
			var arr = util.get_field(doc,params.fname);
			if(arr){
												
				//check if field is an array, has pop method?
				if(arr.pop)				
					arr.pop();
				else{
					ret_handler({code:-4, message:"Field '" + params.fname+  "' not an array"},null);
					return;
				}	
								
				db.save(params.catalog, doc, function(err,val){
					
					if(!err){
						
						params.doc = doc;
						emit("ev_api_pop", params);
						ret_handler(null,0);
						
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field '" + params.fname+  "' not exists @" + params.catalog + ":" + params.wid},null);
		}else if(!err && !doc)
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);
		else
			ret_handler(err,null);
		
	});			
}


/*
 * Pulls the first value of the array field in the document.
 */
exports.remote.pull = function(params, ret_handler){
	
	if( !(params.wid && params.uid && params.fname) ){
				
		ret_handler({code:-2, message:"Missing parameters:{wid:,uid:,fname:,(optional)catalog:}"},null);
		return;		
	}
	
	if( !( util.isHex(params.wid) && params.wid.length == 24) ){
		
		ret_handler({code:-2, message:"Identifier wid has wrong type"},null);
		return;		
	}		

	params.catalog = params.catalog || "docs";

	db.select(params.catalog, params.wid, function(err, doc){
		
		if(!err && doc ){
			
			//Check access to this document
			if( !util.check_access(params,doc)){
				
				ret_handler({code:-3, message:params.uid + " has no access @"+ params.catalog +":"+ doc._id + ", must join first"},null);
				return;
			}
			
			var arr = util.get_field(doc, params.fname);			
			if(arr){
												
				//check if field is an array
				if(arr.shift)				
					arr.shift();
				else{
					ret_handler({code:-4, message:"Field '" + params.fname+  "' not an array"},null);
					return;
				}	
								
				db.save(params.catalog, doc, function(err,val){
					
					if(!err){
						
						params.doc = doc;
						emit("ev_api_pull", params);
						ret_handler(null,0);
						
					}else
						ret_handler(err,null);	
				});								
			}else
				ret_handler({code:-3, message:"Field '" + params.fname+  "' not exists @" + params.catalog + ":" + params.wid},null);
		}else if(!err && !doc)
			ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);
		else
			ret_handler(err,null);
		
	});			
}

/*
 * events ack procedure
 */
exports.remote.ack = function(params, ret_handler){

	if( !(params.uid && params.tstamp) ){
				
		ret_handler({code:-2, message:"Missing parameters:{uid:,tstamp:}"},null);
		return;		
	}
	
	emit("ev_api_ack", params);
	
	if(ret_handler)
		ret_handler(null,0);
				
}



