var api = require("./api");
var util = require("./util");
var time = require("./time");
var async = require("async");
var eq = require("./evqueue");
var CONST = require("./constants");

var _ = require("underscore");

/*
 * built-in event emitter for own events.
 */
var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();


var push_providers = {
	
	web:require("./localpush")	
		
};


/*
 * Add a push provider.
 */
exports.add_push_provider = function( provider_name, provider ){
	
		
	push_providers[provider_name] = provider;	
}


/*
 * default function for handling events.
 */
function default_ev_handler(msg, rcpts){
	
	if( !(rcpts = rcpts || util.clone(msg.ev_ctx.config.rcpts) || util.clone(msg.ev_ctx.doc.rcpts)) )//rcpts parameter takes precedence over document rcpts
		return;
	
	if(msg.ev_ctx.user)
		rcpts = _.reject( rcpts,function(rcpt){ return rcpt.push_id == msg.ev_ctx.user.push_id});
						
	var ev_msg = {ev_type: msg.ev_type, ev_tstamp: msg.ev_tstamp, ev_data: msg.ev_ctx.payload};
	
	async.series(
		[
			function(next){//save event into journal
							
				eq.save(ev_msg,function(err){
					
					next(err);
				});	
			},
			function(next){//Select push provider per user
				
				if(rcpts && rcpts.length > 0){
					async.forEach( rcpts, function(rcpt, next){
														
						push_providers[rcpt.push_type].push( rcpt.push_id, ev_msg );
						next();
					});	
				}else
					next();
				
			}
		],function( err ){
			
		}				
	);	
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
api.on("ev_api_remove", function( msg, rcpts ){
			
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
 * handler for the ev_api_shift event type.
 */
api.on("ev_api_shift",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});



/*
 * Register listeners to the evmngr events. 
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
 * Make evmngr listen for api events.
 */
exports.api = {listen : function( ev_type ){
	
		api.on(ev_type,function( msg, rcpts ){
					
			default_ev_handler( msg, rcpts );
				
		});
	}
}

exports.remote = {};

/*
 * 
 * Remote procedure to subscribe to the event queue. The socket remains open
 * after this call to send events to the subscribed client.
 */
exports.remote.subscribe = function( http_resp, params ){
	
	//TODO:select push provider to complete subscription.
	
	push_providers.web.subscribe(http_resp, params);
	
								
}

