function TyphmUtils() {
	throw new Error('This is a static class');
}

TyphmUtils.getHexFromRatio = function (ratio) {
	return Math.round(ratio*255).toString(16).padStart(2, '0');
};

TyphmUtils.getRgbFromHue = function (hue) {
	const m = (Math.abs(hue) / (Math.PI/3)) % 6;
	if (m < 1) {
		return `#ff${this.getHexFromRatio(m)}00`;
	} else if (m < 2) {
		return `#${this.getHexFromRatio(2-m)}ff00`;
	} else if (m < 3) {
		return `#00ff${this.getHexFromRatio(m-2)}`;
	} else if (m < 4) {
		return `#00${this.getHexFromRatio(4-m)}ff`;
	} else if (m < 5) {
		return `#${this.getHexFromRatio(m-4)}00ff`;
	} else if (m < 6) {
		return `#ff00${this.getHexFromRatio(6-m)}`;
	}
};

TyphmUtils.getAudioDuration = async function (url) {
	return new Promise(resolve => {
		let audio = new Audio();
		audio.addEventListener('loadedmetadata', () => resolve(audio.duration*1000));
		audio.preload = 'metadata';
		audio.src = url;
	});
};

TyphmUtils.parseDigit = function (digitString) {
	if (digitString.length !== 1)
		return null;
	const charCode = digitString.charCodeAt(0);
	if (charCode >= 48 && charCode < 58) // 0--9
		return charCode - 48;
	if (charCode >= 97 && charCode < 123) // a--z
		return charCode - 97 + 10;
	return null;
};

TyphmUtils.isDigit = function (string) {
	if (string.length !== 1)
		return false;
	const charCode = string.charCodeAt(0);
	return charCode >= 48 && charCode < 58 || charCode >= 97 && charCode < 123;
};

TyphmUtils.isArabicDigit = function (string) {
	if (string.length !== 1)
		return false;
	const charCode = string.charCodeAt(0);
	return charCode >= 48 && charCode < 58;
};

TyphmUtils.isCapitalized = function (string) {
	const charCode = string.charCodeAt(0);
	return charCode >= 65 && charCode < 91;
};

TyphmUtils.fromRGBAToHex = function () {
	return '#' + Array.from(arguments, x => Math.round(x * 0xff).toString(16).padStart(2, '0')).join('');
};

Object.fromKeysAndValues = function (keys, values) {
	const result = {};
	for (let i = 0; i < keys.length; i++)
		result[keys[i]] = values[i];
	return result;
};

Object.setPropertyWithGetter = function (target, key, value) {
	Object.defineProperty(target, key, {get: () => value, configurable: true, enumerable: true});
};

const oldSwitchStretchMode = Graphics._switchStretchMode;
Graphics._switchStretchMode = function() {
	oldSwitchStretchMode.apply(this, arguments);
	for (let i = this._switchStretchModeListeners.length - 1; i >= 0; i--) {
		this._switchStretchModeListeners[i](this._stretchEnabled);
	}
};

const oldGraphicsInitialize = Graphics.initialize;
Graphics.initialize = function (width, height, type) {
	oldGraphicsInitialize.apply(this, arguments);
	this._switchStretchModeListeners = [];
};

Graphics.addSwitchStretchModeListener = function (listener) {
	this._switchStretchModeListeners.push(listener);
};

Graphics.removeSwitchStretchModeListener = function (listener) {
	this._switchStretchModeListeners.splice(this._switchStretchModeListeners.findIndex(listener), 1);
};

Graphics.snapshotToClipboard = function () {
	this._canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({'image/png': blob})]), 'image/png');
};

const oldShouldPreventDefault = Input._shouldPreventDefault;
Input._shouldPreventDefault = function(keyCode) {
	if (document.activeElement instanceof HTMLInputElement)
		return false
	else
		return oldShouldPreventDefault.apply(this, arguments);
};

TouchInput.preventingDefault = true;

TouchInput._onTouchStart = function(event) {
	for (var i = 0; i < event.changedTouches.length; i++) {
		var touch = event.changedTouches[i];
		var x = Graphics.pageToCanvasX(touch.pageX);
		var y = Graphics.pageToCanvasY(touch.pageY);
		if (Graphics.isInsideCanvas(x, y)) {
			this._screenPressed = true;
			this._pressedTime = 0;
			if (event.touches.length >= 2) {
				this._onCancel(x, y);
			} else {
				this._onTrigger(x, y);
			}
			TouchInput._preventDefault(event);
		}
	}
	TouchInput._preventDefault(event);
};

TouchInput._preventDefault = function (event) {
	if (this.preventingDefault || Graphics.pageToCanvasY(event.changedTouches[0].pageY) < preferences.textHeight)
		event.preventDefault();
};

Array.prototype.last = function () {
	return this[this.length - 1];
};

String.prototype.red = function () {
	return parseInt(this.substring(1, 3), 16) / 255;
};

String.prototype.green = function () {
	return parseInt(this.substring(3, 5), 16) / 255;
};

