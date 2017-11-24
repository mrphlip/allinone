function WikiLink()
{
}
WikiLink.prototype.load = async function load() {
	this.enabled = await utils.getPref('hrwiki', true);
}
WikiLink.prototype.init = function init()
{
	this.setting_enabled = globals.modules.settingspane.addCheckbox('hrwiki', "Add HRWiki link", "Adds a link to the appropriate page on the Homestar Runner Wiki", this.enabled);

	this.buildWikiLink();
	this.showWikiLink();
};
WikiLink.prototype.updateSettings = function updateSettings()
{
	this.enabled = this.setting_enabled.checked;
	utils.setPref("hrwiki", this.enabled);
	// This is called before Subtitles.updateSettings, so delay until after that happens
	// so we can update the subtitles link as appropriate
	window.setTimeout(this.showWikiLink.bind(this), 0);
};

WikiLink.prototype.buildWikiLink = function buildWikiLink()
{
	// many pages on the mirror have an "info" link in the navbar (thanks Tom!)... use that
	if (globals.whichsite === 3)
	{
		var navbar;
		if (globals.modules.navbar && globals.modules.navbar.originalnavbar)
			navbar = globals.modules.navbar.originalnavbar;
		else
			navbar = globals.navbar;
		if (navbar)
		{
			var a = navbar.getElementsByTagName("a");
			for (var i = 0; i < a.length; i++)
			{
				if (a[i].firstChild.nodeType === 3 && a[i].firstChild.nodeValue === "info")
				{
					this.addHRWikiLink(a[i].href, true);
					return;
				}
			}
		}
	}
	
	// pull the filename from the url, use it as a link to HRWiki
	// all the filenames except a couple of special-cases are
	//  redirects to their articles
	// don't link to certain pages, they aren't redirects, but already existing pages
	// also detect a 404 error and special-case Strong Sad's Lament
	     if (document.title === "Oops! You bwoke it.")
		this.addHRWikiLink("404'd");
	else if (globals.filename === "interview")
		this.addHRWikiLink("The_Interview");
	else if (globals.filename === "fhqwhgads")
		this.addHRWikiLink("Everybody_to_the_Limit");
	else if (globals.filename === "trogdor")
		this.addHRWikiLink("TROGDOR!");
	else if (globals.filename === "marshie")
		this.addHRWikiLink("Meet_Marshie");
	else if (globals.filename === "eggs")
		this.addHRWikiLink("Eggs_(toon)");
	else if (globals.filename === "fireworks")
		this.addHRWikiLink("Happy_Fireworks");
	else if (globals.filename === "sbemail100")
		this.addHRWikiLink("Not_the_100th_Email!!!");
	else if (globals.filename === "sbemail200")
		this.addHRWikiLink("Page_Load_Error");
	else if (globals.filename === "sbcg4ap")
		this.addHRWikiLink("Strong_Bad's_Cool_Game_for_Attractive_People_Advertisement");
	else if (globals.filename === "dangeresque")
		this.addHRWikiLink("Dangeresque_Roomisode_1:_Behind_the_Dangerdesque");
	else if (location.pathname.substr(0, 12) === "/sadjournal/" && globals.filename != "wonderyears" && globals.filename != "super8")
		this.addHRWikiLink("Strong_Sad's_Lament");
	else if (location.pathname.substr(0,5) === "/vii/" && (globals.filename === "" || globals.filename === "index"))
		this.addHRWikiLink("Viidelectrix");
	else if (globals.filename === "" || globals.filename === "index")
	{
		if (document.location.pathname === "/slash/slash/")
			this.addHRWikiLink("Screenland_-_24_Apr_2017");
		else if (globals.whichsite === 0)
			this.addHRWikiLink("Index_Page");
		else if (globals.whichsite === 1)
			this.addHRWikiLink("Podstar_Runner");
		else if (globals.whichsite === 2)
			this.addHRWikiLink("Videlectrix");
		//else if (globals.whichsite === 3)
		//	; // this will be a 403 page - do nothing.
	}
	else
		this.addHRWikiLink(globals.filename);
};

WikiLink.prototype.addHRWikiLink = function addHRWikiLink(pagename, isurl)
{
	this.linkdiv = document.createElement("div");
	this.linkdiv.style.borderLeft = this.linkdiv.style.borderBottom = '1px solid #666';
	this.linkdiv.style.background = '#EEE';
	this.linkdiv.style.position = "fixed";
	this.linkdiv.style.overflow = 'auto';
	this.linkdiv.style.right = "0px";
	this.linkdiv.style.top = "0px";
	this.linkdiv.style.padding = "3px";
	var link = document.createElement("a");
	if (isurl)
		link.href = pagename;
	else
		link.href = "http://www.hrwiki.org/wiki/" + escape(pagename.replace(/ /g, '_'));
	link.title = "See the HRWiki article for this page";
	link.style.display = "block";
	link.style.textDecoration = "none";
	this.linkdiv.appendChild(link);
	var img=document.createElement("img");
	img.style.border="0px";
	img.style.display="block";
	img.src=globals.images.hrwiki;
	link.appendChild(img);
	this.sublink = document.createElement("a");
	this.sublink.title = "See the HRWiki article for this page's subtitles";
	this.sublink.style.display = "block";
	this.sublink.style.textDecoration = "none";
	this.sublink.style.textAlign = "center";
	this.sublink.style.fontSize = this.sublink.style.lineHeight = "16px";
	this.sublink.style.marginTop = "3px";
	this.linkdiv.appendChild(this.sublink);
	this.sublink.appendChild(document.createTextNode('S'));
	document.body.appendChild(this.linkdiv);
};

WikiLink.prototype.showWikiLink = function showWikiLink()
{
	if (this.enabled)
	{
		this.linkdiv.style.display = "block";
		if (globals.modules.subtitles && globals.modules.subtitles.enabled)
		{
			this.sublink.style.display = "block";
			this.sublink.href = "http://www.hrwiki.org/wiki/Subtitles:" + escape(globals.filename.replace(/ /g, '_')) + "/" + escape(globals.modules.subtitles.language);
		}
		else
			this.sublink.style.display = "none";
	}
	else
		this.linkdiv.style.display = "none";
};
