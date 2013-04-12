var api = require("./api");
var util = require("./util");
var time = require("./time");

var eq = require("./evqueue");
var CONST = require("./constants");

var _ = require("underscore");
var async = require("async");

/*
 * built-in event emitter for own events.
 */
var EventEmitter = require("events").EventEmitter,
	emitter = new EventEmitter();


var push_providers = exports.push_providers =  {
	
	web:{ 
		module:require("./localpush"),
	  	is_batch:false
	},
	gcm:{
		module:require("./gcmpush"),
		is_batch:true	
	}	
						
};


/*
 * Add a push provider.
 */
exports.add_push_provider = function( provider_name, provider, is_batch ){
	
	is_batch = is_batch || false;
		
	push_providers[provider_name] = {
										module:provider,
										is_batch: is_batch
									};	
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
	if(msg.ev_tag)
		ev_msg.ev_tag = msg.ev_tag;
	
	async.series(
		[
			function(next){//save event into journal
							
				eq.save(ev_msg,function(err){
					
					next(err);
				});	
			},
			function(next){//process push for non-batch push providers
				
				if(rcpts && rcpts.length > 0){
					_.each( rcpts, function(rcpt){
														
						if( !push_providers[rcpt.push_type].is_batch ){								
							if(rcpt.ev_types){								
								if( _.contains(rcpt.ev_types,ev_msg.ev_type) ) 
									push_providers[rcpt.push_type].module.push( rcpt.push_id, ev_msg );
									
							}else
								push_providers[rcpt.push_type].module.push( rcpt.push_id, ev_msg );
						}						
					});	
				}
				next();
				
			},
			function(next){ //process push for batch push providers
								
				_.each(push_providers,function(push_provider, provider_type){
								
						if( push_provider.is_batch ){
								
							var push_ids =	 _.chain(rcpts)
											  .filter(function(rcpt){//filter provider type
													
													return rcpt.push_type == provider_type;													
											 }).filter(function(rcpt){//filter event type
											 		
											 		if(!rcpt.ev_types)
											 			return true;
											 		else
											 			return _.contains(rcpt.ev_types,ev_msg.ev_type);												 		
											 }).map(function(rcpt){//get rid of structure and get push_id only
														
													return rcpt.push_id;
											 }).value();
							if(!_.isEmpty(push_ids))					 
								push_provider.module.push( push_ids, ev_msg);						  			
						}
					
				});
				
				next();	
			}
		],function( err ){
			
		}				
	);	
}


/*
 * handler for ev_api_register event type
 */
api.on("ev_api_register", function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );

});


/*
 * handler for av_api_create event type
 */
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
 * handler for ev_api_search event type
 */
api.on("ev_api_search",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});

/*
 * handler for ev_api_signal event type
 */
api.on("ev_api_signal",function( msg, rcpts ){
	
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
 * emit an event as it was generated inside the evmanager.
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
	
	push_providers.web.module.subscribe(http_resp, params);
	
								
}