String.prototype.blue = function () {
	return parseInt(this.substring(5, 7), 16) / 255;
};

String.prototype.alpha = function () {
	return parseInt(this.substring(7, 9), 16) / 255 || 1;
};

String.prototype.capitalizeFirstLetter = function () {
	return this.length <= 1 ? this.toUpperCase() : this[0].toUpperCase() + this.slice(1);
};

String.prototype.fromSnakeToCamel = function () {
	return this.length <= 1 ? this : this[0] + this.split('_').map(s => s.capitalizeFirstLetter()).join('').slice(1);
};

const oldInitialize = Bitmap.prototype.initialize;
Bitmap.prototype.initialize = function (width, height) {
	oldInitialize.apply(this, arguments);
	this.fontSize = preferences.fontSize;
	this.outlineWidth = 0;
	this.textColor = preferences.textColor;
};

Graphics._requestFullScreen = function() {
	var element = document.documentElement;
	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullScreen) {
		element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
	} else if (element.msRequestFullscreen) {
		element.msRequestFullscreen();
	}
};

WebAudio.clearBufferPool = function () {
	WebAudio._bufferPool = {};
};

WebAudio.clearBufferPool();

WebAudio.prototype._onXhrLoad = function(xhr) {
	let array = xhr.response;
	if(Decrypter.hasEncryptedAudio) array = Decrypter.decryptArrayBuffer(array);
	this._readLoopComments(new Uint8Array(array));
	WebAudio._context.decodeAudioData(array, buffer => {
		WebAudio._bufferPool[this._url] = {'buffer': buffer, loopLength: this._loopLength, loopStart: this._loopStart, sampleRate: this._sampleRate};
		this._processBuffer(buffer);
	});
};

WebAudio.prototype._processBuffer = function (buffer) {
	this._buffer = buffer;
	this._totalTime = buffer.duration;
	if (this._loopLength > 0 && this._sampleRate > 0) {
		this._loopStart /= this._sampleRate;
		this._loopLength /= this._sampleRate;
	} else {
		this._loopStart = 0;
		this._loopLength = this._totalTime;
	}
	this._onLoad();
};

const oldLoad = WebAudio.prototype._load;
WebAudio.prototype._load = function(url) {
	if (WebAudio._context && WebAudio._bufferPool[url]) {
		const {buffer, loopLength, loopStart, sampleRate} = WebAudio._bufferPool[url];
		setTimeout(() => {
			this._loopLength = loopLength;
			this._loopStart = loopStart;
			this._sampleRate = sampleRate;
			this._processBuffer(buffer)
		});
	} else {
		oldLoad.apply(this, arguments);
	}
};

WebAudio.prototype._createEndTimer = function() {
	if (this._sourceNode && !this._sourceNode.loop) {
		var endTime = this._startTime + this._totalTime / this._pitch;
		var delay =  endTime - WebAudio._context.currentTime;
		this._endTimer = setTimeout(function() {
			this.stop();
			if (this._finishListeners) {
				while (this._finishListeners.length > 0) {
					var listner = this._finishListeners.shift();
					listner();
				}
			}
		}.bind(this), delay * 1000);
	}
};

const oldClear = WebAudio.prototype.clear;
WebAudio.prototype.clear = function() {
	oldClear.call(this);
	this._finishListeners = [];
};

WebAudio.prototype.addFinishListener = function(listner) {
	this._finishListeners.push(listner);
};

math.import({
	if: (...arguments) => {
		for (let i = 0; i < arguments.length; i += 2) {
			if (i === arguments.length - 1) {
				return arguments[i];
			} else if (arguments[i]) {
				return arguments[i + 1];
			}
		}
	}
});
window.frac = math.fraction.bind(math);
window.fracmath = math.create({number: 'Fraction'});
window.fraceval = fracmath.evaluate.bind(fracmath);
window.matheval = math.evaluate.bind(math);
window.numre = (...arguments) => Number(math.re(math.evaluate(...arguments)))

TyphmUtils.generateFunctionFromFormula = function (formula, environments, xAcceptor, parameters) {
	parameters ||= [];
	const expression = math.parse(formula).compile();
	return (x, ...param) => {
		if (xAcceptor)
			xAcceptor.currentX = x;
		const scope = {};
		for (const e of environments)
			Object.defineProperties(scope, Object.getOwnPropertyDescriptors(e));
		scope.x = Number(x);
		Object.assign(scope, Object.fromKeysAndValues(parameters, param.map(a => Number(a))));
		return expression.evaluate(scope);
	};
};

TyphmUtils.generateFunctionFromFormulaWithoutX = function (formula, environments, parameters) {
	parameters ||= [];
	const expression = math.parse(formula).compile();
	return (...param) => {
		const scope = {};
		for (const e of environments)
			Object.defineProperties(scope, Object.getOwnPropertyDescriptors(e));
		Object.assign(scope, Object.fromKeysAndValues(parameters, param.map(a => Number(a))));
		return expression.evaluate(scope);
	}
};
