//built-in modules
var http = require("http");
var url = require("url");
var qs = require("querystring");

//external modules
var async = require("async");
var prettyjson = require('prettyjson');

//custom modules
var router = require("./router");
var sandbox = require("./sandbox");
var db = require("./db");
var eq = require("./evqueue");
var api = require("./api");
var util = require("./util");
var time = require("./time");
var timers = require("./timers");
var evbus = require("./evbus");
var CONST = require("./constants");

/*
 * built-in event emitter for own events.
 */
var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();

var srv = exports;


/*
 * Server namespace 
 */
srv.events = {};
srv.config = { 	system:{}, 				 				
				db:{
					system_catalogs:["events", "timers"],
					user_catalogs:["docs","users"],
					default_catalog : "docs"
				} 
			};
srv.init = {};			
srv.api = { config:{procedures:{}}, events:{} };
srv.eq = { events:{} };
srv.db = {select: db.select, save: db.save, criteria: db.criteria};

/*
 * Make remote api functions public, so can call them from front module server.js:
 * 
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


srv.api.config.add_plugin = function( proc_name, plugin_name, func_handler ){
	
	sandbox.add_plugin(proc_name, plugin_name, func_handler );
}

srv.api.config.add_constraint_post = function( proc_name, cons_name, func_handler ){
	
	sandbox.add_constraint_post( proc_name, cons_name, func_handler );
}

srv.api.config.add_constraint_pre = function( proc_name, cons_name, func_handler ){
	
	sandbox.add_constraint_pre( proc_name, cons_name, func_handler );
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
 * This function is where all new operations will be added or init stuff will be coded.
 * When all init stuff is done must call ret_handler to signal the end of the init process.
 */
