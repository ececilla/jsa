var m = require("moment");
var db = require("./db");
var api = require("./api");

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
 * gets inner field of the object
 */
var get_field = exports.get_field =  function( obj, fname ){
		
	if( obj == undefined )
		return undefined;
			
	var idx = fname.indexOf(".");	
	if(  idx != -1 ){
						
		obj = obj[fname.substr(0,idx)];
		fname = fname.substr(idx+1,fname.length-1);				
		return get_field(obj,fname);
	}else		
		return obj[fname];	
		
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
 * var dummy = {x:{w:[1,2,{z:6,t:[9,8,7,6,5,4,3]}],s:7},y:"test"}
 */
var del_field = exports.del_field = function(obj, fname ){
	
	if( obj == undefined )
		return;
		
	var idx = fname.indexOf(".");	 
	if(  idx != -1 ){
		
		var cfield = fname.substr(0,idx);															
		if( obj[cfield] == undefined )
			obj[cfield] = {};
		obj = obj[cfield];		 
		fname = fname.substr(idx+1);				
										
		del_field( obj, fname );
	}else{	//remove field
		
		var index = parseInt(fname);
		if(isNaN(index))
			delete obj[fname];
		else
			obj.splice(index,1);				
				
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
		ctx.params.wid = ctx.params.url.substring(slash_pos+1, dots_pos);
		ctx.params.fname = ctx.params.url.substring(dots_pos+1, end_pos);
		
		if(ctx.params.catalog == "")
			delete ctx.params.catalog;
		if(ctx.params.wid == "")
			delete ctx.params.wid;
		if(ctx.params.fname == "")
			delete ctx.params.fname;				
		
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



