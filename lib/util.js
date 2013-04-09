var db = require("./db");
var api = require("./api"); 

var crypto = require("crypto");
var util = require("util");
var fs = require("fs");
var http = require("http");

var m = require("moment");
var _ = require("underscore");

/*
 * Send data to server via HTTP POST method. 
 */
var http_post = exports.http_post = function( post_options, post_body, ret_handler ){
		
	var http_req = http.request(post_options,function(http_res){
		
		http_res.setEncoding("utf8");
		var data = "";
		http_res.on("data",function(chunk){
			
			data += chunk;			
		});
		
		http_res.on("end",function(){
			
			ret_handler( data );
		});
		
	});
	http_req.write(post_body);
	http_req.end();
		
}


/*
 * tokenize a strin into substrings.
 */
var tokenize = exports.tokenize  = function( tokens ){
	
	if(!is_array(tokens)){
		tokens = [tokens];
	}
	
	var separators = [";",",","."," "];				
	while(separators.length > 0 ){
		
		var separator = separators.pop();		
		for(var j = 0; j < tokens.length; j++){
						
			var subtokens = tokens[j].split(separator);					
			if(subtokens.length > 1){
				
				tokens.splice(j,1);
				for( var i=0; i < subtokens.length; i++){
																	
					tokens.splice(j+i,0,subtokens[i]);									
				}
				j += subtokens.length-1;				
			}							
		}		
	}

	return tokens;
}


exports.read_lines = function(rel_filename){
		
	if(rel_filename){
		
		var abs_filename = require("path").resolve(__dirname, rel_filename);	
		var lines = fs.readFileSync(abs_filename).toString().split("\n");
		return lines;
	}else
		return [];
	
}

/*
 * Check if this push_id is present in rcpts_arr
 */
exports.has_joined = function( rcpts_arr, push_id ){
	
	return _.find( rcpts_arr, function( rcpt ){ 
		
		return push_id !== undefined && rcpt.push_id == push_id;
			
	}) !== undefined;
		
}


var is_array = exports.is_array = function(obj){
	
	return util.isArray(obj);
}

var is_object = exports.is_object = function(obj){
	
	return typeof obj == "object";
}

var is_number = exports.is_number = function( obj ){
	
	return !isNaN(parseInt(obj));
}


exports.hash = function( msg ){
	
	return crypto.createHash("md5").update(msg).digest("base64");
}


exports.crypt = function( clear_msg, password ){
	
	var cipher = crypto.createCipher("des-ede3-cbc", password);
	var crypted_msg = cipher.update(clear_msg,"utf8","base64");
	crypted_msg += cipher.final("base64");
	
	return crypted_msg;

		
}

exports.decrypt = function( crypted_msg, password){
	
	var cipher = crypto.createDecipher("des-ede3-cbc", password);
	var clear_msg = cipher.update(crypted_msg,"base64","utf8");
	clear_msg += cipher.final("utf8");
	
	return clear_msg;
	
}


exports.get_node_id = function(){
	
	var ip = exports.get_ip_address("eth0","IPv4") || exports.get_ip_address("wlan0","IPv4");
	var id = require("crypto").createHash("md5").update(ip).digest("hex"); 
	return id;
	
}


exports.get_ip_address = function( iname, family ){
	
	var os = require("os");
	var ifaces = os.networkInterfaces()[iname];
	if( !ifaces )
		return undefined;
				
	if( family ){			
		for( var i = 0; i < ifaces.length; ){
						
			if(ifaces[i].family !== family ){
				ifaces.splice(i,1);
			}else
				i++;					
		}
	}
		
	if(ifaces.length > 0)
		return ifaces[0].address;
	else
		return undefined;		
	
}

/*
 * Function to generate a random string of certain length.
 */
exports.generate_rstring = function( length ){
	
	return Math.random().toString(36).substring(2,2+length);
}

/*
 * Function to clone a custom javascript object.
 */
var clone = exports.clone = function(obj){

    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = new obj.constructor(); 
    for(var key in obj)
        temp[key] = clone(obj[key]);

    return temp;
}


/*
 * gets inner field of the object, or array index:
 * get_field(obj,"sub1.sub2.4.sub3.2-5")
 */
var get_field = exports.get_field =  function( obj, fname ){
		
	if( obj == undefined )
		return undefined;
			
	var idx = fname.indexOf(".");	
	if(  idx != -1 ){ //still subfields to get
						
		obj = obj[fname.substr(0,idx)];
		fname = fname.substr(idx+1,fname.length-1);				
		return get_field(obj,fname);
	}else{//No subfield to get		
		var idxh = fname.indexOf("-");
		if(idxh != -1){
			var idxbegin = parseInt(fname.substring(0,idxh));
			var idxend = parseInt( fname.substring(idxh+1,fname.length) );
			if(isNaN(idxend))
				idxend = obj.length-1;									
						
			return obj.slice(idxbegin, idxend+1); 	
		}else
			return obj[fname];										
		
	}	
		
}


