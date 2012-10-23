//built-in modules
var http = require("http");
var url = require("url");
var qs = require("querystring");

//external modules
var async = require("async");

//custom modules
var router = require("./router");
var sandbox = require("./sandbox");
var db = require("./db");
var eq = require("./evqueue");
var api = require("./api");
var util = require("./util");
var time = require("./time");
var CONST = require("./constants");

/*
 * built-in event emitter for own events.
 */
var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();


var srv = exports;

util.add_console_log_printing_format();


/*
 * Server namespace 
 */
srv.events = {};
srv.config = { 	system:{}, 
				events:{}, 				
				db:{
					system_catalogs:["events", "timers"],
					default_catalog : "docs"
				} 
			};
srv.init = {};			
srv.api = { config:{procedures:{}}, events:{} };
srv.eq = { events:{} };
srv.db = {select: db.select, save:db.save, criteria:db.criteria};

/*
 * Make api functions public to front module, so can call them from front module server.js:
 * 
 * var jsa = require("jsa");
 * jsa.api.docs.create({uid:32342,doc:{test:1}},function(err,ret_val){ ... })
 */


for( key in api.remote ){
		
	(function(){
		
		var scopekey = key;		
		srv.api.config.procedures[scopekey] = CONST.ENABLE();
		srv.api[scopekey] = function(params, ret_handler){
			
			sandbox.execute( scopekey, params, ret_handler?ret_handler:function(err,val){						
									
				if(err)
					throw new Error(err.message);
				else if(srv.config.app.debug)
					console.log(val);	
			});
		}
	})();	
};

for( key in api.config ){
	
	(function(){
		var scopekey = key;
		srv.api.config[scopekey] = function(params, ret_handler){
							
			api.config[scopekey](params, ret_handler);
		}
	})();	
};

srv.api.config.rcpts = function( rcpt_handler ){
	
	api.rcpts = rcpt_handler;
}

srv.api.config.enable_procedures = function(){
	
	for(key in srv.api.config.procedures)
		srv.api.config.procedures[key] = CONST.ENABLE();
}

srv.api.config.disable_procedures = function(){
	
	for(key in srv.api.config.procedures)
		srv.api.config.procedures[key] = CONST.DISABLE();	
}

/*
 * This function is where all new operations will be added or init stuff will be coded.
 * When all init stuff is done must call ret_handler to signal the end of the init process.
 */
