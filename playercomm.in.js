function PlayerComm()
{
}
PlayerComm.handlers = {};
PlayerComm.prototype.init = function()
{
	var script = document.createElement("script");
	script.appendChild(document.createTextNode("(" + this.inPageContext + ")();"));
	document.body.appendChild(script);

	this.origin = document.location.protocol + "//" + document.location.hostname;
	var defaultport = '';
	if (document.location.protocol == 'http:')
		defaultport = '80';
	else if (document.location.protocol == 'https:')
		defaultport = '443';
	if (document.location.port && document.location.port != defaultport)
		this.origin += ":" + document.location.port;

	this.callbacks = [];
	this.id_count = 0;

	window.addEventListener("message", this.receiveMessage.bind(this), false);
}
PlayerComm.prototype.inPageContext = function()
{
	// This code is run in the page context (which in Chrome is the only one
	// allowed to communicate with the Flash object) to communicate with the script

	var origin = document.location.protocol + "//" + document.location.hostname;
	var defaultport = '';
	if (document.location.protocol == 'http:')
		defaultport = '80';
	else if (document.location.protocol == 'https:')
		defaultport = '443';
	if (document.location.port && document.location.port != defaultport)
		origin += ":" + document.location.port;

	var handlers = {}

	function receiveMessage(event)
	{
		if (event.origin !== origin)
			return;
		if (event.data.message.substring(0, 8) !== 'aio_req_')
			return;

		var message = event.data.message.substring(8);
		handlers[message](event.data);
	}
	window.addEventListener("message", receiveMessage, false);

	// Documentation for the Flash interface is really lacking...
	// Adobe removed the docs from their website.
	// Luckily, the Wayback Machine captures all
	// http://web.archive.org/web/20100710000820/http://www.adobe.com/support/flash/publishexport/scriptingwithflash/scriptingwithflash_03.html
	// http://web.archive.org/web/20090210205955/http://www.adobe.com/support/flash/publishexport/scriptingwithflash/scriptingwithflash_04.html

	handlers.currentFrame = function(data)
	{
		var elem = document.getElementById(data.id);
		var a = elem.CurrentFrame;
		if (typeof(a) == 'function')
			a = elem.CurrentFrame();
		if (typeof(a) !== 'number' || a < 0)
			a = -1;

		window.postMessage({
			message: "aio_resp_paramCallback",
			callback: data.callback,
			val: a
		}, origin);
	}

	handlers.targetCurrentFrame = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.TCurrentFrame) == 'function')
			a = elem.TCurrentFrame(data.target);
		else
			a = -1;

		window.postMessage({
			message: "aio_resp_paramCallback",
			callback: data.callback,
			val: a
		}, origin);
	}

	handlers.totalFrames = function(data)
	{
		var elem = document.getElementById(data.id);
		var a = elem.TotalFrames;
		if (typeof(a) == 'function')
			a = elem.TotalFrames();
		if (typeof(a) !== 'number' || a < 0)
			a = -1;

		window.postMessage({
			message: "aio_resp_paramCallback",
			callback: data.callback,
			val: a
		}, origin);
	}

	handlers.targetTotalFrames = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.TGetPropertyAsNumber) == 'function')
			a = elem.TGetPropertyAsNumber(data.target, 5);  // TOTAL_FRAMES
		else
			a = -1;

		window.postMessage({
			message: "aio_resp_paramCallback",
			callback: data.callback,
			val: a
		}, origin);
	}

	handlers.isPlaying = function(data)
	{
		var elem = document.getElementById(data.id);
		var a = elem.IsPlaying;
		if (typeof(a) == 'function')
			a = elem.IsPlaying();
		if (typeof(a) == 'number')
			a = (a != 0);
		else if (typeof(a) != 'boolean')
			a = false;

		window.postMessage({
			message: "aio_resp_paramCallback",
			callback: data.callback,
			val: a
		}, origin);
	}

	handlers.targetFramesLoaded = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.TGetPropertyAsNumber) == 'function')
			a = elem.TGetPropertyAsNumber(data.target, 12);  // FRAMES_LOADED
		else
			a = -1;

		window.postMessage({
			message: "aio_resp_paramCallback",
			callback: data.callback,
			val: a
		}, origin);
	}

	handlers.stop = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.StopPlay) == 'function')
			elem.StopPlay();

		window.postMessage({
			message: "aio_resp_basicCallback",
			callback: data.callback
		}, origin);
	}

	handlers.targetStop = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.TStopPlay) == 'function')
			elem.TStopPlay(data.target);

		window.postMessage({
			message: "aio_resp_basicCallback",
			callback: data.callback
		}, origin);
	}

	handlers.play = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.Play) == 'function')
			elem.Play();

		window.postMessage({
			message: "aio_resp_basicCallback",
			callback: data.callback
		}, origin);
	}

	handlers.targetPlay = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.TPlay) == 'function')
			elem.TPlay(data.target);

		window.postMessage({
			message: "aio_resp_basicCallback",
			callback: data.callback
		}, origin);
	}

	handlers.goto = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.GotoFrame) == 'function')
			elem.GotoFrame(data.frame);

		window.postMessage({
			message: "aio_resp_basicCallback",
			callback: data.callback
		}, origin);
	}

	handlers.targetGoto = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.TGotoFrame) == 'function')
			elem.TGotoFrame(data.target, data.frame);

		window.postMessage({
			message: "aio_resp_basicCallback",
			callback: data.callback
		}, origin);
	}

	handlers.zoom = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.Zoom) == 'function')
			elem.Zoom(data.zoom);

		window.postMessage({
			message: "aio_resp_basicCallback",
			callback: data.callback
		}, origin);
	}

	handlers.setScaleMode = function(data)
	{
		var elem = document.getElementById(data.id);
		if (typeof(elem.SetVariable) == 'function')
			elem.SetVariable("Stage.scaleMode", data.scaleMode);

		window.postMessage({
			message: "aio_resp_basicCallback",
			callback: data.callback
		}, origin);
	}
}


