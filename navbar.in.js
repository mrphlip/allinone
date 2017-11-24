function Navbar()
{
}
Navbar.prototype.SECTIONS = {
	t: "Big Toons",
	sh: "Shorts",
	ho: "Holday Toons",
	p: "Puppet Stuff",
	teh: "Powered by The Cheat",
	sb: "Strong Bad Emails",
	am: "Marzipan's Answering Machine",
	tgs: "Teen Girl Squad"
};
Navbar.prototype.MAIN_COUNT = 26;
Navbar.prototype.load = async function load() {
	this.enabled = await utils.getPref('navbar', false);
	this.rando = {};
	for (var i in this.SECTIONS)
		this.rando[i] = await utils.getPref('rando' + i, true);
}
Navbar.prototype.init = function init() {
	utils.addGlobalStyle(
		#include_string "navbar.css"
	);

	this.setting_enabled = globals.modules.settingspane.addCheckbox('navbar', "Plain HTML navbar", "Replaces the flash navbar with normal links, so you can open in tabs, etc", this.enabled);
	this.setting_rando = {};
	for (var i in this.SECTIONS)
		this.setting_rando[i] = globals.modules.settingspane.addCheckbox('rando' + i, "Include " + this.SECTIONS[i] + " in rando", 'Limit the "rando" function to what you like to watch', this.rando[i], this.setting_enabled);
	
	this.allrandourls = false;
	this.randourls = false;

	this.originalnavbar = globals.navbar;
	this.newnavbar = this.buildNavbar(this.originalnavbar);
	this.showNavbar();
};
Navbar.prototype.updateSettings = function updateSettings()
{
	this.enabled = this.setting_enabled.checked;
	utils.setPref("navbar", this.enabled);
	for (var i in this.SECTIONS)
	{
		this.rando[i] = this.setting_rando[i].checked;
		utils.setPref("rando" + i, this.rando[i]);
	}
	this.filterRando();
	this.showNavbar();
};

Navbar.prototype.showNavbar = function showNavbar()
{
	if (this.enabled)
	{
		if (this.originalnavbar)
			this.originalnavbar.style.display = "none";
		this.newnavbar.style.display = "";
		this.newnavbar.style.marginTop = (globals.modules.seekbar.enabled ? "0" : "10px");
		globals.navbar = this.newnavbar;
		/*no await*/ this.loadRandoXML();
	}
	else
	{
		if (this.originalnavbar)
			this.originalnavbar.style.display = "";
		this.newnavbar.style.display = "none";
		globals.navbar = this.originalnavbar;
	}
	globals.modules.fullscreen.doResize();
};

Navbar.prototype.buildNavbar = function buildNavbar(where)
{
	var newnavbar = document.createElement("ul");
	newnavbar.id = "newnavbar";
	if (where)
	{
		while(where.parentNode.tagName.toLowerCase() == "object")
			where = where.parentNode;
		utils.insertAfter(newnavbar, where);
	}
	else
		document.body.appendChild(newnavbar);

	this.mainlink = this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/main" + Math.floor(Math.random() * this.MAIN_COUNT + 1) + ".html", "Main");
	// just for fun, re-randomise on each mouse-over (for the status bar)
	this.mainlink.addEventListener("mouseout", this.newMainLink.bind(this), false);
	this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/toons.html", "Toons");
	this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/games.html", "Games");
	this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/characters2.html", "Characters");
	this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/homester.html", "Downloads");
	this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/store.html", "Store", "storelink");
	this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/sbemail.html", "SB Emails");
	//this.addnavbarlink(newnavbar, "http://feeds.feedburner.com/HomestarRunner", "Subscribe");
	this.addnavbarlink(newnavbar, "https://www.youtube.com/user/homestarrunnerdotcom", "YouTube");
	this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/email.html", "Contact");
	//this.addnavbarlink(newnavbar, "http://podstar.homestarrunner.com/", "Podcast");
	this.addnavbarlink(newnavbar, "http://www.homestarrunner.com/legal.html", "Legal");
	this.randolink = this.addnavbarlink(newnavbar, "javascript:void(alert('rando.xml not loaded yet... be patient'))", "Rando");
	this.randolink.addEventListener("mouseout", this.newRandoLink.bind(this), false);

	return newnavbar;
};
Navbar.prototype.addnavbarlink = function addnavbarlink(ul, href, title, extraclass)
{
	var li = document.createElement("li");
	var link = document.createElement("a");
	link.href = href;
	link.appendChild(document.createTextNode(title));
	if (extraclass)
		link.className = extraclass;
	li.appendChild(link);
	ul.appendChild(li);
	return link;
};

Navbar.prototype.newMainLink = function newMainLink()
{
	this.mainlink.href="http://www.homestarrunner.com/main" + Math.floor(Math.random() * this.MAIN_COUNT + 1) + ".html";
};
Navbar.prototype.newRandoLink = function newRandoLink()
{
	if (!this.randourls)
		return;

	if (this.randourls.length > 0)
	{
		var r = this.randourls[Math.floor(Math.random() * this.randourls.length)];
		this.randolink.href = r.u;
		this.randolink.title = r.n;
	}
	else
	{
		this.randolink.href = "javascript:void(alert('Nothing to choose from'))";
		this.randolink.title = "Nothing to choose from";
	}
};

Navbar.prototype.loadRandoXML = async function loadRandoXML()
{
	// Only run this once
	if (this.haveLoadedXML)
		return;
	this.haveLoadedXML = true;

	try {
		var res = await utils.downloadPage(
			"http://www.homestarrunner.com/rando.xml?cachedodge=" + (await utils.getPref('cachedodge', 0))
		);

		var parser = new DOMParser();
		// fix invalid XML...
		// add missing root element
		var doc = res.text.replace(/<\?xml.*?\?>/g, ""); // strip <?xml ?> tag
		doc = "<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>\n<rando>" + doc + "</rando>";
		// fix bad ampersands
		doc = doc.replace(/&(?!\w*;)/g, "&amp;");
		doc = parser.parseFromString(doc, "application/xml");
		var sbemailcounter = 0;
		this.allrandourls = [];
		for (var i = 0; i < doc.documentElement.childNodes.length; i++)
		{
			var node = doc.documentElement.childNodes[i];
			if (node.nodeType == 1)
			{
				var type = node.nodeName.toLowerCase();
				var u = node.getAttribute('u');
				var n = node.getAttribute('n');
				if (!n) n = "Untitled";
				if (type == "sb")
				{
					sbemailcounter++;
					n = "SBEmail: " + n;
				}
				if (u)
					this.allrandourls.push({u: "http://www.homestarrunner.com/" + u, n: n, type: type});
				else
					this.allrandourls.push({u: "http://www.homestarrunner.com/sbemail" + sbemailcounter + ".html", n: n, type: type});
			}
		}
		this.filterRando();
	} catch (e) {
		this.randolink.href = "javascript:void(alert('Error loading rando.xml... try refreshing'))";
	}
};
Navbar.prototype.filterRando = function filterRando()
{
	if (!this.allrandourls)
		return;
	this.randourls = [];
	for (var i in this.allrandourls)
	{
		var r = this.allrandourls[i];
		if (this.rando[r.type] === false) // === false so that it's considered "true" for undefined... if they add a new toon type
			continue;
		this.randourls.push(r);
	}
	this.newRandoLink();
};
