var m = require("moment");

/*
 * Change default behaviour of console.log to print timestamp before any message
 * TODO: si se llama mas de una vez los timestamp de van superponiendo a la izquierda del mensaje.
 */
function change_console_log_printing_format(){

	var f = console.log;
	console.log = function(){
		
		var args = Array.prototype.slice.call(arguments);
		args[0] = "[%s] " + args[0];
		args.splice(1,0,m().format("DD/MM/YYYY H:mm:ss"));
		f.apply(this, args);	
	
	}

}


/*
 * Required built-in and custom modules
 */

var http = require("http");
var url = require("url");
var qs = require("querystring");
var router = require("./router");
var db = require("./db");
var eq = require("./evqueue");
var api = require("./api");
var util = require("./util");


/*
 * Make api functions public to front module, so can call them from front module server.js:
 * 
 * var jsa = require("jsa");
 * jsa.api.docs.create({uid:32342,doc:{test:1}},function(err,ret_val){ ... })
 */
exports.api = { docs:{}, init:{}, events:{}, eq:{} };
exports.eq = {};
exports.db = db;
var srv = exports;

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

exports.api.init.rcpts = function( rcpt_handler ){
	
	api.rcpts = rcpt_handler;
}

/*
 * execute function is where all new operations will be added.
 */
exports.api.init.execute = function(){
		
}

/*
 * Add external handler for api module events. evqueue.js module adds a default handler for 
 * all primitive events related to primitive operations: ev_create, ev_join, ev_unjoin, 
 * ev_add, ev_rem, ev_set, ev_incr, ev_decr, ev_push, ev_pop, ev_pull.
 */
exports.api.events.on = function( ev_type, ret_handler ){
				
	api.on(ev_type, ret_handler);
	return exports.api.events;	
}

var cancel_default_event = false;
exports.api.events.cancel_default_event = function(){
	
	cancel_default_event = true;
}

/*
 * Emit external event as an api event.
 */
exports.api.events.emit = function( ev_type, params, rcpts ){
			
	api.emit( ev_type, params, rcpts );
}

/*
 * add a new operation to the service
 */
exports.api.newop = function( fname, f_handler ){ 
		
			
	var ev_name = "ev_" + fname;	
						
	api.remote[fname] = function( params, ret_handler){
		
		exports.api.events[ev_name] = {params:params, rcpts:undefined};
					
		if( params && params.catalog && params.wid ){ //load the document if parameter wid is supplied	
			
			db.select(params.catalog, params.wid, function(err,doc){
						
				if(!err && doc){
						
					params.doc = doc;
						
					f_handler(params, function(err,val){
							
							db.save(params.catalog, doc, function(err, doc){				
								
								if(!err){
																		
									ret_handler(null,val);	
												
									if( !cancel_default_event )
										api.emit( ev_name, exports.api.events[ev_name].params , exports.api.events[ev_name].rcpts  );											
									
									cancel_default_event = false;
								}else{
									
									ret_handler(err,null);
								}
							});		
					});	
				}else if(!err && !doc){
					
					ret_handler({code:-7, message:"Document not found: @" + params.catalog + ":" + params.wid }, null);
				}else{
					
					ret_handler(err,null);
				}
			});
		}else{
			
			f_handler(params, function(err,val){
																																							
				ret_handler(null,val);	
								
				if( !cancel_default_event )
					api.emit( ev_name, exports.api.events[ev_name].params , exports.api.events[ev_name].rcpts  );											
				
				cancel_default_event = false;													
			});			
		}										
	}
	
	exports.api.docs[fname] = function( params, ret_handler ){
		
		api.remote[fname](params, ret_handler);
	}
	
	eq.api.listen( ev_name );
}

/*
 * make evqueue listen for custom event types.
 */
exports.eq.listen = function( ev_type, ev_handler ){
	
	eq.api.listen( ev_type, ev_handler );
}




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


if( process.listeners("exit").length  == 1 ){
	
	//Process on exit and signals.	
	process.on('exit', function() { termination_handler(); });
	
	//Uncaught exceptions handler to make the server stay running forever.	
	process.on("uncaughtException", function(err){
	
		console.warn( err );
	
	});
	
	[
	 'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
	 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'
	].forEach(function(element, index, array) {
		
	    process.on(element, function() { termination_handler(element); });
	});
		
}

/*
 * If sconfig is undefined then settings are loaded from file settings.json, otherwise the function
 * prints and/or overwrites these default settings (sconfig) with program settings (econfig). 
 * 
 */
var sconfig;
var settings = function( econfig ){
	
	if( sconfig == undefined ){
				
		try{
			console.log("Reading config file 'settings.json'");									
			sconfig = require("../settings.json");
			sconfig.version = require("../package.json").version;											
		}catch(err){			
			//sconfig = {};
			console.log("Cannot read config file 'settings.json'");
		}	
	}else if( typeof econfig == "object" && econfig.reload == 1){
		
		try{
			console.log("Reloading config file 'settings.json'");
			delete require.cache[ process.cwd() + "/settings.json" ];
			delete require.cache[ process.cwd() + "/package.json" ];
			sconfig = require("../settings.json");
			sconfig.version = require("../package.json").version;
			delete econfig.reload;
		}catch(err){
			console.log("Cannot read config file 'settings.json' or 'package.json'");
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

var system = {pid:process.pid, uid:process.getuid(), cwd:process.cwd(), version:process.version };

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
exports.start = function( econfig, ret_handler ){
	
	//set parameter conveniently if only one parameter is passed.
	if( typeof econfig == "function"){
	
		ret_handler = econfig;
		econfig = undefined;
	
	}
			
	change_console_log_printing_format();
	console.log("System settings: %s", JSON.stringify(system) );	
	
	if(httpsrv._handle)
		stop();
	
	settings(econfig);	  
	
	db.connect( sconfig, function(err,val){
	
		if(!err){	
		
			httpsrv.listen( sconfig.httpport, sconfig.httpaddr, function(){
					
					if(ret_handler)
						ret_handler();
				console.log("Executing api.init.execute");
				exports.api.init.execute();	
				console.log("Remote operations:" + util.list_remote_procedures( api ) );	
			} );
			console.log("Httpd listening on %s:%d", sconfig.httpaddr, sconfig.httpport);
		}else
			console.log(err);	
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



