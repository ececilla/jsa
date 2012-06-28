var endpoint = require("./endpoint");


exports.route = function( pathname, response, data){
     
    pathname = pathname.replace("/",""); 
    if( endpoint[pathname] ){       	
		
		endpoint[pathname](response, data);
    }else{
		console.log("No request handler found for "+ pathname);
		response.writeHead(404,{"Content-type":"text/html"});
		response.write("404 Not Found.");
		response.end();
    }
}

