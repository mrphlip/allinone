function Subtitles()
{
	this.enabled = utils.getPref('subtitles', false);
	this.captions = utils.getPref('captions', true);
	this.colours = utils.getPref('colours', true);
	this.testsubs = utils.getPref('testsubs', false);
	this.language = utils.getPref('language', "en");
	this.testsubsdata = unescape(utils.getPref('testsubsdata', this.DEFAULTXML));
	this.names = utils.getPref('names', 0);
}
Subtitles.prototype.DEFAULTXML = escape('<?xml version="1.0" encoding="utf-8"?>\n<transcript xml:lang="en-us">\n<line start="" end="" speaker=""></line>\n</transcript>');
Subtitles.prototype.NAMES_OPTS = ["Never", "Voiceovers", "Always"];
Subtitles.prototype.NO_SUBTITLES = document.createComment("");
Subtitles.prototype.init = function init()
{
	utils.addGlobalStyle(
		#include_string "subtitles.css"
	);
	
	this.setting_enabled = globals.modules.settingspane.addCheckbox('subtitles', "Show subtitles", "Shows subtitles or captions below the toon, if any are available", this.enabled);

	var settingrow = globals.modules.settingspane.addSettingRow(this.setting_enabled);
	var settinglabel = document.createElement('label');
	settinglabel.htmlFor = "setting_language";
	settinglabel.appendChild(document.createTextNode('Subtitle Language: '));
	settinglabel.title = 'Display subtitles in this language, if any';
	settingrow.appendChild(settinglabel);
	this.setting_language = document.createElement('select');
	this.setting_language.title = 'Display subtitles in this language, if any';
	this.setting_language.id = "setting_language";
	this.setting_language.disabled = true;
	settingrow.appendChild(this.setting_language);

	this.language_populated = false;
	this.populateLanguage();

	this.setting_captions = globals.modules.settingspane.addCheckbox('captions', "Show captions", "Include sound effects in the subtitles", this.captions, this.setting_enabled);
	this.setting_colours = globals.modules.settingspane.addCheckbox('colours', "Use colours", "Distinguish characters by colour effects (turn off if colourblind)", this.colours, this.setting_enabled);

	settingrow = globals.modules.settingspane.addSettingRow(this.setting_enabled);
	settinglabel = document.createElement('label');
	settinglabel.htmlFor = "setting_names";
	settinglabel.appendChild(document.createTextNode('Show speakers\' names: '));
	settinglabel.title = 'Show the speakers\' names before their lines';
	settingrow.appendChild(settinglabel);
	this.setting_names = document.createElement('select');
	this.setting_names.title = 'Show the speakers\' names before their lines';
	this.setting_names.id = "setting_names";
	settingrow.appendChild(this.setting_names);
	for (var i = 0; i < this.NAMES_OPTS.length; i++)
	{
		var option = document.createElement('option');
		option.value = i;
		option.appendChild(document.createTextNode(this.NAMES_OPTS[i]));
		if (this.names == i)
			option.selected = true;
		this.setting_names.appendChild(option);
	}

	this.setting_testsubs = globals.modules.settingspane.addCheckbox('testsubs', "Test subtitles script", "Use this to test a subtitles script (copy/paste into a text box)", this.testsubs, this.setting_enabled);

	settingrow = globals.modules.settingspane.addSettingRow(this.setting_testsubs);
	this.setting_testsubsdata = document.createElement('textarea');
	this.setting_testsubsdata.title = 'Paste your XML data here';
	this.setting_testsubsdata.id = "setting_testsubsdata";
	this.setting_testsubsdata.style.width = "100%";
	this.setting_testsubsdata.style.height = "10em";
	this.setting_testsubsdata.style.fontSize = "8px";
	this.setting_testsubsdata.style.textAlign = "left";
	this.setting_testsubsdata.appendChild(document.createTextNode(this.testsubsdata));
	settingrow.appendChild(this.setting_testsubsdata);

	this.charsready = false;
	this.subsready = false;

	this.setupSubtitles();

	window.setInterval(this.update.bind(this), 50);
};
Subtitles.prototype.updateSettings = function updateSettings()
{
	this.enabled = this.setting_enabled.checked;
	utils.setPref('subtitles', this.enabled);
	if (this.language_populated)
	{
		this.language = this.setting_language.value;
		utils.setPref('language', this.language);
	}
	this.captions = this.setting_captions.checked;
	utils.setPref('captions', this.captions);
	this.colours = this.setting_colours.checked;
	utils.setPref('colours', this.colours);
	this.names = this.setting_names.value;
	utils.setPref('names', this.names);
	this.testsubs = this.setting_testsubs.checked;
	utils.setPref('testsubs', this.testsubs);
	this.testsubsdata = this.setting_testsubsdata.value;
	utils.setPref('testsubsdata', escape(this.testsubsdata));

	this.setupSubtitles();
};

