var db = require("./db");
var api = require("./api");

/*
 * default handler for all events.
 */
function default_ev_handler(msg){
	
	var rcpts = msg.ev_data.doc.rcpts,
		idx = rcpts.indexOf(msg.ev_data.uid);
	if( idx != -1)
		rcpts.splice(idx,1);
		
	delete msg.ev_data.doc;
	
	for(i in rcpts){//TODO: save event to db
		
		push( rcpts[i], msg );
	}	
}


api.on("ev_create", function( msg ){
			
	var rcpts = msg.ev_data.doc.rcpts,
		idx = rcpts.indexOf(msg.ev_data.uid);
	if( idx != -1)
		rcpts.splice(idx,1);
		
	delete msg.ev_data.doc.rcpts;
	
	for(i in rcpts){//TODO: save event to db
		
		push( rcpts[i], msg );
	}	
});


/*
 * handler for ev_join event type.
 */
api.on("ev_join", function( msg ){
			
	default_ev_handler( msg );
});


/*
 * handler for ev_add event type.
 */
api.on("ev_add", function( msg ){
			
	default_ev_handler( msg );
});

/*
 * handler for ev_rem event type.
 */
api.on("ev_rem", function( msg ){
			
	default_ev_handler( msg );
});



/*
 * handler for the ev_set event type.
 */
api.on("ev_set",function( msg ){
	
	default_ev_handler(msg);
});

/*
 * handler for the ev_incr event type.
 */
api.on("ev_incr",function( msg ){
	
	default_ev_handler(msg);
});

/*
 * handler for the ev_decr event type.
 */
api.on("ev_decr",function( msg ){
	
	default_ev_handler(msg);
});

/*
 * handler for the ev_push event type.
 */
api.on("ev_push",function( msg ){
	
	default_ev_handler(msg);
});

/*
 * handler for the ev_pop event type.
 */
api.on("ev_pop",function( msg ){
	
	default_ev_handler(msg);
});

/*
 * handler for the ev_pull event type.
 */
api.on("ev_pull",function( msg ){
	
	default_ev_handler(msg);
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


/*
 * remove uid from the subscribers list.
 */
function _rem( uid ){
	
	delete subscribers["" + uid];
		
}

/*
 * Add uid to the subscribers list.
 */
function _add( uid, http_resp ){
	
	subscribers["" + uid] = {http:http_resp};		
}

/*
 * is subscriber uid connected?
 */
function _connected( uid ){
	
	return subscribers["" + uid] != undefined;
}



/*
 * push message to subscriber.
 */
function push( rcpt, msg ){
	
	if( _connected(rcpt) ){		
		
		var http_resp = subscribers["" + rcpt].http;															
		http_resp.write( JSON.stringify(msg) + "\n" );								
	}
}


/*
 * 
 * Llamada RPC para suscribirse a la cola de eventos.
 */
//TODO: refactorizar el codigo de suscripcion.
exports.subscribe = function( http_resp, params ){
		
				
	_add(params.uid, http_resp);
				
	http_resp.on("close", function(){ 
		
		console.log("client " + params.uid + " closed");		
		_rem(params.uid);	
		console.log( http_resp.socket.address() );			
	});		
	
	
	http_resp.connection.on("error", function(ex){
		
		http_resp.connection.destroy();				
		
	});																							
			
	if( params.tstamp )
		push_events(params.uid, params.tstamp);
						
}


/*
 * Recuperamos los eventos del usuario uid desde la marca temporal ts y se los enviamos.
 * 
 */
function push_events( uid, tstamp ){
	
	//recuperamos los eventos de la base de datos	
	db.selectObjectsWithOrder("events",{ev_rcpt:uid, "ev_msg.ev_tstamp":{$gt:tstamp}},{},{"ev_msg.ev_tstamp":1},function(err,results){
		
		for(i in results)
			push(uid, results[i].ev_msg);
				
	});
	
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