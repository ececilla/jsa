var request = require("supertest"),
    express  = require("express"),
    endpoint = require("../lib/connect-rpc")

var app = express();
app.get("/rpc",function(req,res){

	res.send(200,{name:"tobi"});
});

request(app)
	.get("/rpc")
	.expect(200)