Subtitles.prototype.populateLanguage = function populateLanguage()
{
	var option = document.createElement('option');
	option.appendChild(document.createTextNode("Loading..."));
	option.selected = true;
	this.setting_language.appendChild(option);
	utils.downloadWikiXML("Subtitles:Languages", this.languageListDownloaded.bind(this), this.languageListError.bind(this));
};
Subtitles.prototype.languageListDownloaded = function languageListDownloaded(xml)
{
	while (this.setting_language.firstChild)
		this.setting_language.removeChild(this.setting_language.firstChild);

	var languages = xml.getElementsByTagName('language');
	for (var i = 0; i < languages.length; i++)
	{
		var node = languages[i];
		// sanity-check the node
		if (node.hasAttribute('xml:lang') && node.firstChild && (node.firstChild.nodeType == xml.TEXT_NODE || node.firstChild.nodeType == xml.CDATA_SECTION_NODE))
		{
			var option = document.createElement('option');
			option.appendChild(document.createTextNode(node.firstChild.nodeValue));
			option.lang = option.value = node.getAttribute('xml:lang');
			if (option.lang == this.language)
				option.selected = true;
			option.dir = "ltr";
			if (node.hasAttribute('dir'))
				option.dir = node.getAttribute('dir');
			this.setting_language.appendChild(option);
		}
	}
	
	this.setting_language.disabled = false;
	this.language_populated = true;
};
Subtitles.prototype.languageListError = function languageListError()
{
	while (this.setting_language.firstChild)
		this.setting_language.removeChild(this.setting_language.firstChild);
	var option = document.createElement('option');
	option.appendChild(document.createTextNode("Error loading languages"));
	option.selected = true;
	this.setting_language.appendChild(option);
};

Subtitles.prototype.removeSubtitles = function removeSubtitles()
{
	if (this.subtitleholder)
	{
		this.subtitleholder.parentNode.removeChild(this.subtitleholder);
		this.subtitleholder = undefined;
	}
	if (this.errorsholder)
	{
		this.errorsholder.parentNode.removeChild(this.errorsholder);
		this.errorsholder = undefined;
	}

	globals.modules.fullscreen.doResize();
};
Subtitles.prototype.createSubtitleHolder = function createSubtitleHolder()
{
	this.subtitleholder = document.createElement('div');
	this.subtitleholder.className = "subtitles";
	var where = globals.flashmovie;
	if (globals.modules.seekbar && globals.modules.seekbar.seekbar)
		where = globals.modules.seekbar.seekbar;
	while(where.parentNode.tagName.toLowerCase() == "object")
		where = where.parentNode;
	utils.insertAfter(this.subtitleholder, where);
	this.subtitleholder.appendChild(this.NO_SUBTITLES);
	this.currentsubtitles = this.NO_SUBTITLES;

	globals.modules.fullscreen.doResize();
};
Subtitles.prototype.createErrorsHolder = function createErrorsHolder()
{
	this.errorsholder = document.createElement('div');
	this.errorsholder.className = "subtitle_errors";
	var where = globals.flashmovie;
	if (globals.modules.seekbar && globals.modules.seekbar.seekbar)
		where = globals.modules.seekbar.seekbar;
	while(where.parentNode.tagName.toLowerCase() == "object")
		where = where.parentNode;
	utils.insertAfter(this.errorsholder, where);

	globals.modules.fullscreen.doResize();
};
Subtitles.prototype.transcriptError = function transcriptError(message)
{
	if (!this.errorsholder)
		this.createErrorsHolder();
	var div = document.createElement("div");
	div.appendChild(document.createTextNode(message));
	this.errorsholder.appendChild(div);

	globals.modules.fullscreen.doResize();
};

