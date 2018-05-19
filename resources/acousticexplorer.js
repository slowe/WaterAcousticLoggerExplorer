/*!
	Yorkshire Water Acoustic Logger Explorer
	Created by Stuart Lowe and Dan Billingsley
	
	Requires stuquery
*/
function AcousticLogger(attr) {

	this.files = attr.files;
	this.callback = {};
	this.logging = true;
	this.drawn = false;
	

	return this;
}

AcousticLogger.prototype.log = function(){
	if(this.logging){
		var args = Array.prototype.slice.call(arguments, 0);
		if(console && typeof console.log==="function") console.log('AcousticExplorer',args);
	}
	return this;
}

AcousticLogger.prototype.load = function(){

	if(!this.files) return this;

	this.log('loading',this.files)
	this.data = {};
	this.loadAcoustic();
	return this;
}
AcousticLogger.prototype.loadAcoustic = function(){

	S().ajax(this.files.acousticData,{
		'dataType':'csv',
		'this':this,
		'success': function(data,attrs){
			this.log('complete',attrs,this);
			
			var lines = data.split(/[\n\r]+/);
			this.data = {};
			this.daterange = [1e20,-1e20];
			this.range = [1e20,-1e20];
			var months = {
				"Jan": "01",
				"Feb": "02",
				"Mar": "03",
				"Apr": "04",
				"May": "05",
				"Jun": "06",
				"Jul": "07",
				"Aug": "08",
				"Sep": "09",
				"Oct": "10",
				"Nov": "11",
				"Dec": "12"
			}

			// Example of the file format
			// ID,LvlSpr,02-May,01-May,30-Apr,29-Apr,28-Apr,27-Apr,26-Apr,25-Apr,24-Apr,23-Apr,22-Apr,21-Apr,20-Apr,19-Apr,18-Apr,17-Apr,16-Apr,15-Apr,14-Apr,13-Apr,12-Apr,11-Apr,10-Apr,09-Apr,08-Apr,07-Apr,06-Apr,05-Apr,04-Apr,03-Apr,02-Apr,01-Apr,31-Mar,30-Mar,29-Mar,28-Mar,27-Mar,26-Mar,25-Mar,24-Mar,23-Mar,22-Mar,21-Mar,20-Mar,19-Mar,18-Mar,17-Mar,16-Mar,15-Mar,14-Mar,13-Mar,12-Mar,11-Mar,10-Mar,09-Mar,08-Mar,07-Mar,06-Mar,05-Mar,04-Mar,03-Mar,02-Mar,01-Mar,28-Feb,27-Feb,26-Feb,25-Feb,24-Feb,23-Feb,22-Feb,21-Feb,20-Feb,19-Feb,18-Feb,17-Feb,16-Feb,15-Feb,14-Feb,13-Feb,12-Feb,11-Feb,10-Feb,09-Feb,08-Feb,07-Feb
			// 1,Lvl,13,13,13,14,14,14,14,13,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
			// 1,Spr,4,5,5,4,4,4,7,21,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
			// 2,Lvl,11,10,11,11,11,10,11,11,11,11,11,11,11,11,10,11,10,11,11,11,12,11,13,10,11,11,11,11,10,10,13,11,16,11,10,11,10,10,12,11,11,10,10,11,16,26,23,12,13,11,11,11,11,16,11,11,11,19,10,12,20,30,15,11,11,11,13,12,11,11,,,,,,,,,,,,,,,
			// 2,Spr,16,5,6,9,8,4,7,8,7,5,7,9,4,6,8,7,6,8,7,9,6,7,7,7,7,8,13,5,7,5,8,6,10,8,6,5,5,7,9,7,9,7,10,8,9,15,13,9,15,7,7,6,8,9,8,6,5,9,8,7,13,17,10,5,9,4,10,8,9,7,,,,,,,,,,,,,,,
			// 3,Lvl,17,15,15,23,15,13,26,26,20,16,14,16,14,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

			for(var i = 0; i < lines.length; i++){
				cols = lines[i].split(/,/);
				if(i==0){
					head = cols;
					// Re-write dates
					//if(!months) months = {'Jan':'01'};
					if(typeof months==="object"){
						for(var c = 0; c < cols.length; c++){
							cols[c] = cols[c].replace(/([0-9]{2})-([A-Za-z]{3})/,function(m,p1,p2){ return "2018-"+months[p2]+"-"+p1; });
							d = new Date(cols[c]);
							if(d < this.daterange[0]) this.daterange[0] = d;
							if(d > this.daterange[1]) this.daterange[1] = d;
						}
					}

				}else{
					var id = cols[0];
					var typ = cols[1];
					if(typ == "Lvl") typ = "level";
					if(typ == "Spr") typ = "spread";
					if(!this.data[id]) this.data[id] = {};
					for(var c = 2; c < cols.length; c++){
						val = parseInt(cols[c]);
						me = this.data[id][head[c]];

						if(!me) me = {};
						if(!isNaN(val)) me[typ] = val;
						if(me.level && me.spread){
							mn = me.level - Math.abs(me.spread)/2;
							mx = me.level + Math.abs(me.spread)/2;
							if(mx > 200) console.log(id,me.level,me.spread)
							if(mn < this.range[0]) this.range[0] = mn;
							if(mx > this.range[1] && mx < 100) this.range[1] = mx;
							me.diff = me.level - me.spread;
						}
						this.data[id][head[c]] = me;
					}
				}
			}

			this.loadSiteVisit();

			//if(typeof this.callback.onload==="function") this.callback.onload.call(this);
		},
		'progress': function(e,attrs){
			this.log('progress',attrs,this);
			if(typeof this.callback.onprogress==="function") this.callback.onprogress.call(this);
		}
	});
	
	return this;
}

