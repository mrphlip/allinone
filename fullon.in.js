function Fullscreen()
{
	this.shouldresize = utils.getPref('resize', true);
	this.noscale = utils.getPref('noscale', false);
}
Fullscreen.prototype.init = function init()
{
	this.setting_main = globals.modules.settingspane.addCheckbox('resize', "Resize flash to full-screen", "Resizes the toon so it fills the entire window", this.shouldresize);
	this.setting_noscale = globals.modules.settingspane.addCheckbox('noscale', "Show behind the black", "Lets you see what's happening beyond the frames", this.noscale, this.setting_main);
	
	if (!globals.flashmovie)
		return;

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
	if (globals.modules.subtitles.subtitleholder)
	{
		a = document.defaultView.getComputedStyle(globals.modules.subtitles.subtitleholder, null);
		dh -= parseInt(a.height,10);
		dh -= parseInt(a.marginTop,10);
		dh -= parseInt(a.marginBottom,10);
	}
	if (globals.modules.subtitles.errorsholder)
	{
		a = document.defaultView.getComputedStyle(globals.modules.subtitles.errorsholder, null);
		dh -= parseInt(a.height,10);
		dh -= parseInt(a.marginTop,10);
		dh -= parseInt(a.marginBottom,10);
	}
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
	utils.whenLoaded(() => {
		playercomm.setScaleMode(globals.flashmovie, scaleMode);
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
