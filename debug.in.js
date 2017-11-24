function DebugModule()
{
}
DebugModule.prototype.load = async function load() {
}
DebugModule.prototype.init = function init()
{
	if (!globals.flashmovie)
		return;
	
	/*
	// add debug button to settings panel
	var settingrow = document.createElement('li');
	globals.modules.settingspane.settingslist.appendChild(settingrow);
	var settingbutton = document.createElement('button');
	settingbutton.appendChild(document.createTextNode("Debug"));
	settingbutton.style.width = "100%";
	settingbutton.addEventListener('click', this.doDebug.bind(this), true);
	settingrow.appendChild(settingbutton);
	*/
};
DebugModule.prototype.doDebug = function doDebug()
{
	//utils.downloadWiki("HRWiki", function(t){window.alert(t);}, function(s,t){window.alert("Error: " + s + "\n" + t);});
};
DebugModule.prototype.updateSettings = function updateSettings()
{
};
