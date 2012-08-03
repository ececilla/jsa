/*
 * Con este modulo transformamos la llamda jsonrpc en una llamada js mapeando el 
 * contenido del mensaje jsonrpc a una funcion propia del api.
 */

var api = require("./api");
api.initrcpts = function(doc,ret_handler){ ret_handler([620793117]) };
var eq = require("./evqueue");

/*
 * Process json request string and return json response object through the return handler.
 * 
 */
function process(jsonrpc_req_str, ret_handler){
	
	var jsonrpc_req, jsonrpc_res = {jsonrpc:"2.0"};

	//Check whether request string is json-parseable or not.
    try{    
    	jsonrpc_req = JSON.parse(jsonrpc_req_str);
    }catch(err){    	
    	
    	jsonrpc_res.err = {code:-32700, message:"Parse error."};
    	jsonrpc_res.id = null;
    	ret_handler(jsonrpc_res);    			
		return;
    }
    	
	//Check protocol version.
    if( jsonrpc_req.jsonrpc != "2.0" ){
			
		jsonrpc_res.err = {code:-32604, message:"Version not supported."}
		jsonrpc_res.id = null;
		ret_handler(jsonrpc_res);		
		return;
    }
    
    //Check we can call the procedure
    if( !api.remote[jsonrpc_req.method] ){
				
		jsonrpc_res.err = {code:-32600, message:"Method not found."};
		jsonrpc_res.id = jsonrpc_req.id;
		ret_handler(jsonrpc_res);		
		return;
    }
    
    //Invoke procedure and return response
    api.remote[jsonrpc_req.method]( jsonrpc_req.params, function( err,result ){
	
		if( jsonrpc_req.id ){
		    		    	   	  
		    if( !err )
				jsonrpc_res.result = result;	    	      
		    else
				jsonrpc_res.error = err;
			    	
		    jsonrpc_res.id = jsonrpc_req.id;    
			ret_handler(jsonrpc_res);    		    
		}else
			ret_handler(null);	
    });	
}


/*
 * Processing handler for /rpc endpoint.
 */
exports.rpc = function( http_resp, data ){
	
	//TODO:Check if current request is indeed a batch request
	
	
	//Process request, send http response and close connection.    
	process(data, function( jsonrpc_res ){
		
		if(jsonrpc_res){
			
			if(jsonrpc_res.err && jsonrpc_res.err.code < -32000)				
				http_resp.writeHead(400,{"Content-Type":"application/json"});				
			else
				http_resp.writeHead(200,{"Content-Type":"application/json"});
			
			http_resp.end( JSON.stringify( jsonrpc_res ) + "\n" );
		}
	});   	    
	               
}


/*
 * Processing handler for /events endpoint. This endpoint only accepts one remote
 * procedure: "subscribe". Any other procedure name will cause the eventqueue to close the connection.
 * Any client connection established on this endpoint will remain open forever waiting for events to be
 * pushed down to the client. 
 */
exports.events = function( http_resp, data ){
	
		
	var jsonrpc_req = JSON.parse(data);
	if( jsonrpc_req.method == "subscribe" ){
						
		http_resp.writeHead(200,{"Content-Type":"application/json"});
		http_resp.connection.setTimeout(0);
		http_resp.connection.setNoDelay(true);		
		
		eq.remote.subscribe( http_resp, jsonrpc_req.params );
				
	}else{
		http_resp.writeHead(404);
		http_resp.end();	
	}
	
}

