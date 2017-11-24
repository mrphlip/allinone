function DebugModule()
{
}
DebugModule.prototype.load = async function load() {
}
DebugModule.prototype.init = function init()
{
	if (!globals.flashmovie)
		return;

	// add debug button to settings panel
	var settingrow = document.createElement('li');
	globals.modules.settingspane.settingslist.appendChild(settingrow);
	var settingbutton = document.createElement('button');
	settingbutton.appendChild(document.createTextNode("Debug"));
	settingbutton.style.width = "100%";
	settingbutton.addEventListener('click', this.doDebug.bind(this), true);
	settingrow.appendChild(settingbutton);
};
DebugModule.prototype.doDebug = async function doDebug(e)
{
	e.preventDefault();

	var res = await utils.downloadPage("http://localhost/tmp.php");
	console.log(res);
	
	/*
	var res = await utils.downloadWiki("Subtitles:Languages");
	console.log(res);
	res = utils.parseWikiXML(res);
	console.log(res);
	*/
};
DebugModule.prototype.updateSettings = function updateSettings()
{
};
