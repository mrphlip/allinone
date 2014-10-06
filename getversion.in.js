// Returned by Special:Getversion
// <versionstring>MAJOR.MINOR.REVISION=http://www.hrwiki.org/w/index.php?title=User:Phlip/Greasemonkey&action=raw&ctype=text/javascript&fakeextension=.user.js</versionstring>

function Updates()
{
	this.enabled = utils.getPref('updates', true);
}
Updates.CURRENT_VERSION = [MAJOR, MINOR, REVISION];
Updates.prototype.init = function init()
{
	// We don't need to do this update checking on Chrome - the Chrome Web Store
	// will handle that for us
	if (!utils.useGMFunctions)
	{
		delete globals.modules.updates;
		return;
	}

	this.setting_enabled = globals.modules.settingspane.addCheckbox('updates', "Check for updates", "Regularly check for updates to the All-in-one script", this.enabled);

	this.havechecked = false;
	this.doCheck();
};
Updates.prototype.updateSettings = function updateSettings()
{
	this.enabled = this.setting_enabled.checked;
	utils.setPref("updates", this.enabled);
	this.doCheck();
};

Updates.prototype.doCheck = function doCheck()
{
	if (this.havechecked || !this.enabled)
		return;
	this.havechecked = true;

	if (Date.now() - utils.getPref("lastchecktime", 0) > 86400000)
	{
		utils.downloadPage("http://www.hrwiki.org/wiki/Special:Getversion/User:Phlip/Greasemonkey?cachedodge=" + Math.random(), this.onLoad.bind(this));
	}
	else
		this.handleUpdateString(utils.getPref("lastcheckstring", ""));
};
Updates.prototype.onLoad = function onLoad(textcontent)
{
	utils.setPref("lastchecktime", Date.now());
	utils.setPref("lastcheckstring", textcontent);
	this.handleUpdateString(textcontent);
};
Updates.prototype.handleUpdateString = function handleUpdateString(str)
{
	var parts = str.split("@@");
	for (var i = 0; i < parts.length; i++)
	{
		var matches = parts[i].match(/^(\d+)\.(\d+)\.(\d+)=(.*)$/);
		if (!matches) continue;
		if (matches[1] > Updates.CURRENT_VERSION[0] ||
		    (matches[1] == Updates.CURRENT_VERSION[0] && matches[2] > Updates.CURRENT_VERSION[1]) ||
		    (matches[1] == Updates.CURRENT_VERSION[0] && matches[2] == Updates.CURRENT_VERSION[1] && matches[3] > Updates.CURRENT_VERSION[2]))
		{
			var updatelink = document.createElement('a');
			updatelink.href=matches[4];
			updatelink.style.display = "block";
			updatelink.style.position = 'fixed';
			updatelink.style.left = '0px';
			updatelink.style.top = '0px';
			updatelink.style.border = 'none';
			updatelink.style.zIndex = 1;
			var updatelinkimage = document.createElement('img');
			updatelinkimage.src = globals.images.update;
			var oldversionstr = Updates.CURRENT_VERSION[0] + "." + Updates.CURRENT_VERSION[1] + "." + Updates.CURRENT_VERSION[2];
			var newversionstr = matches[1] + "." + matches[2] + "." + matches[3];
			updatelinkimage.title = "Click here to update from script version " + oldversionstr + " to " + newversionstr;
			updatelinkimage.style.display = "block";
			updatelinkimage.style.border = 'none';
			updatelink.appendChild(updatelinkimage);
			document.body.appendChild(updatelink);
			return;
		}
	}
};