Subtitles.prototype.setupSubtitles = function setupSubtitles()
{
	this.removeSubtitles();

	if (!this.enabled)
		return;

	this.createSubtitleHolder();
	this.setSubtitles(document.createTextNode("Loading subtitles..."));
	
	if (!this.charsready)
		utils.downloadWikiXML('Subtitles:Characters', this.charactersLoaded.bind(this), this.downloadSubsError.bind(this));
	else
		this.reloadSubs();
};
Subtitles.prototype.charactersLoaded = function charactersLoaded(xml)
{
	var speakers = xml.getElementsByTagName("speaker");
	this.characters = {
		sfx: {
			color: "#FFF",
			sfx: true,
			name: {en: ""}
		}
	};
	for (var i = 0; i < speakers.length; i++)
	{
		var speakername = speakers[i].getAttribute("id");
		this.characters[speakername] = {color: speakers[i].getAttribute("color"), sfx: speakers[i].hasAttribute("sfx"), name: {en: ""}};
		var names = speakers[i].getElementsByTagName("name");
		for (var j = 0; j < names.length; j++)
		{
			var lang = names[j].getAttribute("xml:lang");
			if (names[j].firstChild && (names[j].firstChild.nodeType == xml.TEXT_NODE || names[j].firstChild.nodeType == xml.CDATA_SECTION_NODE))
				this.characters[speakername].name[lang] = names[j].firstChild.nodeValue;
		}
	}
	this.charsready = true;
	this.reloadSubs();
};
Subtitles.prototype.downloadSubsError = function downloadSubsError(status, statusText)
{
	this.removeSubtitles();
	if (this.testsubs)
		this.transcriptError(statusText);
};
Subtitles.prototype.reloadSubs = function reloadSubs()
{
	if (!this.charsready)
		return;
	this.subsready = false;

	this.removeSubtitles();
	this.createSubtitleHolder();
	this.setSubtitles(document.createTextNode("Loading subtitles..."));

	if (!this.testsubs)
		utils.downloadWikiXML('Subtitles:' + globals.filename + '/' + this.language, this.transcriptLoaded.bind(this), this.downloadSubsError.bind(this));
	else
		utils.wikiXMLDownloaded(this.transcriptLoaded.bind(this), this.downloadSubsError.bind(this), this.testsubsdata, 200, "OK");
};

