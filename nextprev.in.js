function NextPrev()
{
}
NextPrev.prototype.load = async function load() {
	this.enabled = await utils.getPref('prevnext', true);
	this.docheck = await utils.getPref('checknext', true);
}
NextPrev.prototype.init = function init()
{
	this.setting_enabled = globals.modules.settingspane.addCheckbox('prevnext', "Show previous/next buttons", "Lets you easily move through SBEmails, TGS, etc", this.enabled);
	this.setting_docheck = globals.modules.settingspane.addCheckbox('checknext', "Check if next exists", 'Doesn\'t add a "next" link on the latest SBEmail, etc', this.docheck, this.setting_enabled);

	this.createPrevNext();
	this.showPrevNext();
};
NextPrev.prototype.updateSettings = function updateSettings()
{
	this.enabled = this.setting_enabled.checked;
	utils.setPref("prevnext", this.enabled);
	this.docheck = this.setting_docheck.checked;
	utils.setPref("checknext", this.docheck);
	this.showPrevNext();
};

NextPrev.prototype.createPrevNext = function createPrevNext()
{
	// this is coded like this instead of just looking for /(\d+)/ so that it
	// doesn't find pages like commandos3 or xmas04
	var result;
	if ((result = globals.filename.match(/^(sbemail|tgs|answer|bizcasfri|puppetjam|main)(\d+)$/)))
	{
		// sbemail100 and sbemail200 aren't actually sbemails
		if (!(result[1] == "sbemail" && (result[2] == "100" || result[2] == "200")))
			this.addPrevNextlinks(result[1],parseInt(result[2],10));
	}
	else if (globals.filename == "sbemailahundred")
		this.addPrevNextlinks("sbemail", 100);
	else if (globals.filename == "kotpoptoon")
		this.addPrevNextlinks("sbemail", 151);
	else if (globals.filename == "sbemailtwohundred")
		this.addPrevNextlinks("sbemail", 200);
	else if (globals.filename == "hremail3184")
		this.addPrevNextlinks("sbemail", 201);
	else if (globals.filename == "dween_tgs")
		this.addPrevNextlinks("tgs", 6);
};
NextPrev.prototype.addPrevNextlinks = function addPrevNextlinks(series, num)
{
	if (num > 1)
	{
		this.prevlink = document.createElement("a");
		this.prevlink.href = this.makeLink(series, num - 1);
		this.prevlink.style.position="fixed";
		this.prevlink.style.left="0px";
		this.prevlink.style.bottom="0px";
		this.prevlink.style.padding="3px";
		this.prevlink.style.background="white";
		this.prevlink.style.border="1px solid black";
		this.prevlink.style.textDecoration="none";
		this.prevlink.style.display = "none";
		var img = document.createElement("img");
		img.style.border = "none";
		img.src = globals.images.prev;
		this.prevlink.appendChild(img);
		document.body.appendChild(this.prevlink);
	}

	this.nextlink = document.createElement("a");
	this.nextlink.href = this.makeLink(series, num + 1);
	this.nextlink.style.position="fixed";
	this.nextlink.style.right="0px";
	this.nextlink.style.bottom="0px";
	this.nextlink.style.padding="3px";
	this.nextlink.style.background="white";
	this.nextlink.style.border="1px solid black";
	this.nextlink.style.textDecoration="none";
	this.nextlink.style.display = "none";
	img = document.createElement("img");
	img.style.border = "none";
	img.src = globals.images.next;
	this.nextlink.appendChild(img);
	document.body.appendChild(this.nextlink);

	this.checkedNext = false;
};
NextPrev.prototype.makeLink = function makeLink(series, num)
{
	if (series == "sbemail" && num == 100)
		return "sbemailahundred.html";
	else if (series == "sbemail" && num == 151)
		return "kotpoptoon.html";
	else if (series == "sbemail" && num == 200)
		return "sbemailtwohundred.html";
	else if (series == "sbemail" && num == 201)
		return "hremail3184.html";
	else
		return series + num + ".html";
};

NextPrev.prototype.showPrevNext = function showPrevNext()
{
	if (this.enabled)
	{
		if (this.prevlink)
			this.prevlink.style.display = "block";
		if (this.docheck && !this.checkedNext && this.nextlink)
			this.doCheckNext(); // intentionally no "await" here
		else if (this.nextlink)
			this.nextlink.style.display = "block";
	}
	else
	{
		if (this.prevlink)
			this.prevlink.style.display = "none";
		if (this.nextlink)
			this.nextlink.style.display = "none";
	}
};
NextPrev.prototype.doCheckNext = async function doCheckNext()
{
	utils.downloadPage(this.nextlink.href + "?cachedodge=" + (await utils.getPref('cachedodge', 0)), this.onCheckLoad.bind(this), this.onCheckError.bind(this), "HEAD");
}
NextPrev.prototype.onCheckLoad = function onCheckLoad(text, status, statustext, headers)
{
	if (status == 200 && headers.indexOf("404error.html") < 0)
	{
		this.checkedNext = true;
		this.showPrevNext();
	}
	else if (this.nextlink)
	{
		this.nextlink.parentNode.removeChild(this.nextlink);
		this.nextlink = undefined;
	}
};
NextPrev.prototype.onCheckError = function onCheckError()
{
	this.nextlink.parentNode.removeChild(this.nextlink);
	this.nextlink = undefined;
};
