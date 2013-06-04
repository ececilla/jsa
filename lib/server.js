//built-in modules
var http = require("http");
var url = require("url");
var qs = require("querystring");
var net = require("net");
var repl = require("repl");
var fs = require("fs");

//external modules
var nutil = require("util");
var async = require("async");
var prettyjson = require('prettyjson');
var colors = require("colors");
var _ = require("underscore");
var log4js = require("log4js");
log4js.configure("log4js.json",{});
var logger = log4js.getLogger("server");

//custom modules
var router = require("./router");
var sandbox = require("./sandbox");
var db = require("./db");
var evmngr = require("./evmngr");
var api = require("./api");
var util = require("./util");
var time = require("./time");
var timers = require("./timers");
var msgbus = require("./msgbus");
var endpoint = require("./endpoint");
var CONST = require("./constants");

/*
 * built-in event emitter for own events.
 */
var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();

var http_plugins = {};
var srv = exports;

/*
process.on('uncaughtException', function (err) {
  console.log(err);
});
*/

/*
 * Server namespace 
 */
srv.events = {};
srv.rpc = {config:{}};
srv.config = { 	system:{}, 				 				
				db:{
					system_catalogs:["events", "timers"],
					user_catalogs:["docs","users"],
					default_catalog : "docs"
				},
				app:{debug:0} 
			};
srv.init = {};			
srv.api = { config:{ procedures:{}, constraints:{}, plugins:{}}, events:{} };
srv.evmngr = { events:{} };
srv.db = {select: db.select, save: db.save, criteria: db.criteria, connect: db.connect, driver: function(){return db.driver;}};

srv.add_http_plugin = function( name , callback){
	
	http_plugins[name] = callback;
}

var execute_http_plugins = function( req, data ){
	
	for(key in http_plugins){
				
		var err = http_plugins[key](req, data);//err:{http_code:200, http_message:"bla bla"}		
		if(err)
			return err;
	}
}

/*
 * Make remote api functions public, so can call them from front module server.js:
 * 
 */

for( key in api.remote ){
		
	(function(){
		
		var scopekey = key;		
		srv.api.config.procedures[scopekey] = CONST.ENABLE();
		srv.api[scopekey] = function(params, ret_handler){
									
			sandbox.execute( scopekey, params, ret_handler?ret_handler:function(err,ctx){						
									
				if(err){
					if(err.message)
						throw new Error(err.message);
					else
						throw new Error(err);	
				}else if(srv.config.app.debug)
					logger.debug(ctx.retval);	
			});						
		}
	})();	
};

/*
 * Make sandbox constraints and plugins public.
 */
for(key in sandbox.constraints){
	
	(function(){
		var scopekey = key;		
		srv.api.config.constraints[scopekey] = sandbox.constraints[scopekey];
	})();
}

for(key in sandbox.plugins){
	
	(function(){
		var scopekey = key;		
		srv.api.config.plugins[scopekey] = sandbox.plugins[scopekey];
	})();
}


srv.api.config.add_plugin_in = function( proc_name, plugin_name, func_handler, catalog_name ){
	
	sandbox.add_plugin_in(proc_name, plugin_name, func_handler, catalog_name );
}

srv.api.config.add_plugin_out = function( proc_name, plugout_name, func_handler, catalog_name ){
	
	sandbox.add_plugin_out(proc_name, plugout_name, func_handler, catalog_name );
}

srv.api.config.add_constraint_post = function( proc_name, cons_name, func_handler, catalog_name ){
	
	sandbox.add_constraint_post( proc_name, cons_name, func_handler, catalog_name );
}

srv.api.config.add_constraint_pre = function( proc_name, cons_name, func_handler, catalog_name ){
		
	sandbox.add_constraint_pre( proc_name, cons_name, func_handler, catalog_name );
}