Subtitles.prototype.transcriptLoaded = function transcriptLoaded(xml)
{
	// set some defaults
	if (!xml.documentElement.getAttribute("xml:lang")) xml.documentElement.setAttribute("xml:lang", this.language);
	if (!xml.documentElement.getAttribute("dir"))      xml.documentElement.setAttribute("dir",      "ltr");
	// inherit languages to all subnodes
	this.inheritLanguages(xml.documentElement);
	// now parse the lines into divs and get start and end frames
	var lines = xml.getElementsByTagName("line");
	var previousEnd = NaN;
	this.transcript = [];
	for (var i = 0; i < lines.length; i++)
	{
		var line = {};
		// ignore lines with missing start/end values
		// so you can add all the lines and not worry about timing them until later
		if (!lines[i].getAttribute("start") || !lines[i].getAttribute("end"))
			continue;
		line.start = parseInt(lines[i].getAttribute("start"), 10);
		line.end = parseInt(lines[i].getAttribute("end"), 10);
		if (this.testsubs)
		{
			if (isNaN(line.start))
				this.transcriptError("Start value \"" + lines[i].getAttribute("start") + "\" is not a number");
			if (isNaN(line.end))
				this.transcriptError("End value \"" + lines[i].getAttribute("end") + "\" is not a number");
			if (line.end < line.start)
				this.transcriptError("Line beginning frame " + line.start + " ends before it begins.");
			if (line.start < previousEnd)
				this.transcriptError("Line beginning frame " + line.start + " starts before the previous frame ends.");
			previousEnd = line.end;
		}
		line.text = this.importNodes(lines[i]);
		this.transcript.push(line);
	}
	this.subsready = true;
};
Subtitles.prototype.inheritLanguages = function inheritLanguages(node)
{
	for (var i = node.firstChild; i; i = i.nextSibling)
	{
		if (i.nodeType == i.ELEMENT_NODE)
		{
			if (!i.hasAttribute("xml:lang")) i.setAttribute("xml:lang", node.getAttribute("xml:lang"));
			if (!i.hasAttribute("dir"))      i.setAttribute("dir",      node.getAttribute("dir"));
			this.inheritLanguages(i);
		}
	}
};
Subtitles.prototype.importNodes = function importNodes(node)
{
	var name = node.nodeName.toLowerCase();
	if (this.characters[name])
	{
		node.setAttribute("speaker", name);
		name = "speaker";
	}
	if (name == "line" || name == "speaker")
	{
		// format the speaker appropriately as a div
		var speaker = node.getAttribute("speaker");
		if (!this.captions && (speaker == "sfx" || node.hasAttribute("sfx")))
			return document.createComment(""); // return nothing
		newNode = document.createElement("div");
		var char = this.characters[speaker];
		if (!char)
		{
			if (this.testsubs && speaker)
			{
				var line = node;
				while (line && line.nodeName != "line")
					line = line.parentNode;
				if (line)
					this.transcriptError("Line beginning frame " + line.getAttribute("start") + " has an unrecognised speaker name \"" + speaker + '"');
			}
			char = {color: "#FFF", name: {en: ""}};
		}
		if (this.colours)
			newNode.style.color = char.color;
		if (node.hasAttribute("voiceover"))
			newNode.className = "italic";
		if (node.hasAttribute("volume"))
		{
			newNode.style.fontSize = (node.getAttribute("volume") * 100) + "%";
			newNode.style.lineHeight = "1.25em";
		}
		newNode.lang = node.getAttribute("xml:lang");
		newNode.dir = node.getAttribute("dir");
		var hasSpeakerChildren = false;
		for (var i = node.firstChild; i; i = i.nextSibling)
		{
			if (i.nodeType == i.ELEMENT_NODE)
			{
				newNode.appendChild(this.importNodes(i));
				var a = i.nodeName.toLowerCase();
				if (a == "line" || a == "speaker" || this.characters[a])
					hasSpeakerChildren = true;
			}
			else if (i.nodeType == i.TEXT_NODE || i.nodeType == i.CDATA_SECTION_NODE)
				newNode.appendChild(document.importNode(i, true));
		}
		if (!hasSpeakerChildren)
		{
			// this is a normal text node - do some extra text stuff
			if (char.sfx || node.hasAttribute("sfx"))
			{
				newNode.insertBefore(document.createTextNode('('), newNode.firstChild);
				newNode.appendChild(document.createTextNode(')'));
				newNode.className = "italic";
			}
			if (this.names == 2 || (node.hasAttribute("voiceover") && this.names == 1))
			{
				// find the language with the longest prefix match
				// fall back to "en" if none found
				var bestmatch = "en";
				var langbits = node.getAttribute("xml:lang").split("-");
				for (i = langbits.length; i >= 1; i--)
				{
					var lang = langbits.slice(0, i).join("-");
					if (char.name[lang])
					{
						bestmatch = lang;
						break;
					}
				}
				if (char.name[bestmatch] != '')
					newNode.insertBefore(document.createTextNode(char.name[bestmatch] + ": "), newNode.firstChild);
			}
		}
		return newNode;
	}
	else
	{
		// check element blacklist
		if (name == "script" ||
		    name == "style"  ||
		    name == "object" ||
		    name == "param"  ||
		    name == "embed"  ||
		    name == "a"      ||
		    name == "img"    ||
		    name == "applet" ||
		    name == "map"    ||
		    name == "frame"  ||
		    name == "iframe" ||
		    name == "meta"   ||
		    name == "link"   ||
		    name == "form"   ||
		    name == "input")
		{
			if (this.testsubs)
				this.transcriptError("Blacklisted element \"" + name + "\" stripped.");
			return document.createComment(""); // return nothing
		}
		var newNode = document.createElement(name);
		// copy across attributes
		for (i = 0; i < node.attributes.length; i++)
		{
			name = node.attributes[i].nodeName.toLowerCase();
			// check attribute blacklist
			// javascript, and anything that might load stuff from offsite
			if (name != "href" && name != "src" && name.substring(0, 2) != "on")
			{
				if (name == "style")
				{
					// regex taken from MediaWiki Sanitizer.php
					if (!node.attributes[i].value.match(/(expression|tps*:\/\/|url\\s*\()/i))
						newNode.setAttribute("style", node.attributes[i].value);
				}
				else if (name == "xml:lang")
				{
					newNode.lang = node.attributes[i].value;
				}
				else
					newNode.setAttribute(node.attributes[i].nodeName, node.attributes[i].value);
			}
			else if (this.testsubs)
				this.transcriptError("Blacklisted attribute \"" + name + "\" stripped.");
		}
		// copy across children
		for (i = node.firstChild; i; i = i.nextSibling)
		{
			if (i.nodeType == i.ELEMENT_NODE)
				newNode.appendChild(this.importNodes(i));
			else if (i.nodeType == i.TEXT_NODE || i.nodeType == i.CDATA_SECTION_NODE)
				newNode.appendChild(document.importNode(i, true));
		}
		return newNode;
	}
	return document.createComment(""); // fallthrough
};

Subtitles.prototype.update = function update()
{
	if (!this.enabled || !this.charsready || !this.subsready || !this.subtitleholder)
		return;

	utils.currentFrame((frame) => {
		if (frame < 0)
			return;
		frame++; // Make 1-based
		// binary search to find the right transcript line
		var first = 0;
		var last = this.transcript.length;
		while(first < (last - 1))
		{
			var mid = (first + last) >> 1;
			if (frame >= this.transcript[mid].start)
			{
				first = mid;
				if (frame <= this.transcript[mid].end)
					break;
			}
			else
				last = mid;
		}
		// should we actually show the line?
		if(this.transcript[first] && this.transcript[first].start <= frame && this.transcript[first].end >= frame)
			this.setSubtitles(this.transcript[first].text);
		else
			this.setSubtitles(false);
	});
};

Subtitles.prototype.setSubtitles = function setSubtitles(node)
{
	if (!this.subtitleholder)
		return;
	if (!node)
		node = this.NO_SUBTITLES;
	if (this.currentsubtitles != node)
	{
		this.subtitleholder.replaceChild(node, this.subtitleholder.firstChild);
		this.currentsubtitles = node;
	}
};
