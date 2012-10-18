var endpoint = require("./endpoint");

/*
 * This function calls a procedure exported by endpoint module based on the pathname.
 * If such function exists at the endpoint module it is invoked. If not an http 404 error is sent.
 * Pathnames of the form /subpath1/subpath2/.. are not allowed, only primary paths like: /onlythis
 * will work.
 * 
 * Ex:
 * 
 * /rpc gets translated into a call to endpoint.rpc(http_resp, data). where http_resp is the http 
 * response object and data is the http post string. 
 */
exports.route = function( pathname, http_resp, http_post_str){
     
    pathname = pathname.replace("/",""); 
    if( endpoint[pathname] ){       	
		
		endpoint[pathname](http_resp, http_post_str);
    }else{
		//console.log("No request handler found for "+ pathname);
		http_resp.writeHead(404,{"Content-type":"text/html"});
		http_resp.write("404 Not Found.");
		http_resp.end();
    }
}

