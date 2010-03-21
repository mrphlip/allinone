function SettingsPane()
{
	utils.addGlobalStyle(
		#include_string "settingspane.css"
	);
	
	var thisObj = this; // "this" is a magic word, and isn't closed over in closures
	var settingsbox = document.createElement('div');
	this.settingsbox = settingsbox;
	settingsbox.id = 'settingsbox';
	settingsbox.style.display = 'none';
	document.body.appendChild(settingsbox);
	var titlebar = document.createElement('div');
	titlebar.id = 'settingstitlebar';
	settingsbox.appendChild(titlebar);
	var closebutton = document.createElement('img');
	closebutton.src = globals.image_close;
	closebutton.title = "Click to hide preferences";
	closebutton.className = 'buttonimage';
	closebutton.addEventListener('click', function(){thisObj.settingsbox.style.display = "none"; thisObj.settingslink.style.display = "block";}, false);
	titlebar.appendChild(closebutton);
	var prefslogo = document.createElement('img');
	prefslogo.src = globals.image_prefs;
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
	window.addEventListener('resize', function()
	{
		var a = window.innerHeight - 75;
		if (a < 40) a = 40;
		thisObj.settingslist.style.maxHeight = a + 'px';
	}, true);
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
	settingsform.addEventListener("submit", function(e){return thisObj.saveSettings(e)}, false);
	
	var settingslink = document.createElement('div');
	this.settingslink = settingslink;
	settingslink.id = 'settingslink';
	var settingslinkimage = document.createElement('img');
	settingslinkimage.src = globals.image_prefs;
	settingslinkimage.title = "Click to show preferences";
	settingslinkimage.className = 'prefsicon buttonimage';
	settingslinkimage.addEventListener('click', function(){thisObj.settingsbox.style.display = "block"; thisObj.settingslink.style.display = "none";}, false);
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