srv.init.execute = [
	
	function( end_handler ){
		
		sandbox.add_constraint_pre("create","param_uid",sandbox.constraints.is_required("uid"))//create constraints.
	   		   .add_constraint_pre("create","param_doc",sandbox.constraints.is_required("doc"))
	   		   .add_constraint_pre("create","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_post("create","param_type",sandbox.constraints.param_type("doc","object"))	   
	   		   .add_constraint_pre("dispose","param_wid",sandbox.constraints.is_required("wid"))//dispose constraints
	  		   .add_constraint_pre("dispose","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("dispose","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_post("dispose","is_owner",sandbox.constraints.is_owner)
	   		   .add_constraint_pre("join","user_catalog",sandbox.constraints.user_catalog)//join constraints
	   		   .add_constraint_pre("join","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("join","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_post("join","is_joinable",sandbox.constraints.is_joinable)
	   		   .add_constraint_pre("unjoin","user_catalog",sandbox.constraints.user_catalog)//unjoin constraints
	   		   .add_constraint_pre("unjoin","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("unjoin","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_post("unjoin","is_joinable",sandbox.constraints.is_joinable)
	   		   .add_constraint_post("unjoin","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_pre("add","user_catalog",sandbox.constraints.user_catalog)//add constraints
	   		   .add_constraint_pre("add","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("add","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("add","param_fname",sandbox.constraints.is_required("fname"))
	   		   .add_constraint_pre("add","param_value",sandbox.constraints.is_required("value"))
	   		   .add_constraint_pre("add","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("add","not_exists",sandbox.constraints.field_not_exists)
	   		   .add_constraint_post("add","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_pre("remove","user_catalog",sandbox.constraints.user_catalog)//remove constraints
	   		   .add_constraint_pre("remove","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("remove","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("remove","param_fname",sandbox.constraints.is_required("fname"))	  
	   		   .add_constraint_pre("remove","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("remove","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("remove","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("set","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("set","param_wid",sandbox.constraints.is_required("wid"))//set constraints
	   		   .add_constraint_pre("set","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("set","param_fname",sandbox.constraints.is_required("fname"))
	   		   .add_constraint_pre("set","param_value",sandbox.constraints.is_required("value"))	  
	   		   .add_constraint_pre("set","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("set","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("set","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("push","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("push","param_wid",sandbox.constraints.is_required("wid"))//push constraints
	   		   .add_constraint_pre("push","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("push","param_fname",sandbox.constraints.is_required("fname"))
	   		   .add_constraint_pre("push","param_value",sandbox.constraints.is_required("value"))	  
	   		   .add_constraint_pre("push","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("push","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("push","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_pre("pop","user_catalog",sandbox.constraints.user_catalog)//pop constraints
	   		   .add_constraint_pre("pop","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("pop","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("pop","param_fname",sandbox.constraints.is_required("fname"))	    
	   		   .add_constraint_pre("pop","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("pop","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("pop","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_pre("shift","user_catalog",sandbox.constraints.user_catalog)//shift constraints
	   		   .add_constraint_pre("shift","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("shift","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("shift","param_fname",sandbox.constraints.is_required("fname"))	    
	   		   .add_constraint_pre("shift","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("shift","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("shift","has_joined",sandbox.constraints.has_joined);
				
		end_handler();	
}];


/*
 * Add external handler for api module events. evqueue.js module adds a default handler for 
 * all primitive events related to primitive operations: ev_create, ev_join, ev_unjoin, 
 * ev_add, ev_rem, ev_set, ev_incr, ev_decr, ev_push, ev_pop, ev_pull.
 */
srv.api.events.on = function( ev_type, ret_handler ){
				
	api.on(ev_type, ret_handler);
	return srv.api.events;	
}


/*
 * Emit event as an api event.
 */
srv.api.events.emit = function( ev_type, ctx, rcpts ){
			
	api.emit( ev_type, ctx, rcpts );
}


/*
 * Register listeners for eventqueue events. Eventqueue event list: ev_eq_push
 */
srv.eq.events.on = function( ev_type, ret_handler ){
				
	eq.on(ev_type, ret_handler);
	return srv.eq.events;	
}

/*
 * Emit  event as a evqueue event.
 */
srv.eq.events.emit = function( ev_type, ctx, rcpts ){
			
	eq.emit( ev_type, ctx, rcpts );
}


/*
 * Register listeners to the server events using a delegation pattern for EventEmitter.
 * 
 */
srv.events.on = function( ev_type, ret_handler ){
	
	emitter.on(ev_type, function( data, rcpts ){
							
		ret_handler( {						
						ev_type:ev_type,
						ev_tstamp:time.now(),
						ev_data:data								
					 }, rcpts );
	});		
}

srv.events.on("ev_srv_req",function(msg){
			
	if( srv.config.app.debug )		
		console.log("-->POST %s\n-->\t%s", msg.ev_data.pathname, msg.ev_data.request);
		
});

/*
 * emit a server-event. Server events list:
 * 
 *   -ev_srv_start
 *   -ev_srv_stop
 *   -ev_srv_req
 * 
 */
var emit = srv.events.emit =  function( ev_type, msg, rcpts ){
	
	emitter.emit(ev_type, msg, rcpts );
}



/*
 * add a new operation to the service
 */
srv.api.config.newop = function( fname, f_handler ){ 						
						
	api.remote[fname] = function( ctx, ret_handler){//register function to api module.
											
		f_handler(ctx, ret_handler);			
														
	}
	
	srv.api[fname] = function( params, ret_handler ){//prepare call operation through server via sandbox.
		
		sandbox.execute(fname, params, ret_handler?ret_handler:function(err,val){
			
			if(err)
				throw new Error(err.message);
			else if(srv.config.app.debug)
					console.log(val);
		});		
	}
	
	srv.api.config.procedures[fname] = CONST.ENABLE();
	
	eq.api.listen( "ev_api_" + fname );
	
	var ret =  {
			
			add_constraint_post:function(cons_name, func_handler){
			
				sandbox.add_constraint_post( fname, cons_name, func_handler);
				return ret;
			},
			add_constraint_pre:function(cons_name, func_handler){
			
				sandbox.add_constraint_pre( fname, cons_name, func_handler);
				return ret;
			}
			
	};
	return ret;	
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
 * Plots active timers.
 */
exports.timers = function(){
	
	util.show_timers();
}

/*
 * If srv.config.app is undefined then settings are loaded from file settings.json, otherwise the function
 * prints and/or overwrites these default settings (srv.config.app) with program settings (econfig). 
 * 
 */
var settings = exports.settings = function( econfig ){
	
	if( srv.config.app == undefined ){
				
		try{												
			
			srv.config.app = require("../settings.json");
			srv.config.app.version = require("../package.json").version;											
		}catch(err){			
			
			throw new Error("Cannot read config file 'settings.json'");
		}	
	}else if( typeof econfig == "object" && econfig.reload == 1){
		
		try{
			console.log("**Reloading config file 'settings.json'");
			delete require.cache[ process.cwd() + "/settings.json" ];
			delete require.cache[ process.cwd() + "/package.json" ];
			srv.config.app = require("../settings.json");
			srv.config.app.version = require("../package.json").version;
			delete econfig.reload;
		}catch(err){
			throw new Error("Cannot read config file 'settings.json' or 'package.json'");
		}
										
	}
			
	if( typeof econfig == "object" ){
		for(key in econfig)
			if(econfig[key])			
				srv.config.app[key] = econfig[key];				
	}			
	
}


/*
 * private function to process incoming request: parse url and route request  based on pathname. 
 */
function request_handler(request, response){
	
	if( request.method == "POST" ){	
		
	    if( request.headers["content-type"] == "application/json" ){
		
			var data = "";
			var pathname = url.parse(request.url).pathname;
			request.setEncoding("utf8");
			request.on("data", function( chunk ){
			    
			    data += chunk;
			});
			request.on("end", function(){
			    			  			    			    			    
			    emit("ev_srv_req", {pathname:pathname, request:data} );
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



srv.config.system = {pid:process.pid, uid:process.getuid(), cwd:process.cwd(), node_version:process.version };

/*
 * start http server and connect driver to db.
 * 
 * srv.config.app properties:
 * 
 * .port : http port to listen
 * .ipaddr : addr to bind the service
 * .dbhost: db host ip address
 * .dbport : db  port
 * .dbname: database name
 * .dbuser : db connection user.
 * .dbpass : db connection password
 */
var httpsrv = http.createServer(request_handler);
exports.start = function( econfig, ret_handler ){
		
	//set parameters conveniently if only one parameter is passed.
	if( typeof econfig == "function"){
	
		ret_handler = econfig;
		econfig = undefined;
	
	}				
			
	if(httpsrv._handle)
		stop();
	
	console.log("\n\n");
	console.log("**Starting JSA server...");		
	console.log("**System settings:\n\t%s", JSON.stringify(srv.config.system) );	
	console.log("**Reading config file 'settings.json'");
	settings(econfig);
	console.log("**App settings:\n\t%s" , JSON.stringify(srv.config.app) );	  
	
	db.connect( srv.config.app, function(err,val){
			
		if( !err ){	
		
			httpsrv.listen( srv.config.app.httpport, srv.config.app.httpaddr, function(){														
				
				console.log("**Httpd listening on %s:%d", srv.config.app.httpaddr, srv.config.app.httpport);
				
				async.series(
				[										
					function(next){		
						
						async.series( srv.init.execute, function(err, results){		
													
							console.log("**Executed jsa.api.init.execute");										
							console.log("**Remote operations: {%s}", util.get_remote_operations().join());																																										
							next();
						});
					},
					function(next){
						
						db.prepare(srv.config.db,function(err, result){
							
							console.log("**Prepared db catalogs: {%s}", result.join() );
							next();
						});
					},
					function(next){	
						
						time.load_remove_timers(function(n){
							
							console.log("**Loaded %d remove timers.",n);
							next();
						});
					}					
				],function(){
					
					console.tlog("Server started");
					emit("ev_srv_start");
					
					if(ret_handler)
						ret_handler();
				});																	
			});						
			
		}else
			console.tlog(err);	
	});							
	
			
}

/*
 * Stop http server.
 */
var stop = function(){
	
	if( httpsrv )
		httpsrv.close();	
	console.log("Httpd stopped.");		
	emit("ev_srv_stop");	
}
exports.stop = stop;