AcousticLogger.prototype.loadSiteVisit = function(){

	S().ajax(this.files.siteVisitData,{
		'dataType': 'text',
		'this':this,
		'success': function(data,attrs){
			this.log('complete',attrs,this);
			
			var lines = data.split(/[\n\r]+/);

			// Leak Alarm,ID,Date Visited,Leak Found
			// Y,100,15/02/2018,Y
			// Y,114,16/02/2018,Y
			// Y,555,16/02/2018,Y
			this.log('siteVisitData')

			for(var i = 0; i < lines.length; i++){
				cols = lines[i].split(/,/);
				if(i==0){
					head = cols;
				}else{
					if(cols[1] && cols[2]){
						var id = cols[1];
						var al = cols[0];
						// Re-write dates
						var dt = cols[2].replace(/([0-9]{2})\/([0-9]{2})\/([0-9]{4})/,function(m,p1,p2,p3){ return p3+"-"+p2+"-"+p1; });
						var lf = cols[3];

						if(!this.data[id]) this.data[id] = {};
						if(!this.data[id][dt]) this.data[id][dt] = {};
						if(!this.data[id][dt].alarm) this.data[id][dt].alarm = new Array();
						this.data[id][dt].alarm.push({'state':al,'leakfound':lf});
					}
				}
			}

			this.init();

			if(typeof this.callback.onload==="function") this.callback.onload.call(this);
		},
		'progress': function(e,attrs){
			this.log('progress',attrs,this);
			if(typeof this.callback.onprogress==="function") this.callback.onprogress.call(this);
		}
	});

	return this;
}

AcousticLogger.prototype.init = function(){

	var el = S('#controls');
	var _obj = this;

	this.slider = { 'values': this.daterange[1] };
	sperday = 86400000;
	
	this.slider.slider = noUiSlider.create(el.find('#slider')[0], {
		'start': this.slider.values/sperday,
		'step': 1,
		'range': {'min':this.daterange[0].getTime()/sperday,'max':this.daterange[1].getTime()/sperday}
	});

	S('#dateedit').attr('min',this.daterange[0].toISOString().substr(0,10));
	S('#dateedit').attr('max',this.daterange[1].toISOString().substr(0,10));
	S('#dateedit').attr('value',this.daterange[1].toISOString().substr(0,10));
	S('#dateedit').on('change',function(e){
		d = new Date(e.currentTarget.value);
		t = d.getTime();
		_obj.slider.slider.set(t/sperday);
	});

	this.drawAll((new Date(this.slider.values)).toISOString().substr(0,10));

	this.slider.slider.on('update', function(values, handle) {
		
		var value = values[handle];
		var change = false;
		if(_obj.slider.values[handle] != parseFloat(value)) change = true;
		_obj.slider.values[handle] = parseFloat(value)*sperday;
		var val = _obj.slider.values[0];
		val = (new Date(_obj.slider.values[0])).toISOString().substr(0,10);
		if(el.find('.selected').length > 0) el.find('.selected').html(val);
		S('#dateedit').attr('value',val);
		d = new Date(_obj.slider.values[0]);
		_obj.drawAll(d.toISOString().substr(0,10))

	});
	this.slider.slider.on('set',function(e){
		d = new Date(_obj.slider.values[0]);
		_obj.drawAll(d.toISOString().substr(0,10))
	});
	
	function offset(el){
		var rect = el.getBoundingClientRect();
		return {
			top: rect.top + document.body.scrollTop,
			left: rect.left + document.body.scrollLeft
		}
	}
	var o = offset(S('#controls')[0]);

	S(document).on('scroll',function(e){
		var main = S('#main');
		var head = S('#controls');
//		console.log(o.top,main.e[0].offsetHeight,document.body.scrollTop)
		if(document.body.scrollTop > o.top && document.body.scrollTop < o.top+main.e[0].offsetHeight) S('body').addClass('fixed');
		else S('body').removeClass('fixed');
	});
	return this;
}


