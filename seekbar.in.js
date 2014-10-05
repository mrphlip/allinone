function Seekbar()
{
}
Seekbar.prototype.init = function init() {
	if (!globals.flashmovie)
		return;

	// load settings
	this.enabled = utils.getPref('seekbar', true);
	this.framecounter = utils.getPref('frames', false);
	this.zoom = utils.getPref('zoom', false);

	// prepare settings checkboxes
	this.setting_enabled = globals.modules.settingspane.addCheckbox('seekbar', "Show seek bar", "Lets you fast forward and rewind", this.enabled);
	this.setting_framecounter = globals.modules.settingspane.addCheckbox('framecounter', "Show frame counter on seek bar", "Shows you exactly where you are", this.framecounter, this.setting_enabled);
	this.setting_zoom = globals.modules.settingspane.addCheckbox('zoom', "Show zooming controls", "Allows zooming in on the toon", this.zoom, this.setting_enabled);
	
	if (this.enabled)
		this.addSeekbar();

	this.dragging = false;
	this.paused = !utils.isPlaying();
	document.addEventListener("mousemove", this.dragMousemove.bind(this), false);
	document.addEventListener("mouseup", this.release.bind(this), false);

	window.setInterval(this.update.bind(this), 50);
};
Seekbar.prototype.updateSettings = function updateSettings()
{
	if (this.enabled)
		this.removeSeekbar();
	this.enabled = this.setting_enabled.checked;
	utils.setPref("seekbar", this.enabled);
	this.framecounter = this.setting_framecounter.checked;
	utils.setPref("frames", this.framecounter);
	this.zoom = this.setting_zoom.checked;
	utils.setPref("zoom", this.zoom);
	if (this.enabled)
		this.addSeekbar();
};
Seekbar.prototype.addSeekbar = function addSeekbar()
{
	this.dragging = false;
	this.paused = !utils.isPlaying();

	this.seekbar = document.createElement("div");
	var where = globals.flashmovie;
	while(where.parentNode.tagName.toLowerCase()=="object" || where.parentNode.tagName.toLowerCase()=="embed")
		where=where.parentNode;
	utils.insertAfter(this.seekbar, where);
	this.seekbar.style.width = globals.flashmovie.width;
	this.seekbar.style.margin = "0 auto";

	var table=document.createElement("table");
	table.style.width="100%";
	this.seekbar.appendChild(table);
	var row=table.insertRow();
	this.pauseButton=document.createElement("button");
	this.pauseButtonImg = document.createElement("img");
	this.pauseButtonImg.src = globals.images.pause;
	this.pauseButton.appendChild(this.pauseButtonImg);
	var buttonCell=row.insertCell();
	buttonCell.appendChild(this.pauseButton);
	var rewindCell=row.insertCell();
	this.rewindButton=document.createElement("button");
	var img = document.createElement("img");
	img.src = globals.images.rewind;
	this.rewindButton.appendChild(img);
	rewindCell.appendChild(this.rewindButton);
	var prevCell=row.insertCell();
	this.prevButton=document.createElement("button");
	img = document.createElement("img");
	img.src = globals.images.prev;
	this.prevButton.appendChild(img);
	prevCell.appendChild(this.prevButton);

	this.slider=row.insertCell();
	this.slider.width="100%";
	var visibleSlider=document.createElement("div");
	visibleSlider.style.position="relative";
	visibleSlider.style.height="0.5em";
	visibleSlider.style.width="100%";
	visibleSlider.style.borderRadius="0.25em";
	visibleSlider.style.background="#333";
	this.slider.appendChild(visibleSlider);
	this.loadmeter=document.createElement("div");
	this.loadmeter.style.position="absolute";
	this.loadmeter.style.top=this.loadmeter.style.left = "0";
	this.loadmeter.style.height="0.5em";
	this.loadmeter.style.width="0";
	this.loadmeter.style.borderRadius="0.25em";
	this.loadmeter.style.background="#aaa";
	visibleSlider.appendChild(this.loadmeter);
	this.thumb=document.createElement("div");
	this.thumb.style.position="absolute";
	this.thumb.style.height="1em";
	this.thumb.style.width="0.5em";
	this.thumb.style.top="-0.25em";
	this.thumb.style.borderRadius="0.25em";
	this.thumb.style.background="#666";
	visibleSlider.appendChild(this.thumb);

	var nextCell=row.insertCell();
	this.nextButton=document.createElement("button");
	img = document.createElement("img");
	img.src = globals.images.next;
	this.nextButton.appendChild(img);
	nextCell.appendChild(this.nextButton);
	var ffCell=row.insertCell();
	this.ffButton=document.createElement("button");
	img = document.createElement("img");
	img.src = globals.images.ffwd;
	this.ffButton.appendChild(img);
	ffCell.appendChild(this.ffButton);

	if (this.framecounter)
	{
		var frameCell=row.insertCell();
		var framediv=document.createElement("div");
		framediv.style.background="#ccc";
		framediv.style.color="#000";
		framediv.style.fontWeight="bold";
		framediv.style.padding = "0 5px";
		frameCell.appendChild(framediv);
		this.framecountertext=document.createTextNode("");
		framediv.appendChild(this.framecountertext);
	}
	else
		this.framecountertext = false;

	if (this.zoom && !globals.modules.fullscreen.noscale)
	{
		var zoomOutCell=row.insertCell();
		this.zoomOutButton=document.createElement("button");
		// \u2212 is &minus;
		this.zoomOutButton.appendChild(document.createTextNode("\u2212"));
		zoomOutCell.appendChild(this.zoomOutButton);
		var zoomNormalCell=row.insertCell();
		this.zoomNormalButton=document.createElement("button");
		this.zoomNormalButton.appendChild(document.createTextNode("0"));
		zoomNormalCell.appendChild(this.zoomNormalButton);
		var zoomInCell=row.insertCell();
		this.zoomInButton=document.createElement("button");
		this.zoomInButton.appendChild(document.createTextNode("+"));
		zoomInCell.appendChild(this.zoomInButton);
	}
	else
	{
		this.zoomOutButton = false;
		this.zoomNormalButton = false;
		this.zoomInButton = false;
	}

	this.slider.addEventListener("mousedown", this.drag.bind(this), false);
	this.pauseButton.addEventListener("click",this.pauseUnpause.bind(this),false);
	this.rewindButton.addEventListener("click",this.rewind.bind(this),false);
	this.prevButton.addEventListener("click",this.prevFrame.bind(this),false);
	this.nextButton.addEventListener("click",this.nextFrame.bind(this),false);
	this.ffButton.addEventListener("click",this.fastforward.bind(this),false);
	if (this.zoomOutButton)
	{
		this.zoomOutButton.addEventListener("click",this.zoomOut.bind(this),false);
		this.zoomNormalButton.addEventListener("click",this.zoomNormal.bind(this),false);
		this.zoomInButton.addEventListener("click",this.zoomIn.bind(this),false);
	}

	globals.modules.fullscreen.doResize();
};
Seekbar.prototype.removeSeekbar = function removeSeekbar()
{
	if (!this.seekbar)
		return;
	this.seekbar.parentNode.removeChild(this.seekbar);
	this.seekbar = undefined;
	globals.modules.fullscreen.doResize();
};

