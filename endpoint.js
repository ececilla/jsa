/*
 * Con este modulo transformamos la llamda jsonrpc en una llamada js mapeando el 
 * contenido del mensaje jsonrpc a una funcion propia del api.
 */

var api = require("./api");
var eq = require("./evqueue");

/*
 * Function handler for endpoint /rpc
 */
exports.rpc = function( http_resp, data ){
    
    var jsonrpc_req, jsonrpc_res =  {jsonrpc:"2.0"};
    
    //Check whether posted string is json-parseable or not.
    try{    
    	jsonrpc_req = JSON.parse(data);
    }catch(err){
    	http_resp.writeHead(200,{"Content-Type":"application/json"});
    	
    	jsonrpc_res.err = {code:-32700, message:"Parse error."};
    	jsonrpc_res.id = null;
    	http_resp.end( JSON.stringify( jsonrpc_res ) + "\n" );    			
		return;
    }        
    
    //If theres no id we can close the response socket.
    if( !jsonrpc_req.id )		
		http_resp.end();	
    
    //Check protocol version.
    if( jsonrpc_req.jsonrpc != "2.0" ){
	
		http_resp.writeHead(500,{"Content-Type":"application/json"});
		jsonrpc_res.err = {code:-32604, message:"Version not supported."}
		http_resp.end( JSON.stringify( jsonrpc_res ) + "\n" );		
		return;
    }

    //Check we can call the procedure
    if( !api.remote[jsonrpc_req.method] ){
	
	
		http_resp.writeHead(500,{"Content-Type:":"application/json"});
		jsonrpc_res.err = {code:-32600, message:"Invalid request."};
		jsonrpc_res.id = jsonrpc_req.id;
		http_resp.end(JSON.stringify( jsonrpc_res ) + "\n");		
		return;
    }
    	   	  
      
    //Invoke procedure and write output to response socket as a json string.
    api.remote[jsonrpc_req.method]( jsonrpc_req.params, function( err,result ){
	
		if( jsonrpc_req.id ){
		    		    	   	  
		    if( !err )
				jsonrpc_res.result = result;	    	      
		    else
				jsonrpc_res.error = err;
	
		    http_resp.writeHead(200,{"Content-Type":"application/json"});	
		    jsonrpc_res.id = jsonrpc_req.id;    
		    http_resp.end(JSON.stringify( jsonrpc_res ) + "\n");		    
		}	
    });
               
}


/*
 * Funcion handler para el endpoint /events
 */
exports.events = function( http_resp, data ){
	
		
	var jsonrpc_req = JSON.parse(data);
	if( jsonrpc_req.method == "subscribe" ){
		
		if(!jsonrpc_req.params.uid){
	
			http_resp.end();
			return;
		}
		
		http_resp.writeHead(200,{"Content-Type":"application/json"});
		http_resp.connection.setTimeout(0);
		http_resp.connection.setNoDelay(true);		
		
		eq.subscribe( http_resp, jsonrpc_req.params );
				
	}else{
		http_resp.writeHead(404);
		http_resp.end();	
	}
	
}

