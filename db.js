var mongo = require("mongodb");
var user = process.env.OPENSHIFT_NOSQL_DB_USERNAME,
	pass = process.env.OPENSHIFT_NOSQL_DB_PASSWORD,
	host = process.env.OPENSHIFT_NOSQL_DB_HOST || "127.0.0.1",
	port = process.env.OPENSHIFT_NOSQL_DB_PORT || 27017,
	db = new mongo.Db("jsa", new mongo.Server("127.0.0.1",27017,{auto_reconnect:true, socketOptions:{timeout:2000}}),{strict:true}); //,poolSize:5,socketOptions:{timeout:1}


 
if( user && password ){
	console.log("authentication connection...")
	db.authenticate(user,pass,function(){
		//TODO: some code?	
	});	
}
db.open( function(err, client){
    	
		if(err){
			db.close();
			console.log(err);										
		}else
			console.log('%s: MongoDb driver connected ...', Date(Date.now()));			
});


/*
 * Funcion para guardar un objeto en la base de datos. 
 *
 */
exports.save = function( col_name, obj, ret_handler ){
        
    			
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
 * Funcion para recuperar un objeto de bddd por id_id_str. 
 *
 */
exports.select = function( col_name, id_str, ret_handler ){

       
	db.collection( col_name, function(err, collection){

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
 * Funcion para borrar un objeto de la bbdd
 */
exports.remove = function( col_name, id_str, ret_handler){
	
	db.collection( col_name, function(err, collection){
	    	
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
