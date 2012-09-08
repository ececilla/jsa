var db = require("./db");
var api = require("./api");

/*
 * default handler for all events.
 */
function default_ev_handler(msg, rcpts){
	
	if( rcpts == undefined ){	
		
		if( !msg.ev_data.doc || !msg.ev_data.doc.rcpts )
			return;	
			
		rcpts = msg.ev_data.doc.rcpts;
		var	idx = rcpts.indexOf(msg.ev_data.uid);
		
		if( idx != -1)
			rcpts.splice(idx,1);
			
	}
	
	var doc = 	msg.ev_data.doc;
	delete msg.ev_data.doc;
	
	for(i in rcpts){
				
		save_and_push( rcpts[i], msg );
	}
	
	if( doc )	
		msg.ev_data.doc = doc;
}


api.on("ev_create", function( msg ){
	
	
	if( !msg.ev_data.doc.rcpts )
		return;
	
	var rcpts = msg.ev_data.doc.rcpts,					
		idx = rcpts.indexOf(msg.ev_data.doc.uid);
		
	if( idx != -1)
		rcpts.splice(idx,1);
		
	delete msg.ev_data.doc.rcpts;
	msg.ev_data.doc.wid = msg.ev_data.doc._id;
	delete msg.ev_data.doc._id;
	
	for(i in rcpts){
				
		save_and_push( rcpts[i], msg );
	}	
});


/*
 * handler for ev_join event type.
 */
api.on("ev_join", function( msg, rcpts ){
			
	default_ev_handler( msg, rcpts );
});


/*
 * handler for ev_unjoin event type
 */
api.on("ev_unjoin", function( msg, rcpts ){
			
	default_ev_handler( msg, rcpts );
});


/*
 * handler for ev_add event type.
 */
api.on("ev_add", function( msg, rcpts ){
			
	default_ev_handler( msg, rcpts );
});


/*
 * handler for ev_rem event type.
 */
api.on("ev_rem", function( msg, rcpts ){
			
	default_ev_handler( msg, rcpts );
});



/*
 * handler for the ev_set event type.
 */
api.on("ev_set",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


/*
 * handler for the ev_incr event type.
 */
api.on("ev_incr",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


/*
 * handler for the ev_decr event type.
 */
api.on("ev_decr",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


/*
 * handler for the ev_push event type.
 */
api.on("ev_push",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


/*
 * handler for the ev_pop event type.
 */
api.on("ev_pop",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


/*
 * handler for the ev_pull event type.
 */
api.on("ev_pull",function( msg, rcpts ){
	
	default_ev_handler( msg, rcpts );
});


api.on("ev_ping", function( msg ){
			
	var rcpt = msg.ev_data.uid;
	delete msg.ev_data.uid;
	msg.ev_data.ts3 = new Date().getTime();
	push(rcpt, msg);
	
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
		http_resp.write( JSON.stringify(msg) + "\n" );
	}
		
}

/*
 * push message to subscriber.
 */
function save_and_push( rcpt, msg ){
	
						
	db.save("events", { ev_rcpt:rcpt, ev_msg:msg, _id: Math.random().toString(36).substring(2,10) }, function(err,val){
		
		push(rcpt, msg);
	});
											
}



exports.api = {};
exports.api.listen = function( ev_type, ev_handler ){
	
	api.on(ev_type,function( msg, rcpts ){
		
		if( ev_handler == undefined )
			default_ev_handler( msg, rcpts );
		else	
			ev_handler( msg, rcpts );	
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




//Codigo de ejemplo de connection pooling del driver node.js native
/*
mongodb = require('mongodb');
 
// Define options. Note poolSize.
var serverOptions = {
  'auto_reconnect': true,
  'poolSize': 5
};
 
// Now create the server, passing our options.
var serv = new mongodb.Server('localhost', 27017, serverOptions);
 
// At this point, there is no connection made to the server.
 
// Create a handle to the Mongo database called 'myDB'.
var dbManager = new mongodb.Db('myDB', serv);
 
// NOW we initialize ALL 5 connections:
dbManager.open(function (error, db) {
  // Do something with the connection.
 
  // Make sure to call db.close() when ALL connections need
  // to be shut down.
  db.close();
});
*/



//Modificar muchos documentos a la vez y despues cerrar lal conexion a la base de datos
/*
db.open(function (err, db) {
  db.collection('foo', function (err, collection) {
    var cursor = collection.find({});
    cursor.count(function(err,count)){
      var savesPending = count;

      if(count == 0){
        db.close();
        return;
      }

      var saveFinished = function(){
        savesPending--;
        if(savesPending == 0){
          db.close();
        }
      }

      cursor.each(function (err, doc) {
        if (doc != null) {
          doc.newkey = 'foo'; // Make some changes
          db.save(doc, {safe:true}, saveFinished);
        }
      });
    })
  });
});

//Comunicacion ipc entre dos procesos node.js padre-hijo:

var cp = require('child_process');

var n = cp.fork(__dirname + '/sub.js');

n.on('message', function(m) {
  console.log('PARENT got message:', m);
});

n.send({ hello: 'world' });

And then the child script, 'sub.js' would might look like this:

process.on('message', function(m) {
  console.log('CHILD got message:', m);
});

process.send({ foo: 'bar' });

*/