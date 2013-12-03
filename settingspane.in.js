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
	closebutton.addEventListener('click', (function(){this.settingsbox.style.display = "none"; this.settingslink.style.display = "block";}).bind(this), false);
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
	window.addEventListener('resize', (function()
	{
		var a = window.innerHeight - 75;
		if (a < 40) a = 40;
		this.settingslist.style.maxHeight = a + 'px';
	}).bind(this), true);
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
	nocachebutton.addEventListener("click", function(){GM_setValue("cachedodge", Math.random().toString())}, false);
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
	settingslinkimage.addEventListener('click', (function(){this.settingsbox.style.display = "block"; this.settingslink.style.display = "none";}).bind(this), false);
	settingslink.appendChild(settingslinkimage);
	document.body.appendChild(settingslink);
	
	//enabledisable();
}
SettingsPane.prototype.saveSettings = function(e)
{
	// stop the form from actually being submitted
	if (e && e.preventDefault)
		e.preventDefault();
	
	for (i in globals.modules)
		globals.modules[i].updateSettings();
	
	return false;
}
SettingsPane.prototype.updateSettings = function(){}