/*
 * sets the inner field of the object to the value.
 *  var x = {a:1,b:"kdjfklsdf",c:[5,6,7],d:{e:1,f:"fksdkf",g:[8,9,0]}};
 */
var set_field = exports.set_field = function(obj, fname, value ){
			
	var idx = fname.indexOf(".");
	 	
	if(  idx != -1 ){
		
		var cfield = fname.substr(0,idx);															
		if( obj[cfield] == undefined )
			obj[cfield] = {};
		obj = obj[cfield];		 
		fname = fname.substr(idx+1,fname.length-1);				
										
		set_field(obj,fname,value );
	}else{//set value		
		
		obj[fname] = value;
	}
		
}

/*
 * deletes inner field of the object.
 * ex:
 * var dummy = {x:{w:[1,2,{z:6,t:[9,8,7,6,5,4,3]}],s:7},y:"test"}
 * del_field(dummy,"x.w.t")
 */
var del_field = exports.del_field = function(obj, fname ){
	
	if( obj == undefined )
		return;
		
	var idx = fname.indexOf(".");	 
	if(  idx != -1 ){
		
		var cfield = fname.substr(0,idx);																	
		obj = obj[cfield];		 
		fname = fname.substr(idx+1);														
		del_field( obj, fname );
	}else{	//remove field
		
		var index = parseInt(fname);
		if(isNaN(index))	
			delete obj[fname];
		else if(typeof obj == "object")
			obj.splice(index,1);				
				
	}
	
}

/*
 * iterate through an object fields and nested subfields and when ocurrences of 
 * fname are found execute handler.
 * ex:
 * var foo = {x:1,s:{y:2},z:3,y:4};
 * find_field(foo,"y",function(obj,fname){obj[fname] = {dummy:obj[fname]};});
 * foo-> {x:1,s:{y:{dummy:2}},z:3,y:{dummy:4}};
 */
var find_field = exports.find_field = function(obj, fname, handler){
	
	for(var o in obj){
		
		if( o == fname )
			handler(obj,fname);
		else if( is_object(obj[o]) )
			find_field(obj[o],fname,handler);
			
	}
}

/*
 * parse url parameter into parameters catalog, wid, index.
 * 
 * params.url: #docs/50187f71556efcbb25000002:dummy.5.x is converted into:
 * params.catalog: docs
 * params.wid: 50187f71556efcbb25000002
 * params.index: dummy.5.x
 * 
 */
exports.parse_url = function(ctx){
		
	if(ctx.params.url && ctx.params.url[0] == "#"){
	
		var end_pos = ctx.params.url.length;
			
		var slash_pos = ctx.params.url.indexOf("/")>0?ctx.params.url.indexOf("/"):end_pos;
		ctx.params.catalog = ctx.params.url.substring(1,slash_pos);
		
		var dots_pos = ctx.params.url.indexOf(":")>0?ctx.params.url.indexOf(":"):end_pos;
		var url_wid = ctx.params.url.substring(slash_pos+1, dots_pos);
		ctx.params.wid = (url_wid!=="")?url_wid:ctx.params.wid;
		
		var url_fname = ctx.params.url.substring(dots_pos+1, end_pos);
		ctx.params.fname = (url_fname !== "")?url_fname:ctx.params.fname;
		
		if(ctx.params.catalog == "")
			delete ctx.params.catalog;						
		
		delete ctx.params.url;				
	} 
	delete ctx.params.url;
	
}

/*
 * Add timelog logging function to console module.
 */
console.tlog = function(){
		
	var args = Array.prototype.slice.call(arguments);
	args[0] = "[%s] " + args[0];
	args.splice(1,0,m().format("DD/MM/YYYY H:mm:ss"));
	console.log.apply(this, args);	

}

/*
 * disable console.error to forbid driver modules to log msgs.
 */
var console_error = console.error;
exports.disable_console_error = function(){
	
	console.error = function(){};
}

exports.enable_console_error = function(){
	
	console.error = console_error;
}

/*
 * returns server uptime as a string formatted as "xh,ym"
 */
exports.uptime_hm = function(uptime){
	
	var _uptime = uptime || process.uptime(),
		h = Math.floor(_uptime/3600),
		m = Math.floor((_uptime - h*3600)/60); 
	return  h + " h, " + m + " m";
}
