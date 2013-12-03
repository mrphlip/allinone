function Globals()
{
	this.whichsite = 0;
	if (location.hostname.indexOf("podstar") >= 0) this.whichsite = 1;
	if (location.hostname.indexOf("videlectrix") >= 0) this.whichsite = 2;
	if (location.pathname.indexOf("/mirror/") >= 0) this.whichsite = 3;

#	include "images.in.js"

	// find flash objects
	switch (this.whichsite)
	{
		case 0: // www.homestarrunner.com
			var objs = document.getElementsByTagName("EMBED");
			if (objs && objs.length >= 2)
			{
				this.flashmovie = objs[0];
				this.navbar = objs[1];
			}
			else if (objs && objs.length >= 1)
			{
				this.flashmovie = objs[0];
				this.navbar = false;
			}
			else
			{
				this.flashmovie = false;
				this.navbar = false;
			}
			if (!this.flashmovie)
			{
				objs = document.getElementsByTagName("OBJECT");
				if (objs && objs.length >= 1)
					this.flashmovie = objs[0];
			}
			break;
		case 1: // podstar.homestarrunner.com
			var objs = document.getElementsByTagName("EMBED");
			this.flashmovie = false;
			if (objs && objs.length >= 1)
				this.navbar = objs[0];
			else
				this.navbar = false;
			break;
		case 2: // videlectrix
			var objs = document.getElementsByTagName("EMBED");
			this.navbar = false;
			if (objs && objs.length >= 1)
				this.flashmovie = objs[0];
			else
				this.flashmovie = false;
			/*settings.navbar = false;*/
			break;
		case 3: // mirror
			var objs = document.getElementsByTagName("EMBED");
			this.flashmovie = false;
			if (objs && objs.length >= 1)
				this.flashmovie = objs[0];
			if (!flashmovie)
			{
				objs = document.getElementsByTagName("OBJECT");
				if (objs && objs.length >= 1)
					this.flashmovie = objs[0];
			}
			navbar = document.getElementById('navbar');
			if (!navbar)
				settings.navbar = false;
			var flashcontainer = document.getElementById('flash');
			if (flashcontainer)
				flashcontainer.style.width = "auto";
			break;
	}
	if (this.flashmovie)
	{
		//expose Flash plugin-added methods
		if (this.flashmovie.wrappedJSObject)
			this.flashmovie = this.flashmovie.wrappedJSObject;
		
		// confirm that this is really a flash file
		// and not (for example) the embedded background sound on SB's website
		if (this.flashmovie.nodeName.toLowerCase() == "object")
		{
			var src = this.flashmovie.getAttribute('src');
			if (src)
			{
				if (src.substring(src.length - 4).toLowerCase() != ".swf")
					this.flashmovie = false;
			}
			else
			{
				a = this.flashmovie.getElementsByTagName('param').namedItem("movie");
				if (!a || a.value.substring(a.value.length - 4).toLowerCase() != ".swf")
					this.flashmovie = false;
			}
		}
		else if (this.flashmovie.nodeName.toLowerCase() == "embed")
		{
			var src = this.flashmovie.getAttribute('src');
			if (!src || src.substring(src.length - 4).toLowerCase() != ".swf")
				this.flashmovie = false;
		}
	}
};
Globals.prototype.initModules = function()
{
	this.modules = {}
	this.modules.settingspane = new SettingsPane();
	this.modules.fullscreen = new Fullscreen();
};
