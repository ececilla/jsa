var mongo = require("mongodb");

var db = null;

/*
 * Connect to db before any other db operation.
 */
exports.connect = function( params, ret_handler ){
			
	if( db ){
		
		db.close();
	}
	
	db = new mongo.Db(params.dbname, new mongo.Server(params.dbhost,params.dbport,{auto_reconnect:true, socketOptions:{timeout:5000}}),{strict:true}); //,poolSize:5,socketOptions:{timeout:1}
	
	db.open( function(err, client){
    	
		if(client){			
			if( typeof params.dbuser !== "undefined" && typeof params.dbpass !== "undefined" ){
			
				db.authenticate(params.dbuser,params.dbpass,function(err,client){
					
					if(client){
						console.log('MongoDb driver auth-connected');
						if(ret_handler)
							ret_handler(null,1);
					}else{
						
						db = null; 
						console.log(err);
						if(ret_handler)
							ret_handler(err,0);
					}	
				});	
			}else{
				console.log('MongoDb driver connected');
				if(ret_handler)
					ret_handler(null,1);
			}												
		}else{
			
			db = null;		
			console.log(err);
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
 * Return collection object or create it if not exists.
 */
function ensure_collection( col_name, ret_handler ){
	
	db.collection( col_name, function(err,collection){
		
		if(err)
			db.createCollection( col_name, function(err,collection){
				if(err)
					ret_handler(err,null);
				else
					ret_handler(null,collection);
			});
		else
			ret_handler(null,collection);	
	});
	
}


/*
 * Save object to db. 
 *
 */
exports.save = function( col_name, obj, ret_handler ){
    
    checkdb();     
    			
	ensure_collection(col_name, function(err, collection){
	    
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
exports.select = function( col_name, id_str, ret_handler ){

    checkdb(); 
       
	ensure_collection( col_name, function(err, collection){

	    var ObjectID = require('mongodb').ObjectID;	 
	    collection.findOne({_id:new ObjectID(id_str)},function(err, object){
						
			if( !err ) 
			    ret_handler( null,object );
			else
				ret_handler(err,null);
	    });	    
	}); 

}



/*
 * Remove object from db by ID.
 */
exports.remove = function( col_name, id_str, ret_handler){
	
	checkdb();
	
	ensure_collection( col_name, function(err, collection){
	    	
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




