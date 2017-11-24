function Utils()
{
	this.guessisplaying = {
		lastframe: -1,
		lastframeat: new Date(),
		state: true
	};
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
Utils.prototype.useGMFunctions = async function useGMFunctions()
{
	// We can't just test if GM_getValue exists, because in Chrome they do exist
	// but they don't actually do anything, just report failure to console.log

	// Have to do it like this instead of like "if(window.GM_getValue)"
	// because apparently this function isn't actually on "window", and I don't
	// know where it actually lives...
	if (typeof(GM) == "object" && GM.getValue && await GM.getValue("this-value-doesn't-exist-I-promise", true))
		return 2; // Use GM4 methods
	else if (typeof(GM_getValue) == "function" && GM_getValue("this-value-doesn't-exist-I-promise", true))
		return 1; // Use GM3 methods
	else
		return 0; // Use native methods

	return gmstorage;
};
// Only really need to do this once...
Utils.prototype.useGMFunctions = await Utils.prototype.useGMFunctions();
Utils.prototype.getPref = async function getPref(key, def)
{
	if (this.useGMFunctions == 2)
		return await GM.getValue(key, def);
	else if (this.useGMFunctions == 1)
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
	if (this.useGMFunctions == 2)
		GM.setValue(key, value);
	else if (this.useGMFunctions == 1)
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

Utils.prototype.downloadPage = function downloadPage(url, loadcb, errorcb, method)
{
	if (!method)
		method = 'GET';
	if (typeof(GM) == "object" && GM.xmlHttpRequest)
	{
		var opts = {
			method: method,
			url: url,
			onload: function onload(res) {loadcb(res.responseText, res.status, res.statusText, res.responseHeaders);}
		};
		if (errorcb)
			opts.onerror = function onerror(res) {errorcb(res.status, res.statusText, res.responseHeaders);};
		GM.xmlHttpRequest(opts);
	}
	else if (typeof(GM_xmlhttpRequest) == "function")
	{
		var opts = {
			method: method,
			url: url,
			onload: function onload(res) {loadcb(res.responseText, res.status, res.statusText, res.responseHeaders);}
		};
		if (errorcb)
			opts.onerror = function onerror(res) {errorcb(res.status, res.statusText, res.responseHeaders);};
		GM_xmlhttpRequest(opts);
	}
	else
	{
		var xhr = new XMLHttpRequest();
		xhr.onload = function onload() {loadcb(xhr.responseText, xhr.status, xhr.statusText, xhr.getAllResponseHeaders());};
		if (errorcb)
			xhr.onerror = function onerror() {errorcb(xhr.status, xhr.statusText, xhr.getAllResponseHeaders());};
		xhr.open(method, url);
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
Utils.prototype.downloadWikiXML = function downloadWikiXML(page, loadcb, errorcb)
{
	this.downloadWiki(page, this.wikiXMLDownloaded.bind(this, loadcb, errorcb), errorcb);
};
Utils.prototype.wikiXMLDownloaded = function wikiXMLDownloaded(loadcb, errorcb, text, status, statusText)
{
	// strip various things - templates and <pre> tags for wiki formatting, and <noinclude> sections...
	// <includeonly> tags are stripped (but their contents kept) for consistency.
	text = text.replace(/{{.*?}}/g, "");
	text = text.replace(/<\/?pre[^>]*>/g, "");
	text = text.replace(/<noinclude[^>]*>.*?<\/noinclude[^>]*>/g, "");
	text = text.replace(/<includeonly[^>]*>(.*?)<\/includeonly[^>]*>/g, "$1");
	text = text.replace(/^\s+/g, "");

	var parser = new DOMParser();
	try
	{
		var doc = parser.parseFromString(text, "application/xml");
	}
	catch (e)
	{
		errorcb(500, "Error in XML:\n" + e.toString());
		return;
	}
	// check if returned document is an error message
	if (doc.getElementsByTagName('parsererror').length > 0)
	{
		var error = doc.getElementsByTagName('parsererror')[0];
		if (error.firstChild.nodeType == doc.TEXT_NODE && error.lastChild.nodeType == doc.ELEMENT_NODE && error.lastChild.nodeName == "sourcetext")
		{
			// Firefox's errors look like this:
			// <parsererror>Error details<sourcetext>Source text</sourcetext></parsererror>
			errorcb(500,
				error.firstChild.nodeValue.replace(/Location: .*\n/, "") + "\n" +
				doc.documentElement.lastChild.textContent
			);
		}
		else if (error.getElementsByTagName('div').length > 0)
		{
			// Chrome's errors look like this:
			// <someRoot><parsererror style="..."><h3>Generic error message</h3><div style="...">Error details</div><h3>Generic footer</h3><attempted parsing of page/></someRoot>
			errorcb(500,
				"Error in XML:\n" +
				error.getElementsByTagName('div')[0].textContent
			);
		}
		else
		{
			// Try to at least return something
			errorcb(500,
				"Error in XML:\n" +
				error.textContent
			);
		}
		return;
	}
	loadcb(doc, status, statusText);
};

Utils.prototype.currentFrame_coro = async function currentFrame_coro(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		var a = await playercomm.targetCurrentFrame_coro(flashmovie, "/videoplayer");

		// Keep track of whether the current frame is changing, for isPlaying()
		// If we stay on the same frame for more than, say, a second, guess
		// that we're paused.
		if (a != this.guessisplaying.lastframe)
		{
			this.guessisplaying.lastframe = a;
			this.guessisplaying.lastframeat = new Date();
			this.guessisplaying.state = true;
		}
		else if (new Date() - this.guessisplaying.lastframeat > 1000)
		{
			this.guessisplaying.state = false;
		}

		return a;
	}
	else
	{
		return await playercomm.currentFrame_coro(flashmovie)
	}
};
Utils.prototype.totalFrames_coro = async function totalFrames_coro(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	var a;
	if (flashmovie === globals.flashmovie && globals.is_puppets)
		return await playercomm.targetTotalFrames_coro(flashmovie, "/videoplayer")
	else
		return await playercomm.totalFrames_coro(flashmovie)
};
Utils.prototype.isPlaying_coro = async function isPlaying_coro(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		// There isn't a telltarget version of IsPlaying, there's no flag for it in
		// TGetProperty, and it doesn't seem to be gettable via GetVariable (though
		// it's possible I just haven't tried the right thing)...
		// So, for puppet toons, we need to try to track whether it seems to be playing...
		return this.guessisplaying.state;
	}
	else
	{
		return await playercomm.isPlaying_coro(flashmovie);
	}
};
Utils.prototype.framesLoaded_coro = async function framesLoaded_coro(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
		return await playercomm.targetFramesLoaded_coro(flashmovie, '/videoplayer')
	else
		return await playercomm.targetFramesLoaded_coro(flashmovie, '/')
};
Utils.prototype.isLoaded_coro = async function isLoaded_coro(flashmovie)
{
	var frame = await this.currentFrame_coro(flashmovie);
	return frame >= 0;
};
Utils.prototype.waitLoaded = function waitLoaded(flashmovie)
{
	var useglobal = false;
	if (!flashmovie) {
		useglobal = true;
		flashmovie = globals.flashmovie;
	}
	if (!flashmovie)
		return new Promise((resolve, reject) => reject());

	if (useglobal && this.loadedPromise)
		return this.loadedPromise;

	async function poll(resolve) {
		if (await this.isLoaded_coro(flashmovie))
			resolve();
		else
			setTimeout(poll.bind(this, resolve), 100)
	}
	var promise = new Promise(poll.bind(this));
	if (useglobal)
		this.loadedPromise = promise;
	return promise;
}
Utils.prototype.stop_coro = async function stop_coro(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		await playercomm.targetStop_coro(flashmovie, "/videoplayer");

		// make sure this.guessisplaying.lastframe is updated so that it doesn't
		// go back to state=true
		this.currentFrame((frame) => {
			this.guessisplaying.state = false;
		}, flashmovie);
	}
	else
	{
		await playercomm.stop_coro(flashmovie);
	}
};
Utils.prototype.play_coro = async function play_coro(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		await playercomm.targetPlay_coro(flashmovie, "/videoplayer");
		this.guessisplaying.state = true;
		this.guessisplaying.lastframeat = new Date();
	}
	else
	{
		await playercomm.play_coro(flashmovie);
	}
};
Utils.prototype.goto_coro = async function goto_coro(frame, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		await playercomm.targetGoto_coro(flashmovie, "/videoplayer", frame);

		// make sure this.guessisplaying.lastframe is updated so that it doesn't
		// go back to state=true
		this.currentFrame((frame) => {
			this.guessisplaying.state = false;
		}, flashmovie);
	}
	else
	{
		await playercomm.goto_coro(flashmovie, frame);
	}
};
Utils.prototype.zoomOut_coro = async function zoomOut_coro(factor, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	await playercomm.zoom_coro(flashmovie, 100 * factor);
};
Utils.prototype.zoomIn_coro = async function zoomIn_coro(factor, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	await playercomm.zoom_coro(flashmovie, 100 / factor);
};
Utils.prototype.zoomReset_coro = async function zoomReset_coro(factor, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	await playercomm.zoom_coro(flashmovie, 0);
};

Utils.prototype.insertAfter = function insertAfter(newElement, referenceElement)
{
	if(referenceElement.nextSibling)
		referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
	else
		referenceElement.parentNode.appendChild(newElement);
};
