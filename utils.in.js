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

Utils.prototype.downloadPage_coro = function downloadPage_coro(url, method)
{
	if (!method)
		method = 'GET';
	return new Promise((resolve, reject) => {
		if (typeof(GM) == "object" && GM.xmlHttpRequest) {
			GM.xmlHttpRequest({
				method: method,
				url: url,
				onload: res => resolve({text: res.responseText, status: res.status, statusText: res.statusText, headers: res.responseHeaders}),
				onerror: res => reject(`${res.status} ${res.statusText}`)
			});
		} else if (typeof(GM_xmlhttpRequest) == "function") {
			GM_xmlhttpRequest({
				method: method,
				url: url,
				onload: res => resolve({text: res.responseText, status: res.status, statusText: res.statusText, headers: res.responseHeaders}),
				onerror: res => reject(`${res.status} ${res.statusText}`)
			});
		} else {
			var xhr = new XMLHttpRequest();
			xhr.onload = () => resolve({text: xhr.responseText, status: xhr.status, statusText: xhr.statusText, headers: xhr.getAllResponseHeaders()});
			xhr.onerror = () => reject(`${xhr.status} ${xhr.statusText}`);
			xhr.open(method, url);
			xhr.send();
		}
	});
};
Utils.prototype.buildWikiUrl = function buildWikiUrl(page)
{
	var url = escape(page.replace(/ /g, '_'));
	return "http://www.hrwiki.org/w/index.php?title=" + url + "&action=raw&source=allinone&cachedodge=" + this.getPref('cachedodge', 0);
};
Utils.prototype.downloadWiki_coro = async function downloadWiki(page)
{
	for (var timesredirected = 0; timesredirected < 3; timesredirected++) {
		var res = await this.downloadPage_coro(this.buildWikiUrl(page));

		// check for redirects
		var matches = res.text.match(/^\s*#\s*REDIRECT\s*\[\[(.*)\]\]/i);
		if (matches)
		{
			// Get the page name out of the redirect text
			var text = matches[1];
			if ((matches = text.match(/^(.*)\|/)))
				text = matches[1];
			if ((matches = text.match(/^(.*)\#/)))
				text = matches[1];
			page = text.replace(/^\s+|\s+$/g, '');
		}
		else
			return res.text;
	}
	throw "Too many redirects";
};
Utils.prototype.parseWikiXML = function parseWikiXML(text)
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
		throw "Error in XML:\n" + e.toString();
	}
	// check if returned document is an error message
	if (doc.getElementsByTagName('parsererror').length > 0)
	{
		var error = doc.getElementsByTagName('parsererror')[0];
		if (error.firstChild.nodeType == doc.TEXT_NODE && error.lastChild.nodeType == doc.ELEMENT_NODE && error.lastChild.nodeName == "sourcetext")
		{
			// Firefox's errors look like this:
			// <parsererror>Error details<sourcetext>Source text</sourcetext></parsererror>
			throw (
				error.firstChild.nodeValue.replace(/Location: .*\n/, "") + "\n" +
				doc.documentElement.lastChild.textContent
			);
		}
		else if (error.getElementsByTagName('div').length > 0)
		{
			// Chrome's errors look like this:
			// <someRoot><parsererror style="..."><h3>Generic error message</h3><div style="...">Error details</div><h3>Generic footer</h3><attempted parsing of page/></someRoot>
			throw (
				"Error in XML:\n" +
				error.getElementsByTagName('div')[0].textContent
			);
		}
		else
		{
			// Try to at least return something
			throw (
				"Error in XML:\n" +
				error.textContent
			);
		}
	}
	return doc;
};

Utils.prototype.currentFrame = async function currentFrame(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		var a = await playercomm.targetCurrentFrame(flashmovie, "/videoplayer");

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
		return await playercomm.currentFrame(flashmovie)
	}
};
Utils.prototype.totalFrames = async function totalFrames(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	var a;
	if (flashmovie === globals.flashmovie && globals.is_puppets)
		return await playercomm.targetTotalFrames(flashmovie, "/videoplayer")
	else
		return await playercomm.totalFrames(flashmovie)
};
Utils.prototype.isPlaying = async function isPlaying(flashmovie)
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
		return await playercomm.isPlaying(flashmovie);
	}
};
Utils.prototype.framesLoaded = async function framesLoaded(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
		return await playercomm.targetFramesLoaded(flashmovie, '/videoplayer')
	else
		return await playercomm.targetFramesLoaded(flashmovie, '/')
};
Utils.prototype.isLoaded = async function isLoaded(flashmovie)
{
	var frame = await this.currentFrame(flashmovie);
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
		if (await this.isLoaded(flashmovie))
			resolve();
		else
			setTimeout(poll.bind(this, resolve), 100)
	}
	var promise = new Promise(poll.bind(this));
	if (useglobal)
		this.loadedPromise = promise;
	return promise;
}
Utils.prototype.stop = async function stop(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		await playercomm.targetStop(flashmovie, "/videoplayer");

		// make sure this.guessisplaying.lastframe is updated so that it doesn't
		// go back to state=true
		this.currentFrame((frame) => {
			this.guessisplaying.state = false;
		}, flashmovie);
	}
	else
	{
		await playercomm.stop(flashmovie);
	}
};
Utils.prototype.play = async function play(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		await playercomm.targetPlay(flashmovie, "/videoplayer");
		this.guessisplaying.state = true;
		this.guessisplaying.lastframeat = new Date();
	}
	else
	{
		await playercomm.play(flashmovie);
	}
};
Utils.prototype.goto = async function goto(frame, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		await playercomm.targetGoto(flashmovie, "/videoplayer", frame);

		// make sure this.guessisplaying.lastframe is updated so that it doesn't
		// go back to state=true
		this.currentFrame((frame) => {
			this.guessisplaying.state = false;
		}, flashmovie);
	}
	else
	{
		await playercomm.goto(flashmovie, frame);
	}
};
Utils.prototype.zoomOut = async function zoomOut(factor, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	await playercomm.zoom(flashmovie, 100 * factor);
};
Utils.prototype.zoomIn = async function zoomIn(factor, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	await playercomm.zoom(flashmovie, 100 / factor);
};
Utils.prototype.zoomReset = async function zoomReset(factor, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	await playercomm.zoom(flashmovie, 0);
};

Utils.prototype.insertAfter = function insertAfter(newElement, referenceElement)
{
	if(referenceElement.nextSibling)
		referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
	else
		referenceElement.parentNode.appendChild(newElement);
};
