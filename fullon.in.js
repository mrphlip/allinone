function Fullscreen()
{
	if (!globals.flashmovie)
		return;
	
	// load settings
	this.shouldresize = utils.getPref('resize', false);
	this.noscale = utils.getPref('noscale', false);

	// prepare settings checkboxes
	var settingrow = document.createElement('li');
	globals.modules.settingspane.settingslist.appendChild(settingrow);
	var settingcheckbox = document.createElement('input');
	this.setting_main = settingcheckbox
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
	settingrow = document.createElement('li');
	subsetting.appendChild(settingrow);
	settingcheckbox = document.createElement('input');
	this.setting_noscale = settingcheckbox
	settingcheckbox.type = 'checkbox';
	settingcheckbox.checked = this.noscale;
	settingcheckbox.title = "Lets you see what's happening beyond the frames";
	settingcheckbox.id = 'setting_noscale';
	settingrow.appendChild(settingcheckbox);
	var settinglabel = document.createElement('label');
	settinglabel.htmlFor = 'setting_noscale';
	settinglabel.appendChild(document.createTextNode("Show behind the black"));
	settinglabel.title = settingcheckbox.title;
	settingrow.appendChild(settinglabel);
	
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
Fullscreen.prototype.doResize = function()
{
	if (!globals.flashmovie)
		return;
	
	if (!this.shouldresize)
	{
		globals.flashmovie.width = this.initwidth;
		globals.flashmovie.height = this.initheight;
		/*if (seekbar)
			seekbar.style.width = Math.max(this.initwidth, 450) + "px";*/
		return;
	}
	
	var dw = window.innerWidth;
	var dh = window.innerHeight - 15; // things get weird sometimes... -15 to make sure we don't get scrollbars.
	/*
	if (navbar)
	{
		// parseInt will take the number part at the start, turning eg "10px" into 10
		a = document.defaultView.getComputedStyle(navbar, null);
		dh -= parseInt(a.height,10);
		dh -= parseInt(a.marginTop,10);
		dh -= parseInt(a.marginBottom,10);
	}
	if (seekbar)
	{
		a = document.defaultView.getComputedStyle(seekbar, null)
		dh -= parseInt(a.height,10);
		dh -= parseInt(a.marginTop,10);
		dh -= parseInt(a.marginBottom,10);
	}
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
		if(dw/this.aspect <= dh)
			dh = Math.floor(dw / this.aspect);
		else
			dw = Math.floor(dh * this.aspect);
	}

	// set embed's size
	globals.flashmovie.width = dw;
	globals.flashmovie.height = dh;
	/*if (seekbar)
		seekbar.style.width = Math.max(dw, 450) + "px";*/
};
Fullscreen.prototype.setScaleMode = function(scaleMode)
{
	var a = globals.flashmovie.CurrentFrame;
	if (typeof(a) == "function" || typeof(a) == "object")
		a = globals.flashmovie.CurrentFrame();
	if (typeof(a) == "number" && a >= 0 && globals.flashmovie.SetVariable)
		globals.flashmovie.SetVariable("Stage.scaleMode", scaleMode);
	else
	{
		setTimeout(this.setScaleMode.bind(this, scaleMode), 10);
	}
}
Fullscreen.prototype.noscale_end = function()
{
	var a = globals.flashmovie.CurrentFrame;
	if (typeof(a) == "function" || typeof(a) == "object")
		a = globals.flashmovie.CurrentFrame();
	if (typeof(a) == "number" && a >= 0 && globals.flashmovie.SetVariable)
		globals.flashmovie.SetVariable("Stage.scaleMode", "noScale");
	else
	{
		setTimeout(this.noscale_end.bind(this), 10);
	}
}
Fullscreen.prototype.updateSettings = function()
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
}
