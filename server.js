var http = require("http");
var url = require("url");
var qs = require("querystring");
var router = require("./router");

//Uncaught exceptinons handler to make the server stay running forever.
process.on("uncaughtException", function(err){
	
	console.log( err);
});


/*
 * Funcion generica con la logica de negocio del servidor http
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
			    
			    router.route( pathname, response, data );
			});
			
	    }else{
		
			console.log("No request handler for Content-Type not app/json");
			response.writeHead(404, {"Content-Type":"text/html"});
			response.write("404 Not Found: No content for Content-Type:" + request.headers["content-type"]);
			response.end();
	    }
	}else{
	    response.writeHead(405,{"Content-Type":"text/html"});
	    response.write("405 Method not allowed");
	    response.end();
	}
}

/*
 * Arrancamos el servidor de comandos
 */	
exports.startComServer = function(  port ){
								
	http.createServer(onRequest).listen(port,"192.168.1.2");
	console.log("Proceso " + process.pid + " escuchando en puerto " + port);             
}


/*
 * Arrancamos el servidor de eventos
 */
exports.startEvServer = function( port ){		
	
	http.createServer(onRequest).listen(port,"192.168.1.2");	
	console.log("Proceso " + process.pid + " escuchando en puerto " + port); 
}

	

