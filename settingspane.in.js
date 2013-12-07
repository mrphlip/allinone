function SettingsPane()
{
	utils.addGlobalStyle(
		#include_string "settingspane.css"
	);
	
	var settingsbox = document.createElement('div');
	this.settingsbox = settingsbox;
	settingsbox.id = 'settingsbox';
	settingsbox.style.display = 'none';
	document.body.appendChild(settingsbox);
	var titlebar = document.createElement('div');
	titlebar.id = 'settingstitlebar';
	settingsbox.appendChild(titlebar);
	var closebutton = document.createElement('img');
	closebutton.src = globals.images.close;
	closebutton.title = "Click to hide preferences";
	closebutton.className = 'buttonimage';
	closebutton.addEventListener('click', this.hidePane.bind(this), false);
	titlebar.appendChild(closebutton);
	var prefslogo = document.createElement('img');
	prefslogo.src = globals.images.prefs;
	prefslogo.className = 'prefsicon';
	titlebar.appendChild(prefslogo);
	titlebar.appendChild(document.createTextNode("Preferences"));
	var settingsform = document.createElement('form');
	settingsbox.appendChild(settingsform);
	var settingslist = document.createElement('ul');
	this.settingslist = settingslist;
	var a = window.innerHeight - 75;
	if (a < 40) a = 40;
	settingslist.style.maxHeight = a + 'px';
	settingslist.style.overflow = 'auto'; // vertical scrollbar if needed
	window.addEventListener('resize', this.resizeWindow.bind(this), true);
	settingsform.appendChild(settingslist);

	var div = document.createElement('div');
	div.id = 'settingsbuttons';
	settingsform.appendChild(div);
	var savebutton = document.createElement('input');
	savebutton.type = "submit";
	savebutton.value = "Save and Apply";
	div.appendChild(savebutton);
	var nocachebutton = document.createElement('input');
	nocachebutton.type = "submit";
	nocachebutton.value = "Clear subtitles cache";
	nocachebutton.addEventListener("click", this.cacheDodge.bind(this), false);
	div.appendChild(document.createTextNode(" "));
	div.appendChild(nocachebutton);
	settingsform.addEventListener("submit", this.saveSettings.bind(this), false);
	
	var settingslink = document.createElement('div');
	this.settingslink = settingslink;
	settingslink.id = 'settingslink';
	var settingslinkimage = document.createElement('img');
	settingslinkimage.src = globals.images.prefs;
	settingslinkimage.title = "Click to show preferences";
	settingslinkimage.className = 'prefsicon buttonimage';
	settingslinkimage.addEventListener('click', this.showPane.bind(this), false);
	settingslink.appendChild(settingslinkimage);
	document.body.appendChild(settingslink);
	
	//enabledisable();
}
SettingsPane.prototype.saveSettings = function saveSettings(e)
{
	// stop the form from actually being submitted
	if (e && e.preventDefault)
		e.preventDefault();
	
	for (var i in globals.modules)
		globals.modules[i].updateSettings();
	
	return false;
};
SettingsPane.prototype.updateSettings = function updateSettings(){};
SettingsPane.prototype.showPane = function showPane()
{
	this.settingsbox.style.display = "block";
	this.settingslink.style.display = "none";
};
SettingsPane.prototype.hidePane = function hidePane()
{
	this.settingsbox.style.display = "none";
	this.settingslink.style.display = "block";
};
SettingsPane.prototype.resizeWindow = function resizeWindow()
{
	var a = window.innerHeight - 75;
	if (a < 40) a = 40;
	this.settingslist.style.maxHeight = a + 'px';
};
SettingsPane.prototype.cacheDodge = function cacheDodge()
{
	utils.setPref("cachedodge", Math.random().toString());	
};
