var m = require("moment");

/*
 * Change default behaviour of console.log to print timestamp before any message
 */
function change_console_log_format(){

	var f = console.log;
	console.log = function(){
		
		var args = Array.prototype.slice.call(arguments);
		args[0] = "[%s] " + args[0];
		args.splice(1,0,m().format("DD/MM/YYYY H:mm:ss"));
		f.apply(this, args);	
	
	}

}

/*
 * make api functions public to front module, so can call them from code:
 * var jsa = require("jsa");
 * jsa.api.docs.create({uid:32342,doc:{test:1}},function(err,ret_val){ ... })
 */
var api = require("./api");
exports.api = {docs:{},init:{},events:{}};
for( key in api.remote ){
	
	(function(){
		var scopekey = key;
		exports.api.docs[scopekey] = function(params, ret_handler){
							
			api.remote[scopekey](params, ret_handler);
		}
	})();	
};

for( key in api.init ){
	
	(function(){
		var scopekey = key;
		exports.api.init[scopekey] = function(params, ret_handler){
							
			api.init[scopekey](params, ret_handler);
		}
	})();	
};

exports.api.events.on = function( ev_type, ret_handler ){
	
	api.on(ev_type, ret_handler);
}



var system = {pid:process.pid, uid:process.getuid(), cwd:process.cwd(), version:process.version };

var http = require("http");
var url = require("url");
var qs = require("querystring");
var router = require("./router");
var db = require("./db");


/*
 *  termination handler.
 */
function termination_handler(sig) {
	
   if (typeof sig === "string") {
      console.log("Received %s - terminating Node process.", sig);
      process.exit(1);
   }
   console.log("Node process stopped.");
}


//Uncaught exceptions handler to make the server stay running forever.
process.on("uncaughtException", function(err){
	
	console.warn( err );
	
});


//Process on exit and signals.
process.on('exit', function() { termination_handler(); });

[
 'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
].forEach(function(element, index, array) {
    process.on(element, function() { termination_handler(element); });
});


/*
 * If sconfig is undefined then settings are loaded from file settings.json, otherwise the function
 * prints and/or overwrites these default settings (sconfig) with program settings (econfig). 
 * 
 */
var sconfig;
var settings = function( econfig ){
	
	if( typeof sconfig == "undefined"){
				
		try{
			console.log("Reading config file 'settings.json'");									
			sconfig = require("../settings.json");											
		}catch(err){			
			//sconfig = {};
			console.log("Cannot read config file 'settings.json'");
		}	
	}else if( typeof econfig == "object" && econfig.reload == 1){
		
		try{
			console.log("Reloading config file 'settings.json'");
			delete require.cache[ process.cwd() + "/settings.json" ];
			sconfig = require("../settings.json");
			delete econfig.reload;
		}catch(err){
			console.log("Cannot reload config file 'settings.json'");
		}
										
	}
			
	if( typeof econfig == "object" ){
		for(key in econfig)
			sconfig[key] = econfig[key];				
	}	
	
	console.log("Settings: " + JSON.stringify(sconfig) );
}
exports.settings = settings;


/*
 * private function to process incoming request: parse url and route request  based on pathname. 
 */
function request_handler(request, response){
	
	if( request.method == "POST" ){	
		
	    if( request.headers["content-type"] == "application/json" ){
		
			var data = "";
			var pathname = url.parse(request.url).pathname;
			request.setEncoding("utf8");
			request.on("data", function(chunk){
			    data += chunk;
			});
			request.on("end", function(){
			    
			    console.log('Received data: [%s]', data);
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
 * connect to db
 */
exports.connectdb = function( econfig ){

	if(typeof econfig == "object")	
		settings( econfig );						
	
	db.connect( sconfig, function(err,val){
				
	});		
}

/*
 * start http server and connect driver to db.
 * 
 * sconfig properties:
 * 
 * sconfig.port : http port to listen
 * sconfig.ipaddr : addr to bind the service
 * sconfig.dbhost: db host ip address
 * sconfig.dbport : db  port
 * sconfig.dbname: database name
 * sconfig.dbuser : db connection user.
 * sconfig.dbpass : db connection password
 */
var httpsrv = http.createServer(request_handler);
exports.start = function( econfig ){
	
		
	
	change_console_log_format();
	console.log("System settings: %s", JSON.stringify(system) );	
	
	if(httpsrv._handle)
		stop();
	
	settings(econfig);
	/*
	if(typeof econfig == "object")	
		settings( econfig );			
	else if( typeof sconfig == "undefined" )
		settings();	
	else
		console.log("Settings: " + JSON.stringify(sconfig) );				
	*/
	
	db.connect( sconfig, function(err,val){
	
		if(!err){	
		
			httpsrv.listen( sconfig.httpport, sconfig.httpaddr );
			console.log("Httpd listening on %s:%d", sconfig.httpaddr, sconfig.httpport);
		}	
	});						
	
			
}

/*
 * Stop http server.
 */
var stop = function(){
	
	if( httpsrv )
		httpsrv.close();
	console.log("Httpd stopped.");		
		
}
exports.stop = stop;



