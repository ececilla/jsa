var api = require("./api");
var db = require("./db");
var util = require("./util");
var time = require("./time");
var async = require("async");


/*
 * built-in event emitter for own events.
 */
var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();

/*
 * default function for handling events.
 */
function default_ev_handler(msg, rcpts){
	
	if( !(rcpts = rcpts || util.clone(msg.ev_ctx.doc.rcpts)) )//rcpts parameter takes precedence over document rcpts
		return;
						
	var	idx = rcpts.indexOf(msg.ev_ctx.params.uid);
	
	if( idx != -1)
		rcpts.splice(idx,1);			
				
	async.forEach( rcpts, 
		function(rcpt, next){
			
			var event = { 	ev_rcpt:rcpt, 							
							ev_msg:{									 
									ev_type: msg.ev_type,
									ev_tstamp:msg.ev_tstamp, 
									ev_data:msg.ev_ctx.payload
								} 							 
						};
			save_and_push( event, function(){next();});
			
	});
		
}


api.on("ev_api_create", function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );

});


/*
 * handler for ev_api_dispose event type.
 */
api.on("ev_api_dispose", function( msg, rcpts ){
			
	default_ev_handler( msg, rcpts );
});

/*
 * handler for ev_api_join event type.
 */
api.on("ev_api_join", function( msg, rcpts ){
			
	default_ev_handler( msg, rcpts );
});


/*
 * handler for ev_api_unjoin event type
 */
api.on("ev_api_unjoin", function( msg, rcpts ){
			
	default_ev_handler( msg, rcpts );
});



/*
 * handler for ev_api_rem event type.
 */
api.on("ev_api_rem", function( msg, rcpts ){
			
	default_ev_handler( msg, rcpts );
});



/*
 * handler for the ev_api_set event type.
 */
api.on("ev_api_set",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});



/*
 * handler for the ev_api_push event type.
 */
api.on("ev_api_push",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


/*
 * handler for the ev_api_pop event type.
 */
api.on("ev_api_pop",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


/*
 * handler for the ev_api_pull event type.
 */
api.on("ev_api_shift",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


/*
 * handler for the ev_api_ack event type.
 */
api.on("ev_api_ack",function( msg, rcpts ){
		
	//delete events before params.tstamp for params.uid
	db.remove("events",{$and:[ {"ev_msg.ev_tstamp":{$lt:msg.ev_ctx.params.tstamp}}, {ev_rcpt:msg.ev_ctx.params.uid} ]}, function(err,n){
	
		if(err)
			throw err;
	})
	
});



/*
 * subscribers list
 */
var subscribers = {};

var get_sub = exports.get_subscription = function ( uid ){
	
	if( uid == undefined )
		throw new Error("Invoke with a uid");
		
	return subscribers["" + uid];
}


/*
 * remove uid from the subscribers list.
 */
var rem_subscription = exports.rem_subscription  = function( uid ){
	
	if(uid == undefined)
		throw new Error("Must invoke with a uid");
		
	delete subscribers["" + uid];
		
}

/*
 * Add uid to the subscribers list.
 */
var add_subscription = exports.add_subscription = function( uid, http_resp ){
	
	subscribers["" + uid] = {http:http_resp};		
}

/*
 * is subscriber uid connected?
 */
var is_subscribed = exports.is_subscribed = function( uid ){
	
	if(uid == undefined)
		throw new Error("Must invoke with a uid");
		
	return subscribers["" + uid] != undefined;
}


/*
 * Send message to subscriber. 
 */
function push( rcpt, msg ){

	if( is_subscribed(rcpt) ){
			
		var http_resp = subscribers["" + rcpt].http;
		var msg_str = 	JSON.stringify(msg);														
		http_resp.write( msg_str + "\n" );
		emit("ev_eq_push", {msg_str:msg_str}, rcpt );
	}
		
}

/*
 * Save event to db and also push it to subscriber.
 */
function save_and_push( msg, ret_handler ){

	msg._id = util.generate_rstring(12);
								
	db.save("events", msg, function(err,val){
		
		push(msg.ev_rcpt, msg.ev_msg);		
		ret_handler();
	});
											
}


/*
 * Register listeners to the eq events using a delegation pattern for EventEmitter.
 * 
 */
exports.on = function( ev_type, ret_handler ){
	
	emitter.on(ev_type, function( params, rcpts ){
							
		ret_handler( {						
						ev_type:ev_type,
						ev_tstamp:time.now(),
						ev_data:params								
					 }, rcpts );
	});		
}

/*
 * emit an event as it was generated inside the eq.
 */
var emit = exports.emit =  function( ev_type, params, rcpts ){
	
	emitter.emit(ev_type, params, rcpts );
}


/*
 * Make evqueue listen for api events.
 */
exports.api = {};
exports.api.listen = function( ev_type ){
	
	api.on(ev_type,function( msg, rcpts ){
				
		default_ev_handler( msg, rcpts );
			
	});
}

exports.remote = {};

/*
 * 
 * Remote procedure to subscribe to the event queue. The socket remains open
 * after this call to send events to the subscribed client.
 */
exports.remote.subscribe = function( http_resp, params ){
	
	if( !params || params.uid == undefined ){
		
		http_resp.end();
		return;
	}	
						
	add_subscription(params.uid, http_resp);
				
	http_resp.on("close", function(){ 
		
		console.log('Client closed: [%d]', params.uid);				
		rem_subscription(params.uid);						
	});		
	
	
	http_resp.connection.on("error", function(ex){
		
		http_resp.connection.destroy();				
		
	});																							
			
	if( params.tstamp ){//retrieve valid user events: t > params.tstamp
		
		db.criteria( "events", {ev_rcpt:params.uid, "ev_msg.ev_tstamp":{$gt:params.tstamp}}, {"ev_msg.ev_tstamp":1},function(err,results){
		
			for( i in results ){
				
				push( params.uid, results[i].ev_msg );
			}
		});
	}
		
						
}