srv.api.config.copy_constraints = function(catalog_from, catalog_to){
	
	sandbox.copy_constraints(catalog_from,catalog_to);
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
 * add a new operation to the server
 */
srv.api.config.newop = function( fname, f_handler ){ 						
						
	api.remote[fname] = function( ctx, ret_handler){//register function to api module.
											
		f_handler(ctx, ret_handler);			
														
	}
	
	srv.api[fname] = function( params, ret_handler ){//prepare call operation through repl via sandbox.
		
		sandbox.execute(fname, params, ret_handler?ret_handler:function(err,ctx){
			
			if(err)
				throw new Error(err.message);
			else if(srv.config.app.debug)
					logger.debug(ctx.retval);
		});		
	}
	
	srv.api.events[fname] = {
		on: function(ret_handler){
		
			api.on("ev_api_" + fname, ret_handler);				
		}
	}
		
	srv.api.config.procedures[fname] = CONST.ENABLE();
	
	evmngr.api.listen( "ev_api_" + fname );
	
	var ret =  {
			
			add_constraint_post:function(constraint_name, func_handler, catalog_name){
			
				sandbox.add_constraint_post( fname, constraint_name, func_handler, catalog_name );
				return ret;
			},
			add_constraint_pre:function(constraint_name, func_handler, catalog_name){
			
				sandbox.add_constraint_pre( fname, constraint_name, func_handler, catalog_name );
				return ret;
			},			
			add_plugin_in: function(plugin_name, func_handler, catalog_name ){
								
				sandbox.add_plugin_in(fname, plugin_name, func_handler, catalog_name );
				return ret;
			},			
			add_plugin_out:function(plugin_name, func_handler, catalog_name){
				
				sandbox.add_plugin_out( fname, plugin_name, func_handler, catalog_name );
				return ret;
			},
			add_user_load_fields:function(fields){
				
				sandbox.add_user_load_fields(fname, fields);
				return ret;
			}			
			
	};
	return ret;	
}

/*
 * Add plugin to rpc endpoint. Endpoint plugins have access to request data and can
 * modify it either way.
 */
srv.rpc.config.add_plugin = function( plugin_name, func_handler ){
	
	endpoint.add_plugin( plugin_name, func_handler );
}


/*
 * This function is where all new operations will be added or init stuff will be coded.
 * When all init stuff is done must call ret_handler to signal the end of the init function.
 */
var init_arr = [
	
	function( end_handler ){
		
		//init sandbox variables
		sandbox.init();
		
		//timers type init
		timers.add_timer_type("expiring_doc",function(data){
			
			db.remove_global(data.catalog, data.wid, function(err){
																							
				if(err)
					throw err;
			});
		});
		
		//configure gcm provider with apikey
		if(srv.config.app.gcm_api_key)
			evmngr.push_providers.gcm.module.configure(srv.config.app.gcm_api_key);
						
		//sandbox constraints for system catalogs:timers, events
		for( i in srv.config.db.system_catalogs ){
			for(op in api.remote){
				(function(){
					
					var lop = op;
					var system_catalog = srv.config.db.system_catalogs[i];					
					sandbox.add_constraint_pre(lop, "not_catalog_" + lop + system_catalog, sandbox.constraints.not_catalog, system_catalog);
				})();
			}
		}
		
		//sandbox constraints for default catalog:docs
		sandbox.add_constraint_pre("register","param_user",sandbox.constraints.is_required("user"))
			   .add_constraint_pre("register","param_type",sandbox.constraints.param_type("user","object"))
			   .add_constraint_pre("create","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("create","param_doc",sandbox.constraints.is_required("doc"))//create constraints.	   		   
	   		   .add_constraint_pre("create","param_type",sandbox.constraints.param_type("doc","object"))	   		   
	   		   .add_constraint_pre("create","user_catalog",sandbox.constraints.user_catalog)	   		   	   
	   		   .add_constraint_pre("dispose","param_wid",sandbox.constraints.is_required("wid"))//dispose constraints	  		   	   		   
	   		   .add_constraint_pre("dispose","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_post("dispose","is_owner",sandbox.constraints.is_owner)	   		   
	   		   .add_constraint_pre("join","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("join","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("join","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_post("join","is_joinable",sandbox.constraints.is_joinable)	   		   
	   		   .add_constraint_pre("unjoin","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("unjoin","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("unjoin","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_post("unjoin","is_joinable",sandbox.constraints.is_joinable)
	   		   .add_constraint_post("unjoin","has_joined",sandbox.constraints.has_joined)	   		  	   		  
	   		   .add_constraint_pre("remove","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("remove","param_wid",sandbox.constraints.is_required("wid"))	   		   
	   		   .add_constraint_pre("remove","param_fname",sandbox.constraints.is_required("fname"))	  
	   		   .add_constraint_pre("remove","is_reserved",sandbox.constraints.is_reserved)	   		   	   		   	   		   
	   		   .add_constraint_pre("set","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("set","param_wid",sandbox.constraints.is_required("wid"))	   		   
	   		   .add_constraint_pre("set","param_fname",sandbox.constraints.is_required("fname"))
	   		   .add_constraint_pre("set","param_value",sandbox.constraints.is_required("value"))	  
	   		   .add_constraint_pre("set","is_reserved",sandbox.constraints.is_reserved)	   		   
	   		   .add_constraint_post("set","has_joined",sandbox.constraints.has_joined)	   		   
	   		   .add_constraint_pre("push","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("push","param_wid",sandbox.constraints.is_required("wid"))	   		   
	   		   .add_constraint_pre("push","param_fname",sandbox.constraints.is_required("fname"))
	   		   .add_constraint_pre("push","param_value",sandbox.constraints.is_required("value"))	  
	   		   .add_constraint_pre("push","is_reserved",sandbox.constraints.is_reserved)	   		   
	   		   .add_constraint_post("push","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("push","field_type",sandbox.constraints.field_type("array"))	   		   
	   		   .add_constraint_pre("pop","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("pop","param_wid",sandbox.constraints.is_required("wid"))	   		   
	   		   .add_constraint_pre("pop","param_fname",sandbox.constraints.is_required("fname"))	    
	   		   .add_constraint_pre("pop","is_reserved",sandbox.constraints.is_reserved)	   		   
	   		   .add_constraint_post("pop","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("pop","field_type",sandbox.constraints.field_type("array"))	   		   
	   		   .add_constraint_pre("shift","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("shift","param_wid",sandbox.constraints.is_required("wid"))	   		   
	   		   .add_constraint_pre("shift","param_fname",sandbox.constraints.is_required("fname"))	    
	   		   .add_constraint_pre("shift","is_reserved",sandbox.constraints.is_reserved)	   		   
	   		   .add_constraint_post("shift","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("shift","field_type",sandbox.constraints.field_type("array"))	   		   
	   		   .add_constraint_pre("get","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("get","param_wid",sandbox.constraints.is_required("wid"))	   		   	   		   	   		   
	   		   .add_constraint_pre("search","user_catalog",sandbox.constraints.user_catalog)
			   .add_constraint_pre("search","param_criteria",sandbox.constraints.is_required("criteria"));	   		   	   		   	   		   	   		   	   		   
	   		   	   		   	   		   
		
		//sandbox constraints for users catalog.				
		sandbox.add_constraint_pre("create","disable_create",sandbox.constraints.is_disabled,"users")
			   .add_constraint_pre("dispose","disable_dispose",sandbox.constraints.is_disabled,"users")
			   .add_constraint_pre("join","disable_join",sandbox.constraints.is_disabled,"users")
			   .add_constraint_pre("unjoin","disable_unjoin",sandbox.constraints.is_disabled,"users")			   			   
			   .add_constraint_pre("get","user_catalog",sandbox.constraints.user_catalog,"users")
	   		   .add_constraint_pre("get","param_wid",sandbox.constraints.is_required("wid"),"users")	   		   	   		   
	   		   .add_constraint_pre("get","param_fname",sandbox.constraints.is_required("fname"),"users")
	   		   .add_constraint_pre("get","is_protected_password",sandbox.constraints.is_protected("password"),"users")
	   		   .add_constraint_pre("set","is_protected_password",sandbox.constraints.is_protected("password"),"users")
	   		   
	   	//sandbox plugin_in, and plugin_out over default catalog
	   	sandbox.add_plugin_in("create","notifying_doc",sandbox.plugins.notifying_doc)	   		   	   		   
	   		   .add_plugin_in("create","extract_hashtags", sandbox.plugins.extract_hashtags("subject"))
	   		   .add_plugin_in("create","extract_keywords", sandbox.plugins.extract_keywords("subject"))	   		   	   		   	   		   	   		   
	   		   .add_plugin_out("get","rewrite_id",sandbox.plugins.rewrite_id);	   
		
		end_handler();	
}];

/*
 * Add a new init function to the server bootstrap process.
 */
srv.init.add = function( init_handler ){
	
	init_arr.push( init_handler );
}


/*
 * Add external handler for api module events. evqueue.js module adds a default handler for 
 * all primitive events related to primitive operations: ev_create, ev_join, ev_unjoin, 
 * ev_add, ev_rem, ev_set, ev_incr, ev_decr, ev_push, ev_pop, ev_pull.
 */
srv.api.events.on = function( ev_type, ret_handler ){
				
	api.on(ev_type, ret_handler);
	return srv.api.events;	
}

for(op in api.remote){
	
	(function(){
		
		var lop = op;				
		srv.api.events[lop] = {
			on: function(ret_handler){
			
				api.on("ev_api_" + lop, ret_handler);				
			}
		}
	})();
}


/*
 * Emit event as an api event.
 */
srv.api.events.emit = function( ev_type, ctx, rcpts, tag ){
			
	api.emit( ev_type, ctx, rcpts, tag );
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
		logger.debug("\nPOST %s\n%s\n%s", msg.ev_data.pathname, nutil.inspect(msg.ev_data.headers), msg.ev_data.request);
		
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
 * Load local settings, from jsa's client module
 */
var lsettings = function( settings ){
	
	try{
				
		var lconfig = require( srv.config.system.cwd + "/settings.json");
		console.log("**Reading config file '" + srv.config.system.cwd + "/settings.json'");
		for(key in lconfig)
			if(lconfig[key] !== undefined )
				settings[key] = lconfig[key];
	}catch(err){}	
	
}

/*
 * If srv.config.app is undefined then settings are loaded from file settings.json, otherwise the function
 * prints and/or overwrites these default settings (srv.config.app) with program settings (econfig). 
 * 
 */
var settings = exports.settings = function( econfig ){
	
	if( srv.config.app !== undefined && econfig && econfig.reload == CONST.ENABLE()){
			
			console.log("**Reloading config file 'settings.json'");
			delete require.cache[ process.cwd() + "/settings.json" ];
			delete require.cache[ process.cwd() + "/package.json" ];
			delete econfig.reload;
	}
	
	//load module settings.json					
	try{																										
		
		srv.config.app = _.extend(srv.config.app, require("../settings.json"));
		var _package = require( "../package.json"); 				
		srv.config.app.jsa_version = _package.version;
		srv.config.app.version = srv.config.app.version?srv.config.app.version:"No extension";
		srv.config.app.name = srv.config.app.name?srv.config.app.name:"No extension";
		console.log("**Reading config file 'jsa/settings.json' & 'jsa/package.json'");
		if(srv.config.app.httpif)
			srv.config.app.httpaddr = util.get_ip_address( srv.config.app.httpif,"IPv4" )||srv.config.app.httpaddr;
				
		srv.config.app.id = srv.config.app.id || util.get_node_id();											
	}catch(err){			
		
		throw new Error("Cannot read config file 'settings.json'");
	}
				
	try{
				
		var lconfig = require( srv.config.system.cwd + "/settings.json");
		console.log("**Reading config file '" + srv.config.system.cwd + "/settings.json'");
		_.extend(srv.config.app, lconfig);
	}catch(err){}
	
	if(typeof econfig == "object"){
		for(key in econfig){
			if(econfig[key] !== undefined){
				if(typeof econfig[key] == "number"){
					if(!isNaN(econfig[key]))
						srv.config.app[key] = econfig[key];
				}else{
					srv.config.app[key] = econfig[key];
				}
			}
		}	
	}
	//typeof econfig == "object" && _.extend(srv.config.app, econfig);			
	
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
			   	
				var err = execute_http_plugins(request, data);
				if(err){
					
					response.writeHead(err.http_code, {"Content-Type":"text/html"});
					response.end(err.http_message);
					return;
				}  			   				   	
			    
			    emit("ev_srv_req", {pathname:pathname, headers:request.headers, request:data} );			    			    
			    router.route( pathname, response, data );	
			    			    				    			   			  			    			    			    			 
			});
			
	    }else{
					
			response.writeHead( CONST.HTTP_BAD_REQUEST(), {"Content-Type":"text/html"});
			response.write("400 Bad request.");
			response.end();
	    }
	}else if(request.method == "GET"){
	    response.writeHead( CONST.HTTP_OK(),{"Content-Type":"text/html"});
	    response.write("<h1>JSA Api Server</h1>");
	    response.write("<h4>Version: " + srv.config.app.name + "@" + srv.config.app.version + " [jsa@" + srv.config.app.jsa_version +"]</h4>");
	    response.write("<h4>Uptime: " + util.uptime_hm() + "</h4>");
	    response.end();
	}
}


/*
 * System settings data structure.
 */ 
srv.config.system = {pid:process.pid, uid:process.getuid(), gid:process.getgid(), cwd:process.cwd(), node_version:process.version };


/*
 * Start bootstrap.
 * 
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
	console.log("**System settings:\n%s", prettyjson.render(srv.config.system,{keysColor:"blue"}) );
	settings(econfig);	
	console.log("**App settings:\n%s" , prettyjson.render(srv.config.app,{keysColor:"blue"}) );	  
	srv.config.app.status = CONST.STARTING();
	util.disable_console_error();
	async.series(
	[	
		function(next){//Connect db
			
			db.connect( srv.config.app, function(err,val){
				
				if(err){
					
					console.log("!!Could not connect to MongoDB".red);
					process.exit(-1);	
				}else{
					
					console.log('**MongoDb driver connected');
					next();
				}	
			});
		},
		
		function(next){
			
			msgbus.connect( srv.config.app, function(err){
				
				if(!err){
					console.log("**Subscribed to Redis bus");
					srv.config.app.bus = CONST.RUNNING();	
				}else{
					srv.config.app.bus = CONST.STOPPED();
					var msg = "!!Could not subscribe to Redis bus " + srv.config.app.redishost + ":" + srv.config.app.redisport;
					console.log(msg.red);
				}				
				next();
			});
		},
		
		function(next){//Check db collections
			
			db.prepare(srv.config.db,function(err, result){
				
				console.log("**Prepared db catalogs: {%s}", result.join(", ") );
				next();
			});
		},
		
		function(next){//Execute init functions.		
			
			async.series( init_arr, function(err){		
										
				console.log("**Executed init functions");										
				console.log("**Remote operations: {%s}", Object.keys(srv.api.config.procedures).join(", "));																																										
				next();
			});
		},
		
		function(next){//Load timers.	
			
			timers.load(function(err,n){
				
				console.log("**Loaded %d timers.",n);
				next();
			});
		},
						
		function(next){//Start httpd
						
			httpsrv.listen( srv.config.app.httpport, srv.config.app.httpaddr, function(){
				
				console.log("**Httpd listening on %s:%d", srv.config.app.httpaddr, srv.config.app.httpport);
				next();
			});
		},
		function(next){
			
			if(srv.config.app.repl_socket){
				try{
					fs.unlinkSync(srv.config.app.repl_socket);
				}catch(err){}
					
				
				net.createServer(function(socket) {
					
					socket.write("**Welcome to JSA console**\n");
					
					var cli = repl.start({
						prompt: "> ",
						input: socket,
						output: socket,
						useColors:true,
						ignoreUndefined:true    
					});
				  
					cli.on('exit', function() {
				    	socket.end();
					});
				
					cli.context.jsa = srv;
										
										
				}).listen(srv.config.app.repl_socket);
								
				console.log("**Repl listening on "  + srv.config.app.repl_socket);
				next();
				//rlwrap telnet localhost 5000
				//socat READLINE UNIX-CONNECT:/tmp/repl-socket
			}
		}
																														
	],function(){
		
		util.enable_console_error();
		console.tlog("Server started".green);
		srv.config.app.status = CONST.RUNNING();					
		emit("ev_srv_start");					
		if(ret_handler)
			ret_handler();
	});																										
			
}

/*
 * Stop http server.
 */
var stop = exports.stop = function(){
	
	if( httpsrv ){
		
		httpsrv.close();
		db.close();
		msgbus.close();
	}	
	console.tlog("Server stopped.".green);		
	delete srv.config.app.bus;
	delete srv.config.app.status;	
	emit("ev_srv_stop");	
}

exports.time = function(){
	
	return time.now();
}





