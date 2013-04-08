var sandbox = require("sandboxed-module");

exports["gcmpush.push:not configured"] = function(test){
	
	var flag = 1;
	var gcm = sandbox.require("../lib/gcmpush",{
		requires:{"./util":{
							http_post: function(options, msg, ret_handler){
								
								flag = 0; //not reached						
							}
						 } 
		}
	});
	var push_ids = ["BPA92bHkzYrSYGBwJOq8PejM4s81tY5LzkocY53O-m-Ndy00ACFKzoSQPCDjq9W2DhDIJTZFjVNYix8zpeO_bjRxN7vQC7AC1NzMfqTwKJaUV5c4NWU1E8KCAThRitAgzoTT4aw-QwUx"];
	var push_msg = {test:1};
	
	gcm.push(push_ids, push_msg,function(err,val){
		
		test.equal(err,"apikey not configured for gcm push provider");
		test.equal(val,null);
		test.ok(flag);
		test.expect(3);
		test.done();
	});
}


exports["gcmpush.push"] = function(test){
	
	var gcm = sandbox.require("../lib/gcmpush",{
		requires:{"./util":{
							http_post: function(options, msg, ret_handler){
								
								test.deepEqual(options,{host:"android.googleapis.com",
														port:80,
														path:"/gcm/send",
														method:"POST",
														headers:{
															"Content-Type":"application/json",
															Authorization:"key=BIzaSyCP9KHF9HAXoMrDte7OECV5OM2xw88KnfG"
														}});
								
								test.deepEqual(JSON.parse(msg),{registration_ids:["BPA92bHkzYrSYGBwJOq8PejM4s81tY5LzkocY53O-m-Ndy00ACFKzoSQPCDjq9W2DhDIJTZFjVNYix8zpeO_bjRxN7vQC7AC1NzMfqTwKJaUV5c4NWU1E8KCAThRitAgzoTT4aw-QwUx"],data:{test:1}} );
								setTimeout(function(){
									ret_handler('{"multicast_id":5658979621151563815,"success":1,"failure":0,"canonical_ids":0,"results":[{"message_id":"0:1365386920067586%a6ca02fdf9fd7ecd"}]}');
								},500);							
							}
						 } 
		}
	});
	var push_ids = ["BPA92bHkzYrSYGBwJOq8PejM4s81tY5LzkocY53O-m-Ndy00ACFKzoSQPCDjq9W2DhDIJTZFjVNYix8zpeO_bjRxN7vQC7AC1NzMfqTwKJaUV5c4NWU1E8KCAThRitAgzoTT4aw-QwUx"];
	var push_msg = {test:1};
	gcm.configure("BIzaSyCP9KHF9HAXoMrDte7OECV5OM2xw88KnfG")
	gcm.push(push_ids, push_msg,function(err,val){
		
		test.equal(err,null);
		test.deepEqual(val,{multicast_id:5658979621151563815, success:1, failure:0, canonical_ids:0, results:[{message_id:"0:1365386920067586%a6ca02fdf9fd7ecd"}]} );
		test.expect(4);
		test.done();
	});
}
