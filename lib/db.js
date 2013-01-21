var mongo = require("mongodb");
var async = require("async");

exports.driver = db = null; 


/*
 * Test and create db catalogs if not exists based on config object.
 */
exports.prepare = function( db_config, end_handler ){
	
	checkdb();
	
	var catalogs = db_config.system_catalogs.concat(db_config.user_catalogs);
	async.series(
	[	
	function(next){//create system and user collections.
		async.forEach(catalogs,function(catalog_name,next){
			
			db.collection( catalog_name, function(err, collection){
				
				if( !collection ){
					
					db.createCollection( catalog_name, function(err, collection){
							
						if(err)
							throw err;
						else	
							next();		
					});
				}else
					next();	
			});
				
		},function(err){
						
			next(err);
		});
	},
	function(next){//create journal index
		
		db.collection("events", function(err,collection){
			
			collection.ensureIndex("ev_data.wid",{unique:false},function(err){
				next(err);
			});
		});
	},
	function(next){//create users index.
		
		db.collection("users", function(err,collection){
			
			collection.ensureIndex("uid",{unique:false},function(err){
				next(err);
			});
		});		
	}
	],function(err){
		
		end_handler(err, catalogs);
	});
	
}



/*
 * Close connection to db
 */
exports.close = function(){
	
	db && db.close();
	db = null;
}

/*
 * Connect to db before any other db operation.
 */
exports.connect = function( params, ret_handler ){
			
	if( db ){
			
		db.close();
	}
	
	params = params || {};
	params.dbhost = params.dbhost || "localhost";
	params.dbport = params.dbport || 27017;
	params.dbname = params.dbname || "jsa";
	
	exports.driver = db = new mongo.Db(params.dbname, new mongo.Server(params.dbhost,params.dbport,{auto_reconnect:true, socketOptions:{timeout:5000}}),{strict:true, safe:true}); //,poolSize:5,socketOptions:{timeout:1}
	
	db.open( function(err, client){	
    	
		if(client){			
			if( params.dbuser !== undefined && params.dbpass !== undefined ){
			
				db.authenticate(params.dbuser,params.dbpass,function(err,client){
					
					if(client){
						console.log('**MongoDb driver auth-connected');						
						if(ret_handler)
							ret_handler(null,1);						
					}else{
						
						db = null; 						
						if(ret_handler)
							ret_handler(err,0);
					}	
				});	
			}else{								
				if(ret_handler)
					ret_handler(null,1);					
			}												
		}else{
			
			db = null;					
			if(ret_handler)
				ret_handler(err,0);	
		}
					
	});
		
}


/*
 * Check db availability before any db operation.
 */
function checkdb(){
	
	if( !db )
		throw new Error("Driver not connected, should call connect first.");
}


/*
 * Save object to db. 
 *
 */
var save = exports.save = function( col_name, obj, ret_handler ){
    
    checkdb();     
    			
	db.collection(col_name, function(err, collection){
	    
	    collection.save( obj, {safe:true}, function(err, val){		
			
			if( !err )				
			    	ret_handler( null, val);			    			    		
			else	
				ret_handler(err,null);				 		    
	    });
	});
 
}


/*
 * Retrieve object from db by ID. 
 *
 */
var select = exports.select = function( col_name, id_str, ret_handler ){

    checkdb(); 
       
	db.collection( col_name, function(err, collection){
		
		if(err){
			
			ret_handler(err,null);
			return;
		}

	    var ObjectID = require('mongodb').ObjectID;	 
	    collection.findOne({_id:new ObjectID(id_str)},{_noload:0},function(err, object){
						
			if( !err ) 
			    ret_handler( null,object );
			else
				ret_handler(err,null);
	    });	    
	}); 

}


/*
 * Funcion para seleccionar documentos de la bbdd.
 */
var criteria = exports.criteria = function( col_name, criteria, order_field, ret_handler ){

  	checkdb();
  	
	db.collection( col_name, function(err, collection){    
	    	    
    	collection.find(criteria,{}).sort(order_field).toArray(function(err, objects){
							
			if(!err)
				ret_handler(null,objects);
			else				 
				ret_handler( err, null );
		});	    
		    
	});
}



/*
 * Remove object from db by ID.
 */
var removeById = exports.removeById = function( col_name, id_str, ret_handler){
	
	checkdb();
	
	db.collection( col_name, function(err, collection){
		
		if(err){
			
			ret_handler(err,null);
			return;
		}
	    	
	    var ObjectID = require('mongodb').ObjectID;	  
	    collection.remove( {_id:new ObjectID(id_str)} ,{safe:true},function(err, n){
	    	
			if( ret_handler )						
				if( !err ) 
				    ret_handler( null, n );				    
			    else 
			    	ret_handler(err,null);
	    });	    
	});		
	
}

/*
 * Remove object from db by criteria.
 */
var remove = exports.remove = function( col_name, criteria, ret_handler){
	
	checkdb();
	
	db.collection( col_name, function(err, collection){
		
		if(err){
			
			ret_handler(err,null);
			return;
		}
	    		    	 
	    collection.remove( criteria ,{safe:true},function(err, n){//n: number of rows/docs removed
	    	
			if( ret_handler )						
				if( !err ) 
				    ret_handler( null, n );				    
			    else 
			    	ret_handler(err,null);
	    });	    
	});		
	
}

/*
 * Remove expired document from db, its events and timer.
 */
var remove_global = exports.remove_global = function( col_name, id_str, ret_handler ){
		
	async.series([
		function(end_handler){
			
			var rcpts;
			async.series([
				function(next){
					
					select(col_name, id_str,function(err,doc){
						
						if(err)
							next(err);
						else{
							rcpts = doc.rcpts;
							next();	
						}	
						
					});
				},function(next){
					
					async.forEach(rcpts, function(rcpt,next){
						
						select("users",rcpt,function(err,user){//remove wid from all users wids list
														
							var index = user.wids.indexOf(id_str);
							if(index != -1){
								user.wids.splice(index,1);
								save("users",user,function(err){next(err);});
							}else	
								next();	
						});						
					},function(err){
						
						next(err);
					});												
				}
			],function(err){
				
				end_handler(err);
			});
											
		},
		function( end_handler ){//remove doc by id
			
			removeById(col_name, id_str, function(err){
				
				end_handler(err);								
			});
		},
		function( end_handler ){//remove  events related to doc id
			
			remove("events",{"ev_data.wid":id_str}, function(err,n){
				
				end_handler(err);
			});
		}
	], function(err,results){
		
		if(err)
			throw err;
		else
			ret_handler(null,1);	
	});
		
}