var init_arr = [
	
	function( end_handler ){
		
		//timers type init
		timers.add_timer_type("expiring_doc",function(data){
			
			db.remove_global(data.catalog, data.wid, function(err){
																							
				if(err)
					throw err;
			});
		});
		
		//sandbox init
		sandbox.add_constraint_pre("create","param_uid",sandbox.constraints.is_required("uid"))//create constraints.
	   		   .add_constraint_pre("create","param_doc",sandbox.constraints.is_required("doc"))
	   		   .add_constraint_pre("create","not_system_catalog",sandbox.constraints.not_system_catalog)
	   		   .add_constraint_pre("create","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_post("create","param_type",sandbox.constraints.param_type("doc","object"))	   
	   		   .add_constraint_pre("dispose","param_wid",sandbox.constraints.is_required("wid"))//dispose constraints
	  		   .add_constraint_pre("dispose","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("dispose","not_system_catalog",sandbox.constraints.not_system_catalog)
	   		   .add_constraint_pre("dispose","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_post("dispose","is_owner",sandbox.constraints.is_owner)
	   		   .add_constraint_pre("join","not_system_catalog",sandbox.constraints.not_system_catalog)//join constraints
	   		   .add_constraint_pre("join","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("join","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("join","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_post("join","is_joinable",sandbox.constraints.is_joinable)
	   		   .add_constraint_pre("unjoin","not_system_catalog",sandbox.constraints.not_system_catalog)//unjoin constraints
	   		   .add_constraint_pre("unjoin","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("unjoin","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("unjoin","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_post("unjoin","is_joinable",sandbox.constraints.is_joinable)
	   		   .add_constraint_post("unjoin","has_joined",sandbox.constraints.has_joined)	   		  
	   		   .add_constraint_pre("remove","not_system_catalog",sandbox.constraints.not_system_catalog)//remove constraints
	   		   .add_constraint_pre("remove","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("remove","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("remove","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("remove","param_fname",sandbox.constraints.is_required("fname"))	  
	   		   .add_constraint_pre("remove","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("remove","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("remove","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("set","not_system_catalog",sandbox.constraints.not_system_catalog)//set constraints
	   		   .add_constraint_pre("set","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("set","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("set","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("set","param_fname",sandbox.constraints.is_required("fname"))
	   		   .add_constraint_pre("set","param_value",sandbox.constraints.is_required("value"))	  
	   		   .add_constraint_pre("set","is_reserved",sandbox.constraints.is_reserved)	   		   
	   		   .add_constraint_post("set","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("push","not_system_catalog",sandbox.constraints.not_system_catalog)//push constraints
	   		   .add_constraint_pre("push","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("push","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("push","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("push","param_fname",sandbox.constraints.is_required("fname"))
	   		   .add_constraint_pre("push","param_value",sandbox.constraints.is_required("value"))	  
	   		   .add_constraint_pre("push","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("push","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("push","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("push","field_type",sandbox.constraints.field_type("array"))
	   		   .add_constraint_pre("pop","not_system_catalog",sandbox.constraints.not_system_catalog)//pop constraints
	   		   .add_constraint_pre("pop","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("pop","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("pop","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("pop","param_fname",sandbox.constraints.is_required("fname"))	    
	   		   .add_constraint_pre("pop","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("pop","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("pop","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("pop","field_type",sandbox.constraints.field_type("array"))
	   		   .add_constraint_pre("shift","not_system_catalog",sandbox.constraints.not_system_catalog)//shift constraints
	   		   .add_constraint_pre("shift","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("shift","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_pre("shift","param_uid",sandbox.constraints.is_required("uid"))
	   		   .add_constraint_pre("shift","param_fname",sandbox.constraints.is_required("fname"))	    
	   		   .add_constraint_pre("shift","is_reserved",sandbox.constraints.is_reserved)
	   		   .add_constraint_post("shift","exists",sandbox.constraints.field_exists)
	   		   .add_constraint_post("shift","has_joined",sandbox.constraints.has_joined)
	   		   .add_constraint_post("shift","field_type",sandbox.constraints.field_type("array"))
	   		   .add_constraint_pre("get","not_system_catalog",sandbox.constraints.not_system_catalog)//get constraints
	   		   .add_constraint_pre("get","user_catalog",sandbox.constraints.user_catalog)
	   		   .add_constraint_pre("get","param_wid",sandbox.constraints.is_required("wid"))
	   		   .add_constraint_post("get","exists",sandbox.constraints.field_exists)
	   		   .add_plugin("create","notifying_doc",sandbox.plugins.notifying_doc)
	   		   .add_plugin("create","url_transform", sandbox.plugins.url_transform)
	   		   .add_plugin("dispose","url_transform", sandbox.plugins.url_transform)
	   		   .add_plugin("join","url_transform", sandbox.plugins.url_transform)
	   		   .add_plugin("unjoin","url_transform", sandbox.plugins.url_transform)	   		   
	   		   .add_plugin("remove","url_transform", sandbox.plugins.url_transform)
	   		   .add_plugin("set","url_transform", sandbox.plugins.url_transform)
	   		   .add_plugin("push","url_transform", sandbox.plugins.url_transform)
	   		   .add_plugin("pop","url_transform", sandbox.plugins.url_transform)
	   		   .add_plugin("shift","url_transform", sandbox.plugins.url_transform)
	   		   .add_plugin("get","url_transform", sandbox.plugins.url_transform);
				
		end_handler();	
}];


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
 * If srv.config.app is undefined then settings are loaded from file settings.json, otherwise the function
 * prints and/or overwrites these default settings (srv.config.app) with program settings (econfig). 
 * 
 */
var settings = exports.settings = function( econfig ){
	
	if( srv.config.app == undefined ){
				
		try{												
			console.log("**Reading config file 'settings.json'");
			srv.config.app = require("../settings.json");			
			srv.config.app.version = require("../package.json").version;											
		}catch(err){			
			
			throw new Error("Cannot read config file 'settings.json'");
		}	
	}else if( typeof econfig == "object" && econfig.reload == CONST.ENABLE()){
		
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
	console.log("**System settings:\n%s", prettyjson.render(srv.config.system,{keysColor:"white"}) );
	settings(econfig);
	console.log("**App settings:\n%s" , prettyjson.render(srv.config.app,{keysColor:"white"}) );	  
	

	async.series(
	[	
		function(next){//Connect db
			
			db.connect( srv.config.app, function(err,val){
				
				if(err)
					throw err;
				else{
					
					console.log('**MongoDb driver connected');
					next();
				}	
			});
		},
		
		function(next){
			
			evbus.connect( srv.config.app, function(err){
				
				if(!err){
					console.log("**Subscribed to Redis bus");
					srv.config.app.bus = CONST.RUNNING();	
				}else{
					srv.config.app.bus = CONST.STOPPED();
					console.log("!!Could not subscribe to Redis bus");
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
			
			async.series( init_arr, function(err, results){		
										
				console.log("**Executed init functions");										
				console.log("**Remote operations: {%s}", Object.keys(jsa.api.config.procedures).join(", "));																																										
				next();
			});
		},
		
		function(next){//Load timers.	
			
			timers.load(function(n){
				
				console.log("**Loaded %d timers.",n);
				next();
			});
		},
						
		function(next){//Start httpd
			
			httpsrv.listen( srv.config.app.httpport, srv.config.app.httpaddr, function(){
				
				console.log("**Httpd listening on %s:%d", srv.config.app.httpaddr, srv.config.app.httpport);
				next();
			});
		}
																														
	],function(){
		
		console.tlog("Server started");
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
		evbus.close();
	}	
	console.tlog("Server stopped.");		
	srv.config.app.status = CONST.STOPPED();
	emit("ev_srv_stop");	
}





