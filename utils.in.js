function Utils()
{
}

// Taken from http://diveintogreasemonkey.org/patterns/add-css.html
Utils.prototype.addGlobalStyle = function addGlobalStyle(css)
{
	var head, style;
	head = document.getElementsByTagName('head')[0];
	if (!head) return;
	style = document.createElement('style');
	style.type = 'text/css';
	style.appendChild(document.createTextNode(css));
	head.appendChild(style);
};

// Based on http://userscripts.org/topics/41177
Utils.prototype.useGMStorage = function useGMStorage()
{
	// We can't just test if GM_getValue exists, because in Chrome they do exist
	// but they don't actually do anything, just report failure to console.log

	// We don't want it to actually write anything to console.log, though, so
	// let's stop that
	var log = console.log;
	console.log = function log(){};
	var gmstorage = typeof(GM_getValue) == "function" && GM_getValue("this-value-doesn't-exist-I-promise", true);
	console.log = log;

	return gmstorage;
};
Utils.prototype.getPref = function getPref(key, def)
{
	// Have to do it like this instead of like "if(window.GM_getValue)"
	// because apparently this function isn't actually on "window", and I don't
	// know where it actually lives...
	if (this.useGMStorage())
		return GM_getValue(key, def);
	else if (window.localStorage)
	{
		var value = localStorage.getItem("hr-allinone-" + key);
		if (value === null)
			return def;
		var type = value[0];
		value = value.substring(1);
		if (type == 'b')
			return Number(value) != 0;
		else if (type == 'n')
			return Number(value);
		else
			return value;
	}
	else
	{
		alert("Homestar Runner All-in-one is not supported on this platform");
		throw "Couldn't find a local storage provider";
	}
};
Utils.prototype.setPref = function setPref(key, value)
{
	if (this.useGMStorage())
		GM_setValue(key, value);
	else if (window.localStorage)
	{
		if (typeof(value) == "string")
			localStorage.setItem("hr-allinone-" + key, "s" + value);
		else if (typeof(value) == "number")
			localStorage.setItem("hr-allinone-" + key, "n" + value);
		else if (typeof(value) == "boolean")
			localStorage.setItem("hr-allinone-" + key, "b" + (value ? 1 : 0));
		else
			throw "Unexpected type for storage: " + typeof(value);
	}
	else
	{
		alert("Homestar Runner All-in-one is not supported on this platform");
		throw "Couldn't find a local storage provider";
	}
};

Utils.prototype.downloadPage = function downloadPage(url, loadcb, errorcb)
{
	if (typeof GM_xmlhttpRequest == 'function')
	{
		var opts = {
			method: 'GET',
			url: url,
			onload: function onload(res) {loadcb(res.responseText, res.status, res.statusText);}
		};
		if (errorcb)
			opts.onerror = function onerror(res) {errorcb(res.status, res.statusText);};
		GM_xmlhttpRequest(opts);
	}
	else
	{
		var xhr = new XMLHttpRequest();
		xhr.onload = function onload() {loadcb(xhr.responseText, xhr.status, xhr.statusText);};
		if (errorcb)
			xhr.onerror = function onerror() {errorcb(xhr.status, xhr.statusText);};
		xhr.open('GET', url);
		xhr.send();
	}
};
Utils.prototype.buildWikiUrl = function buildWikiUrl(page)
{
	var url = escape(page.replace(/ /g, '_'));
	return "http://www.hrwiki.org/w/index.php?title=" + url + "&action=raw&source=allinone&cachedodge=" + this.getPref('cachedodge', 0);
};
Utils.prototype.downloadWiki = function downloadWiki(page, loadcb, errorcb)
{
	this.downloadPage(this.buildWikiUrl(page), this.wikiPageDownloaded.bind(this, loadcb, errorcb, 0), errorcb);
};
Utils.prototype.wikiPageDownloaded = function wikiPageDownloaded(loadcb, errorcb, timesredirected, text, status, statusText)
{
	// check for redirects
	var matches = text.match(/^\s*#\s*REDIRECT\s*\[\[(.*)\]\]/i);
	if (matches)
	{
		if (timesredirected >= 3) // follow 3 redirects, but no more
		{
			errorcb(500, "Too many redirects");
			return;
		}
		// Get the page name out of the redirect text
		text = matches[1];
		if ((matches = text.match(/^(.*)\|/)))
			text = matches[1];
		if ((matches = text.match(/^(.*)\#/)))
			text = matches[1];
		text = text.replace(/^\s+|\s+$/g, '');
		this.downloadPage(this.buildWikiUrl(text), this.wikiPageDownloaded.bind(this, loadcb, errorcb, timesredirected + 1), errorcb);
		return;
	}
	loadcb(text, status, statusText);
};