AcousticLogger.prototype.drawAll = function(date){
	
	if(!this.data){
		this.log('No data loaded');
		return this;
	}
	if(!date || typeof date!=="string"){
		this.log('No valid date sent')
		return this;
	}
	this.date = date;

	html = "";

	if(!this.drawn) html = "";	
	var range = this.range[1]-this.range[0];
	var balloon = S('.balloon').attr('data');

	_obj = this;
	function getTitle(id){
		d = _obj.data[id][_obj.date];
		str = id+(d.level ? ': '+d.level+' (spread = '+d.spread+')' : '');
		if(d.alarm){
			str += '<br />Alarms';
			for(var a = 0; a < d.alarm.length; a++){
				str += '<br />'+_obj.date+': ';
				if(d.alarm[a].state=="Y") str += 'alarm';
				if(d.alarm[a].state=="N") str += 'no alarm';
				if(d.alarm[a].leakfound=="Y") str += ' and leak found';
				if(d.alarm[a].leakfound=="N") str += ' and no leak';
				if(d.alarm[a].leakfound=="N-PRV") str += ' and no leak (PRV)';
			}
		}
		return str;
	}
	
	classes = ['sitevisit', 'leakfound','noleak','noleak-prv','success','fail'];
	siteVisitClass = "sitevisit";
	for(var c = 0; c < classes.length; c++){
		// Reset sitevisit class
		S('.spreadHolder.'+classes[c]).removeClass(classes[c]);
	}

	for(id in this.data){

		l = 0;
		r = 1;
		w = 0;
		alarm = false;
		title = id;
		cls = '';
		d = this.data[id][date]
		if(d && d.spread){
			mn = (d.level - d.spread/2);
			mx = (d.level + d.spread/2);
			l = (mn - this.range[0])/range;
			r = (mx - this.range[0])/range;
			if(l > 1) l = 1;
			if(r > 1) r = 1.1;
			w = r-l;
			alarm = (d.diff > 15);
			title = getTitle(id);
			//title = id+(this.data[id][date].level ? ': '+this.data[id][date].level+' (spread = '+this.data[id][date].spread+')' : '');	
			if(d.alarm){
				cls = 'sitevisit';
				if(d.alarm[0].state=="Y" && d.alarm[0].leakfound=="Y") cls += ' success';
				if(d.alarm[0].state=="N" && d.alarm[0].leakfound=="N") cls += ' success';
				if(d.alarm[0].state=="Y" && d.alarm[0].leakfound=="N") cls += ' fail';
				if(d.alarm[0].state=="N" && d.alarm[0].leakfound=="Y") cls += ' fail';
				if(d.alarm[0].leakfound=="N-PRV") cls += ' noleak-prv';
			}
		}
		if(typeof w!=="number") w = 0;

		if(!this.drawn){
			html += '<div class="elementHolder" id="sensor-'+id+'">';
			html += '<div class="spreadHolder'+(cls ? ' '+cls:'')+'">';
			html += '<div class="spread" style="filter:'+(alarm ? '':'grayscale(1)')+';left: '+(l*100).toFixed(2)+'%;width:'+(w*100).toFixed(2)+'%;white-space:nowrap;position:relative;" title="'+title+'">';
			html += '<div class="level"></div>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
		}else{
			css = {
				'width':(w*100).toFixed(2)+'%',
				'filter':(alarm ? '':'grayscale(1)')
			}
			// Only update the left value if 
			if(l > 0) css.left = (l*100).toFixed(2)+'%';
			this.data.el[id].css(css);
			if(cls) this.data.el[id].parent().addClass(cls);
			if(balloon && balloon == id) S('.balloon').html(title);
		}
	}

	if(!this.drawn){
		S('#output').html(html);
		this.data.el = {};
		for(id in this.data){
			this.data.el[id] = S('#sensor-'+id+' .spread');
			this.data.el[id].on('mouseover',{id:id},function(e){
				S('.balloon').remove();
				S(e.currentTarget).find('.level').html('<div class="balloon" data="'+e.data.id+'">'+getTitle(e.data.id)+'</div>')
			})
			this.data.el[id].parent().on('click',{id:id},function(e){
				S('.balloon').remove();
				S(e.currentTarget).find('.level').html('<div class="balloon" data="'+e.data.id+'">'+getTitle(e.data.id)+'</div>')
			})
		}
	}

	this.drawn = true;
	
	
	return this;
}

