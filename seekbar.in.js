function Seekbar()
{
}
Seekbar.prototype.init = function init() {
	if (!globals.flashmovie)
		return;

	// load settings
	this.enabled = utils.getPref('seekbar', true);
	this.framecounter = utils.getPref('framecounter', false);

	// prepare settings checkboxes
	var settingrow = document.createElement('li');
	globals.modules.settingspane.settingslist.appendChild(settingrow);
	var settingcheckbox = document.createElement('input');
	this.setting_enabled = settingcheckbox;
	settingcheckbox.type = 'checkbox';
	settingcheckbox.checked = this.enabled;
	settingcheckbox.title = "Lets you fast forward and rewind";
	settingcheckbox.id = 'setting_seekbar';
	// settingcheckbox.addEventListener('click', enabledisable, false);
	settingrow.appendChild(settingcheckbox);
	var settinglabel = document.createElement('label');
	settinglabel.htmlFor = 'setting_seekbar';
	settinglabel.appendChild(document.createTextNode("Show seek bar"));
	settinglabel.title = settingcheckbox.title;
	settingrow.appendChild(settinglabel);
	
	var subsetting = document.createElement('ul');
	settingrow.appendChild(subsetting);
	settingrow = document.createElement('li');
	subsetting.appendChild(settingrow);
	settingcheckbox = document.createElement('input');
	this.setting_framecounter = settingcheckbox;
	settingcheckbox.type = 'checkbox';
	settingcheckbox.checked = this.framecounter;
	settingcheckbox.title = "Shows you exactly where you are";
	settingcheckbox.id = 'setting_framecounter';
	settingrow.appendChild(settingcheckbox);
	settinglabel = document.createElement('label');
	settinglabel.htmlFor = 'setting_framecounter';
	settinglabel.appendChild(document.createTextNode("Show frame counter on seek bar"));
	settinglabel.title = settingcheckbox.title;
	settingrow.appendChild(settinglabel);
	
	if (this.enabled)
		this.addSeekbar();
};
Seekbar.prototype.updateSettings = function updateSettings()
{
	if (this.enabled)
		this.removeSeekbar();
	this.enabled = this.setting_enabled.checked;
	utils.setPref("seekbar", this.enabled);
	this.framecounter = this.setting_framecounter.checked;
	utils.setPref("framecounter", this.framecounter);
	if (this.enabled)
		this.addSeekbar();
};
Seekbar.prototype.addSeekbar = function addSeekbar()
{
	this.seekbar = document.createElement("div");
	utils.insertAfter(this.seekbar, globals.flashmovie);
	this.seekbar.style.width = globals.flashmovie.width;
	this.seekbar.appendChild(document.createTextNode("Seek bar!"));
	this.seekbar.style.background = "white";
	this.seekbar.style.color = "black";
	if (globals.modules.fullscreen)
		globals.modules.fullscreen.doResize();
};
Seekbar.prototype.removeSeekbar = function removeSeekbar()
{
	if (!this.seekbar)
		return;
	this.seekbar.parentNode.removeChild(this.seekbar);
	this.seekbar = undefined;
	if (globals.modules.fullscreen)
		globals.modules.fullscreen.doResize();
};