Seekbar.prototype.update = function update()
{
	if (!this.seekbar)
		return;

	var fullSliderWidth = parseInt(document.defaultView.getComputedStyle(this.slider, null).width, 10);
	var sliderWidth = fullSliderWidth - parseInt(document.defaultView.getComputedStyle(this.thumb, null).width, 10);
	var tot = utils.totalFrames();
	if (tot > 0)
	{
		var frame = utils.currentFrame();
		if (frame < 0)
			frame = 0;
		if (this.framecountertext)
		{
			var a = tot.toString();
			var b = (frame+1).toString();
			while (b.length < a.length)
				b = "\u2007" + b; // U+2007 FIGURE SPACE
			this.framecountertext.nodeValue = b+"/"+a;
		}
		if(!this.dragging)
		{
			if (tot > 1)
				this.thumb.style.left = (frame/(tot - 1)*sliderWidth)+"px";
			else
				this.thumb.style.left = "0";
			this.paused = !utils.isPlaying();
			this.pauseButtonImg.src = this.paused ? globals.images.play : globals.images.pause;
		}
		frame = utils.framesLoaded();
		this.loadmeter.style.width = (frame/tot*fullSliderWidth)+"px";
	}
	else if (this.framecountertext)
	{
		this.framecountertext.nodeValue = "Loading...";
	}
};

Seekbar.prototype.pauseUnpause = function pauseUnpause()
{
	this.paused = utils.isPlaying();
	this.pauseButtonImg.src = this.paused ? globals.images.play : globals.images.pause;
	if (this.paused)
		globals.flashmovie.StopPlay();
	else
		globals.flashmovie.Play();
};
Seekbar.prototype.rewind = function rewind()
{
	globals.flashmovie.GotoFrame(0);
	globals.flashmovie.Play();
};
Seekbar.prototype.fastforward = function fastforward()
{
	globals.flashmovie.GotoFrame(utils.totalFrames() - 1);
};
Seekbar.prototype.prevFrame = function prevFrame()
{
	globals.flashmovie.GotoFrame(globals.flashmovie.CurrentFrame() - 1);
};
Seekbar.prototype.nextFrame = function nextFrame()
{
	globals.flashmovie.GotoFrame(globals.flashmovie.CurrentFrame() + 1);
};
Seekbar.prototype.zoomIn = function zoomIn()
{
	globals.flashmovie.Zoom(67);
};
Seekbar.prototype.zoomOut = function zoomOut()
{
	globals.flashmovie.Zoom(150);
};
Seekbar.prototype.zoomNormal = function zoomNormal()
{
	globals.flashmovie.Zoom(0);
};

Seekbar.prototype.drag = function drag(e)
{
	this.dragging=true;
	this.dragMousemove(e);
	e.preventDefault();
	return false;
};
Seekbar.prototype.dragMousemove = function dragMousemove(e)
{
	if (!this.dragging) return;
	var pageX = e.clientX + document.body.scrollLeft;
	var rect = this.slider.getBoundingClientRect();
	var thumbWidth = parseInt(document.defaultView.getComputedStyle(this.thumb, null).width, 10);
	var width = rect.right - rect.left - thumbWidth;
	var pos = (pageX - rect.left - thumbWidth/2) / width;
	if (pos < 0)
		pos = 0;
	if (pos > 1)
		pos = 1;
	var t = utils.totalFrames();
	if (t > 1)
	{
		var frame = Math.round(t * pos);
		globals.flashmovie.GotoFrame(frame);
	}
	this.thumb.style.left = (pos * width) + "px";
};
Seekbar.prototype.release = function release()
{
	if (!this.dragging) return;
	if (!this.paused)
		globals.flashmovie.Play();
	this.dragging = false;
};
