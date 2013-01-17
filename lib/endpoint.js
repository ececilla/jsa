/*
 * Con este modulo transformamos la llamda jsonrpc en una llamada js mapeando el 
 * contenido del mensaje jsonrpc a una funcion propia del api.
 */

var sandbox = require("./sandbox");
var api = require("./api");
var eq = require("./evqueue");
var srv = require("./server");
var util = require("./util");
var CONST = require("./constants");

var async = require("async");
var querystring = require("querystring");

var plugins = {};

/*
 * Function to add a plugin
 */
exports.add_plugin = function(plugin_name, func_handler){
			
	if(func_handler == undefined && typeof plugin_name == "function"){
		
		func_handler = plugin_name;
		plugin_name = util.generate_rstring(10);
	}	
	
	plugins[plugin_name] = func_handler;
		
}

/*
 * execute all plugins for given procedure.
 */
function execute_plugins(qdata){
	
	var error;	
	for(key in plugins){
		
		error = plugins[key](qdata);
		if(error)
			break;					
	}
	return error;
}

/*
 * Process json request string and return json response object through the return handler.
 * 
 */
function process(qdata, ret_handler){
	
	var jsonrpc_req, jsonrpc_res = {jsonrpc:"2.0"};
	
	//Invoke endpoint plugins
    var error = execute_plugins(qdata);
    if(error){
    	jsonrpc_res.error = error;
    	jsonrpc_res.id = null;
		ret_handler(jsonrpc_res);		
		return;
    }

	//Check whether request string is json-parseable or not.
    try{    
    	jsonrpc_req = JSON.parse(qdata.request);
    }catch(err){    	
    	
    	jsonrpc_res.error = {code:-32700, message:"Parse error."};
    	jsonrpc_res.id = null;
    	ret_handler(jsonrpc_res);    			
		return;
    }
    	
	//Check protocol version.
    if( jsonrpc_req.jsonrpc != "2.0" ){
			
		jsonrpc_res.error = {code:-32604, message:"Protocol version not supported."}
		jsonrpc_res.id = null;
		ret_handler(jsonrpc_res);		
		return;
    }
    
    //Check version param
    if( !qdata.version ){
    	
    	jsonrpc_res.error = {code:-32605, message:"Missing agent version."}
		jsonrpc_res.id = null;
		ret_handler(jsonrpc_res);		
		return;
    	
    }else if( qdata.version != srv.config.app.version){
    		
    	jsonrpc_res.error = {code:-32606, message:"Agent version not supported."}
		jsonrpc_res.id = null;
		ret_handler(jsonrpc_res);		
		return;	
    }
        
               
      
    //Invoke procedure through sandbox and return response
    sandbox.execute(jsonrpc_req.method, jsonrpc_req.params, function(err,ctx){
					
		if( jsonrpc_req.id ){
		    		    	   	  
		    if( !err )
				jsonrpc_res.result = ctx.retval;	    	      
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
exports.rpc = function( http_resp, urlencodeddata ){
	
	//TODO:Check whether current request is  a batch request.
	
	//Parse urlencoding content and get post parameters in plain text.
	var qdata = querystring.parse( urlencodeddata );		
	
	//Process querystring, send http response and close connection.    
	process(qdata, function( jsonrpc_res ){
		
		if(jsonrpc_res){
			
			if(jsonrpc_res.error && jsonrpc_res.error.code < -32000)				
				http_resp.writeHead(CONST.HTTP_BAD_REQUEST(),{"Content-Type":"application/json"});				
			else
				http_resp.writeHead(CONST.HTTP_OK(),{"Content-Type":"application/json"});
			
			var str_out =  JSON.stringify( jsonrpc_res ) + "\n";
			http_resp.end( str_out );
		}
	});   	    
	               
}


/*
 * Processing handler for /events endpoint. This endpoint only accepts one remote
 * procedure: "subscribe". Any other procedure name will cause the connection being closed.
 * Any client connection established on this endpoint will remain open forever waiting for events to be
 * pushed down to the client. 
 */
exports.events = function( http_resp, data ){
	
		
	var jsonrpc_req;
	try{    
    	jsonrpc_req = JSON.parse(data);
    }catch(err){    	
    	
    	var jsonrpc_res = { jsonrpc:"2.0",error:{code:-32700, message:"Parse error."}};    	    	    	
    	http_resp.writeHead(CONST.HTTP_BAD_REQUEST()); 
    	http_resp.end( JSON.stringify(jsonrpc_res) );			
		return;
    }
	if( jsonrpc_req.method == "subscribe" ){
						
		http_resp.writeHead(CONST.HTTP_OK(),{"Content-Type":"application/json"});
		http_resp.connection.setTimeout(0);
		http_resp.connection.setNoDelay(true);		
		
		eq.remote.subscribe( http_resp, jsonrpc_req.params );
				
	}else{
		http_resp.writeHead(CONST.HTTP_NOT_FOUND());
		http_resp.end();	
	}
	
}

