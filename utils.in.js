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
