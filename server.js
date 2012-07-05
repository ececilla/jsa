var http = require("http");
var url = require("url");
var qs = require("querystring");
var router = require("./router");

//Uncaught exceptions handler to make the server stay running forever.
process.on("uncaughtException", function(err){
	
	console.log( err);
	
});


/*
 * Process incoming request: parse url and route request  based on pathname. 
 */
function onRequest(request, response){
	
	if( request.method == "POST" ){	
		
	    if( request.headers["content-type"] == "application/json" ){
		
			var data = "";
			var pathname = url.parse(request.url).pathname;
			request.setEncoding("utf8");
			request.on("data", function(chunk){
			    data += chunk;
			});
			request.on("end", function(){
			    
			    console.log('%s: Received data: [%s]', Date(Date.now()), data);
			    router.route( pathname, response, data );
			});
			
	    }else{
					
			response.writeHead(400, {"Content-Type":"text/html"});
			response.write("400 Bad request.");
			response.end();
	    }
	}else{
	    response.writeHead(405,{"Content-Type":"text/html"});
	    response.write("405 Method not allowed");
	    response.end();
	}
}

/*
 * Start server
 */	
exports.startserver = function(  port, ipaddr ){
								
	http.createServer(onRequest).listen(port,ipaddr);
	console.log('%s: Node started on %s:%d with pid %d', Date(Date.now()), ipaddr, port, process.pid);	            
}