PlayerComm.prototype.currentFrame = function(elem)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_currentFrame",
		callback: this.storeCallback(resolve),
		id: this.getId(elem)
	}, this.origin));
}

PlayerComm.prototype.targetCurrentFrame = function(elem, target)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_targetCurrentFrame",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		target: target
	}, this.origin));
}

PlayerComm.prototype.totalFrames = function(elem)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_totalFrames",
		callback: this.storeCallback(resolve),
		id: this.getId(elem)
	}, this.origin));
}

PlayerComm.prototype.targetTotalFrames = function(elem, target)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_targetTotalFrames",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		target: target
	}, this.origin));
}

PlayerComm.prototype.isPlaying = function(elem)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_isPlaying",
		callback: this.storeCallback(resolve),
		id: this.getId(elem)
	}, this.origin));
}

PlayerComm.prototype.targetFramesLoaded = function(elem, target)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_targetFramesLoaded",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		target: target
	}, this.origin));
}

PlayerComm.prototype.stop = function(elem)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_stop",
		callback: this.storeCallback(resolve),
		id: this.getId(elem)
	}, this.origin));
}

PlayerComm.prototype.targetStop = function(elem, target)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_targetStop",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		target: target
	}, this.origin));
}

PlayerComm.prototype.play = function(elem)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_play",
		callback: this.storeCallback(resolve),
		id: this.getId(elem)
	}, this.origin));
}

PlayerComm.prototype.targetPlay = function(elem, target)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_targetPlay",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		target: target
	}, this.origin));
}

PlayerComm.prototype.goto = function(elem, frame)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_goto",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		frame: frame
	}, this.origin));
}

PlayerComm.prototype.targetGoto = function(elem, target, frame)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_targetGoto",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		target: target,
		frame: frame
	}, this.origin));
}

PlayerComm.prototype.zoom = function(elem, zoom)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_zoom",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		zoom: zoom
	}, this.origin));
}

PlayerComm.prototype.setScaleMode = function(elem, scaleMode)
{
	return new Promise(resolve => window.postMessage({
		message: "aio_req_setScaleMode",
		callback: this.storeCallback(resolve),
		id: this.getId(elem),
		scaleMode: scaleMode
	}, this.origin));
}

PlayerComm.prototype.receiveMessage = function(event)
{
	if (event.origin !== this.origin)
		return;
	if (event.data.message.substring(0, 9) !== 'aio_resp_')
		return;

	var message = event.data.message.substring(9);
	PlayerComm.handlers[message].call(this, event.data);
}

PlayerComm.handlers.basicCallback = function(data)
{
	var callback = this.getCallback(data.callback);
	if (callback)
		callback();
}

PlayerComm.handlers.paramCallback = function(data)
{
	var callback = this.getCallback(data.callback);
	if (callback)
		callback(data.val);
}

PlayerComm.prototype.storeCallback = function(callback)
{
	if (!callback)
		return -1;
	var ix = 0;
	while (this.callbacks[ix] !== undefined)
		ix++;
	this.callbacks[ix] = callback;
	return ix;
}
PlayerComm.prototype.getCallback = function(ix)
{
	if (ix < 0)
		return undefined;
	var callback = this.callbacks[ix];
	this.callbacks[ix] = undefined;
	return callback;
}
PlayerComm.prototype.getId = function(elem)
{
	if (!elem.id)
	{
		this.id_count++;
		elem.id = "aio_id_" + this.id_count;
	}
	return elem.id;
}
