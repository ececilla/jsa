#!/usr/bin/env node-dev

	var server = require("./server");		
	//var cluster = require("cluster");
	//worker = null;
	
	//Arrancamos el servidor de comandos y el servidor de eventos.
	server.startComServer( 8888 );
	server.startEvServer( 8889 );
	
/*	
	if(cluster.isMaster){//worker.send({msg:"test"});worker.on("message",callback)
		
		//Servidor comandos		
		worker = cluster.fork();
		worker.on('message',function(msg){
				
				console.log("message from worker:" + JSON.stringify(msg));
		});
		
		var cport = 8888;	
		server.startComServer( router.route, handle, cport );
	}else{//process.send;process.on
		
		//servidor eventos
		var eport = 8889;	
		process.on("message", function(msg){
			
			//Hacer un emit del evento para el objeto en este proceso que le interese.
			console.log("message from master:" + JSON.stringify(msg));
		});
		server.startEvServer( router.route, handle, eport );		
	}
*/

/*
 Tener una conexion a la base de datos.
	

My solution:

getClient = function(cb) {
    if(typeof client !== "undefined") {
        return cb(null, client);
    } else {
        db.open(function(err, cli) {
            client = cli;
            getClient(cb);
        });
    }
}

Now, instead of

db.open(function(err, client) {
    ...stuff...
});

Do:

getClient(function(err, client) {
    ...stuff...
});
*/

