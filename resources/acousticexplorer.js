/*!
	Yorkshire Water Acoustic Logger Explorer
	Created by Stuart Lowe and Dan Billingsley
	
	Requires stuquery
*/
function AcousticLogger(attr) {

	this.files = attr.files;
	this.callback = {};
	

	return this;
}

Acoustic.prototype.log = function(){
	if(this.logging){
		var args = Array.prototype.slice.call(arguments, 0);
		if(console && typeof console.log==="function") console.log('GWViewer',args);
	}
	return this;
}

Acoustic.prototype.load = function(){

	if(!this.files) return this;

	this.log('loading',this.files)
	S().ajax(this.files.acousticData,{
		'dataType': 'text',
		'this':this,
		'success': function(data,attrs){
			this.log('complete',attrs,this);
			
			
			
			
			
			if(typeof this.callback.onload==="function") this.callback.onload.call(this);
		},
		'progress': function(e,attrs){
			this.log('progress',attrs,this);
			
			
			
			if(typeof this.callback.onprogress==="function") this.callback.onprogress.call(this);
		}
	});

	S().ajax(this.files.siteVisitData,{
		'dataType': 'text',
		'this':this,
		'success': function(data,attrs){
			this.log('complete',attrs,this);
			
			
			
			
			
			if(typeof this.callback.onload==="function") this.callback.onload.call(this);
		},
		'progress': function(e,attrs){
			this.log('progress',attrs,this);
			
			
			
			if(typeof this.callback.onprogress==="function") this.callback.onprogress.call(this);
		}
	});

	return this;
}
