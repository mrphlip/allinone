function Fullscreen()
{
}
Fullscreen.prototype.init = function init()
{
	if (!globals.flashmovie)
		return;
	
	// load settings
	this.shouldresize = utils.getPref('resize', true);
	this.noscale = utils.getPref('noscale', false);

	// prepare settings checkboxes
	var settingrow = document.createElement('li');
	globals.modules.settingspane.settingslist.appendChild(settingrow);
	var settingcheckbox = document.createElement('input');
	this.setting_main = settingcheckbox;
	settingcheckbox.type = 'checkbox';
	settingcheckbox.checked = this.shouldresize;
	settingcheckbox.title = "Resizes the toon so it fills the entire window";
	settingcheckbox.id = 'setting_resize';
	// settingcheckbox.addEventListener('click', enabledisable, false);
	settingrow.appendChild(settingcheckbox);
	var settinglabel = document.createElement('label');
	settinglabel.htmlFor = 'setting_resize';
	settinglabel.appendChild(document.createTextNode("Resize flash to full-screen"));
	settinglabel.title = settingcheckbox.title;
	settingrow.appendChild(settinglabel);
	
	var subsetting = document.createElement('ul');
	settingrow.appendChild(subsetting);
	var subsettingrow = document.createElement('li');
	subsetting.appendChild(subsettingrow);
	settingcheckbox = document.createElement('input');
	this.setting_noscale = settingcheckbox;
	settingcheckbox.type = 'checkbox';
	settingcheckbox.checked = this.noscale;
	settingcheckbox.title = "Lets you see what's happening beyond the frames";
	settingcheckbox.id = 'setting_noscale';
	subsettingrow.appendChild(settingcheckbox);
	settinglabel = document.createElement('label');
	settinglabel.htmlFor = 'setting_noscale';
	settinglabel.appendChild(document.createTextNode("Show behind the black"));
	settinglabel.title = settingcheckbox.title;
	subsettingrow.appendChild(settinglabel);
	
	this.initwidth = globals.flashmovie.width;
	this.initheight = globals.flashmovie.height;
	if (this.initwidth.toString().indexOf('%') >= 0 || this.initwidth.toString().indexOf('%') >= 0)
	{
		this.isPercentage = true;
		this.aspect = 1.0;
	}
	else
	{
		this.isPercentage = false;
		this.aspect = this.initwidth / this.initheight;
	}
	window.addEventListener('resize', this.doResize.bind(this), true);
	this.doResize();
	if (this.noscale)
		this.setScaleMode("noScale");
};
Fullscreen.prototype.doResize = function doResize()
{
	if (!globals.flashmovie)
		return;
	
	if (!this.shouldresize)
	{
		globals.flashmovie.style.width = this.initwidth + "px";
		globals.flashmovie.style.height = this.initheight + "px";
		if (globals.modules.seekbar.seekbar)
			globals.modules.seekbar.seekbar.style.width = Math.max(this.initwidth, 450) + "px";
		return;
	}
	
	var dw = window.innerWidth;
	var dh = window.innerHeight;

	var a = document.defaultView.getComputedStyle(document.body, null);
	// parseInt will take the number part at the start, turning eg "10px" into 10
	dw -= parseInt(a.marginLeft,10);
	dw -= parseInt(a.marginRight,10);
	dh -= parseInt(a.marginTop,10);
	dh -= parseInt(a.marginBottom,10);

	if (globals.navbar)
	{
		a = document.defaultView.getComputedStyle(globals.navbar, null);
		dh -= parseInt(a.height,10);
		dh -= parseInt(a.marginTop,10);
		dh -= parseInt(a.marginBottom,10);
	}
	if (globals.modules.seekbar.seekbar)
	{
		a = document.defaultView.getComputedStyle(globals.modules.seekbar.seekbar, null);
		dh -= parseInt(a.height,10);
		dh -= parseInt(a.marginTop,10);
		dh -= parseInt(a.marginBottom,10);
	}
	/*
	if (subtitleholder)
	{
		a = document.defaultView.getComputedStyle(subtitleholder, null)
		dh -= parseInt(a.height,10);
		dh -= parseInt(a.marginTop,10);
		dh -= parseInt(a.marginBottom,10);
	}
	if (transcriptErrors)
	{
		a = document.defaultView.getComputedStyle(transcriptErrors, null)
		dh -= parseInt(a.height,10);
		dh -= parseInt(a.marginTop,10);
		dh -= parseInt(a.marginBottom,10);
	}
	*/
	// enforce a (rather small) minimum size, regardless of how much crap is squeezed below the frame
	if (dw < 100) dw = 100;
	if (dh < 100) dh = 100;
	// if it was a percentage size, or we're looking outside the frame, just fill the whole window.
	// otherwise, keep the aspect ratio correct... "touch inside" style.
	if (!this.isPercentage && !this.noscale)
	{
		if(dw <= dh * this.aspect)
			dh = Math.floor(dw / this.aspect);
		else
			dw = Math.floor(dh * this.aspect);
	}

	// set embed's size
	globals.flashmovie.style.width = dw + "px";
	globals.flashmovie.style.height = dh + "px";
	if (globals.modules.seekbar.seekbar)
		globals.modules.seekbar.seekbar.style.width = Math.max(dw, 450) + "px";
};
Fullscreen.prototype.setScaleMode = function setScaleMode(scaleMode)
{
	utils.whenLoaded(function(){
		globals.flashmovie.SetVariable("Stage.scaleMode", scaleMode);
	});
};
Fullscreen.prototype.updateSettings = function updateSettings()
{
	this.shouldresize = this.setting_main.checked;
	utils.setPref("resize", this.shouldresize);
	var old_noscale = this.noscale;
	this.noscale = this.setting_noscale.checked;
	utils.setPref("noscale", this.noscale);
	this.doResize();
	if (this.noscale && !old_noscale)
		this.setScaleMode("noScale");
	else if (!this.noscale && old_noscale)
		this.setScaleMode("showAll");
};
