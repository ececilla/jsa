var db = require("./db");
var async = require("async");

/*
* subscribers list
*/
var subscribers = {};

var self = exports;

var get_sub = exports.get_subscription = function ( uid ){

	if( uid == undefined )
		throw new Error("Invoke with a uid");
		
	return subscribers["" + uid];
}


/*
* remove uid from the subscribers list.
*/
var rem_subscription = exports.rem_subscription = function( uid ){

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
exports.push = function( rcpt, msg ){

	if( is_subscribed(rcpt) ){
	
		var http_resp = subscribers["" + rcpt].http;
		var msg_str = JSON.stringify(msg);	
		http_resp.write( msg_str + "\n" );
		//emit("ev_eq_push", {msg_str:msg_str}, rcpt );
	}

}


/*
*
* Remote procedure to subscribe to the event queue. The socket remains open
* after this call to send events to the subscribed client.
*/
exports.subscribe = function( http_resp, params ){

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
		
	if( params.tstamp ){//create user feed
		
		var feed = [];
		db.criteria("users",{uid: params.uid},{},function(err,docs){
									
			async.forEach(docs[0].wids,function(wid,next){
				
				db.criteria("events",{"ev_data.wid":wid, ev_tstamp:{$gt:params.tstamp}},{ev_tstamp:1},function(err,events){
																							
					feed = feed.concat(events);
					next(err);
					
				});
			},function(err){
				if(err){
					
				}else{
					//sort feed and push it back					
					feed.sort(function(a,b){return a.ev_tstamp - b.ev_tstamp});
					
					for(i in feed){
						
						self.push(params.uid, feed[i]);
					}
				}
			});
			
		});
	}	
}


