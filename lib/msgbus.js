var redis = require("redis");
var async = require("async");

var CONST = require("./constants");

/*
 * buitlt-in event emitter for bus events.
 */
var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();
var cli_sub = null;
var cli_pub = null;
var redis_channel_name = "ev_bus";

/*
 * Connect client for incoming messages.
 */
function connect_sub_client(config, ret_handler){
			
	cli_sub = redis.createClient(config.redisport, config.redishost);
	cli_sub.max_attempts = CONST.REDIS_MAX_ATTEMPTS();
		
	cli_sub.on("connect",function(){
				
		cli_sub.subscribe(redis_channel_name);		
	});		
	
	cli_sub.on("subscribe",function(channel){
				
		ret_handler(null);
	});
	
	cli_sub.on("message", function(channel, message){
		
		var data = JSON.parse(message);
		emitter.emit("ev_evbus_message", data);
	})
	
	cli_sub.on("error", function(){
					
		if(cli_sub.attempts == cli_sub.max_attempts)					
			ret_handler("error connecting redis");	
	});
	
}

/*
 * Connect client for outgoing messages.
 */
function connect_pub_client(config, ret_handler){
	
	cli_pub = redis.createClient(config.redisport, config.redishost);
	cli_pub.max_attempts = 5;
		
	cli_pub.on("connect",function(){
				
		ret_handler(null);		
	});
	
	cli_pub.on("error", function(){
					
		if(cli_pub.attempts == cli_pub.max_attempts)					
			ret_handler("error connecting redis");	
	});
}

/*
 * Connect pub and sub clients to the bus.
 */
exports.connect = function( config, ret_handler ){
	
	if(!config.redisport || !config.redishost ){
		
		ret_handler("not configured");
		return;
	}
	
	async.parallel([
		function(callback){
				
				connect_pub_client(config,function(err){
					
					callback(err);
				})
		},
		function(callback){
				
				connect_sub_client(config,function(err){
					
					callback(err);
				})
		}		
	],  function(err, results){
		
		ret_handler(err);
	});
		
}

/*
 * Close connections to redis bus
 */
exports.close  = function(){
	
	cli_pub.end();
	cli_sub.end();
}

/*
 * publish data to redis bus.
 */
exports.publish = function( data ){
	
	var data_str = JSON.stringify(data);
	cli_pub.publish( redis_channel_name, data_str);
	
}

exports.on = function( ret_handler ){
	
	emitter.on("ev_evbus_message", function( data ){
							
		ret_handler( data );
	});		
}


