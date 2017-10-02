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
Utils.prototype.useGMFunctions = function useGMFunctions()
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
// Only really need to do this once...
Utils.prototype.useGMFunctions = Utils.prototype.useGMFunctions();
Utils.prototype.getPref = function getPref(key, def)
{
	// Have to do it like this instead of like "if(window.GM_getValue)"
	// because apparently this function isn't actually on "window", and I don't
	// know where it actually lives...
	if (this.useGMFunctions)
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
	if (this.useGMFunctions)
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
	if (typeof GM_xmlhttpRequest == 'function')
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

Utils.prototype.currentFrame = function currentFrame(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return false;

	var a;
	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		if (!flashmovie.TCurrentFrame)
			return -1;
		a = flashmovie.TCurrentFrame("/videoplayer");

		if (typeof(a) != 'number' && a < 0)
			return -1;

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
		a = flashmovie.CurrentFrame;
		if (typeof(a) == 'function')
			a = flashmovie.CurrentFrame();

		if (typeof(a) == 'number' && a >= 0)
			return a;
		else
			return -1;
	}
};
Utils.prototype.currentFrame_cb = function currentFrame_cb(callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback(false);
		return;
	}

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		playercomm.targetCurrentFrame(flashmovie, "/videoplayer", (a) => {
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

			if (callback)
				callback(a);
		});
	}
	else
	{
		playercomm.currentFrame(flashmovie, callback)
	}
};
Utils.prototype.totalFrames = function totalFrames(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return false;

	var a;
	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		if (!flashmovie.TGetPropertyAsNumber)
			return -1;
		a = flashmovie.TGetPropertyAsNumber("/videoplayer", 5); // TOTAL_FRAMES
	}
	else
	{
		a = flashmovie.TotalFrames;
		if (typeof(a) == 'function')
			a = flashmovie.TotalFrames();
	}
	if (typeof(a) == 'number' && a >= 0)
		return a;
	else
		return -1;
};
Utils.prototype.totalFrames_cb = function totalFrames_cb(callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback(false);
		return;
	}

	var a;
	if (flashmovie === globals.flashmovie && globals.is_puppets)
		playercomm.targetTotalFrames(flashmovie, "/videoplayer", callback)
	else
		playercomm.totalFrames(flashmovie, callback)
};
Utils.prototype.isPlaying = function isPlaying(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return false;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		// There isn't a telltarget version of IsPlaying, there's no flag for it in
		// TGetProperty, and it doesn't seem to be gettable via GetVariable (though
		// it's possible I just haven't tried the right thing)...
		// So, for puppet toons, we need to try to track whether it seems to be playing...
		return this.guessisplaying.state;
	}

	var a = flashmovie.IsPlaying;
	if (typeof(a) == 'function')
		a = flashmovie.IsPlaying();
	if (typeof(a) == 'boolean')
		return a;
	else if (typeof(a) == 'number')
		return a != 0;
	else
		return false;
};
Utils.prototype.isPlaying_cb = function isPlaying_cb(callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback(false);
		return;
	}

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		// There isn't a telltarget version of IsPlaying, there's no flag for it in
		// TGetProperty, and it doesn't seem to be gettable via GetVariable (though
		// it's possible I just haven't tried the right thing)...
		// So, for puppet toons, we need to try to track whether it seems to be playing...
		callback(this.guessisplaying.state);
	}
	else
	{
		playercomm.isPlaying(flashmovie, callback);
	}
};
Utils.prototype.framesLoaded = function framesLoaded(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return false;

	if (!flashmovie.TGetPropertyAsNumber)
		return -1;
	var a;
	if (flashmovie === globals.flashmovie && globals.is_puppets)
		a = flashmovie.TGetPropertyAsNumber('/videoplayer', 12); // property 12 is _framesloaded
	else
		a = flashmovie.TGetPropertyAsNumber('/', 12);
	if (typeof(a) == 'number' && a >= 0)
		return a;
	else
		return -1;
};
Utils.prototype.framesLoaded_cb = function framesLoaded_cb(callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback(false);
		return;
	}

	if (flashmovie === globals.flashmovie && globals.is_puppets)
		playercomm.targetFramesLoaded(flashmovie, '/videoplayer', callback)
	else
		playercomm.targetFramesLoaded(flashmovie, '/', callback)
};
Utils.prototype.isLoaded = function isLoaded(flashmovie)
{
	return this.currentFrame(flashmovie) >= 0;
};
Utils.prototype.isLoaded_cb = function isLoaded_cb(callback, flashmovie)
{
	this.currentFrame_cb((frame) => {callback(frame >= 0)}, flashmovie);
};
Utils.prototype.whenLoaded = function whenLoaded(callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	this.currentFrame_cb((frame) => {
		if (frame >= 0)
			callback();
		else
			setTimeout(this.whenLoaded.bind(this, callback, flashmovie), 100);
	}, flashmovie);
};
Utils.prototype.stop = function stop(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		if (!flashmovie.TStopPlay)
			return;
		flashmovie.TStopPlay("/videoplayer");

		this.currentFrame();
		this.guessisplaying.state = false;
	}
	else
	{
		if (!flashmovie.StopPlay)
			return;
		flashmovie.StopPlay();
	}
};
Utils.prototype.stop_cb = function stop_cb(callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback();
		return;
	}

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		playercomm.targetStop(flashmovie, "/videoplayer", () => {
			// make sure this.guessisplaying.lastframe is updated so that it doesn't
			// go back to state=true
			this.currentFrame_cb((frame) => {
				this.guessisplaying.state = false;
			}, flashmovie);

			if (callback)
				callback();
		});
	}
	else
	{
		playercomm.stop(flashmovie, callback);
	}
};
Utils.prototype.play = function play(flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		if (!flashmovie.TPlay)
			return;
		flashmovie.TPlay("/videoplayer");

		this.currentFrame();
		this.guessisplaying.state = true;
		this.guessisplaying.lastframeat = new Date();
	}
	else
	{
		if (!flashmovie.Play)
			return;
		flashmovie.Play();
	}
};
Utils.prototype.play_cb = function play_cb(callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback();
		return;
	}

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		playercomm.targetPlay(flashmovie, "/videoplayer", callback);
		this.guessisplaying.state = true;
		this.guessisplaying.lastframeat = new Date();
	}
	else
	{
		playercomm.play(flashmovie, callback);
	}
};
Utils.prototype.goto = function goto(frame, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		if (!flashmovie.TGotoFrame)
			return;
		flashmovie.TGotoFrame("/videoplayer", frame);

		this.currentFrame();
		this.guessisplaying.state = false;
	}
	else
	{
		if (!flashmovie.GotoFrame)
			return;
		flashmovie.GotoFrame(frame);
	}
};
Utils.prototype.goto_cb = function goto_cb(frame, callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback();
		return;
	}

	if (flashmovie === globals.flashmovie && globals.is_puppets)
	{
		playercomm.targetGoto(flashmovie, "/videoplayer", frame, () => {
			// make sure this.guessisplaying.lastframe is updated so that it doesn't
			// go back to state=true
			this.currentFrame_cb((frame) => {
				this.guessisplaying.state = false;
			}, flashmovie);

			if (callback)
				callback();
		});
	}
	else
	{
		playercomm.goto(flashmovie, frame, callback);
	}
};
Utils.prototype.zoomOut = function zoomOut(factor, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
		return;

	if (!flashmovie.Zoom)
		return;
	flashmovie.Zoom(100 * factor);
};
Utils.prototype.zoomOut_cb = function zoomOut_cb(factor, callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback();
		return;
	}

	playercomm.zoom(flashmovie, 100 * factor, callback);
};
Utils.prototype.zoomIn = function zoomIn(factor, flashmovie)
{
	this.zoomOut(1 / factor, flashmovie);
};
Utils.prototype.zoomIn_cb = function zoomIn_cb(factor, callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback();
		return;
	}

	playercomm.zoom(flashmovie, 100 / factor, callback);
};
Utils.prototype.zoomReset = function zoomReset(flashmovie)
{
	this.zoomOut(0, flashmovie);
};
Utils.prototype.zoomReset_cb = function zoomReset_cb(callback, flashmovie)
{
	if (!flashmovie)
		flashmovie = globals.flashmovie;
	if (!flashmovie)
	{
		if (callback)
			callback();
		return;
	}

	playercomm.zoom(flashmovie, 0, callback);
};

Utils.prototype.insertAfter = function insertAfter(newElement, referenceElement)
{
	if(referenceElement.nextSibling)
		referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
	else
		referenceElement.parentNode.appendChild(newElement);
};
