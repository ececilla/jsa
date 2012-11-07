var redis = require("redis");
var async = require("async");

var CONST = require("./constants");
var srv = require("./server");
var time = require("./time");

/*
 * buitlt-in event emitter for bus events.
 */
var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();
var cli_sub = null;
var cli_pub = null;
var redis_channel_name = "msg_bus";

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
	
	cli_sub.on("message", function(channel, message_str){
		
		var message = JSON.parse(message_str);		
		emitter.emit( "ev_msgbus_" + message.msg_type, message.data);
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
	cli_pub.max_attempts = CONST.REDIS_MAX_ATTEMPTS();
		
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

	config = config || {};	
	config.redisport = config.redisport || 6379;
	config.redishost = config.redishost || "localhost";
	
		
	async.parallel([
		function(callback){
				
				connect_pub_client(config,function(err){
					
					callback(err);
				});
		},
		function(callback){
				
				connect_sub_client(config,function(err){
					
					callback(err);
				});
		}		
	],  function(err){
		
		if(err && ret_handler)
			ret_handler(err);
		else if(err)
			console.error("!! Redis connection dropped");	
			
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

//ev_type: ev_msgbus_dummy
exports.on = function( ev_type, ret_handler ){
	
	emitter.on(ev_type, function( data ){
							
		ret_handler( {						
						ev_type: ev_type,
						ev_tstamp: time.now(),
						ev_data:data							
					 });		
	});	
		
}


