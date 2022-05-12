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

Array.prototype.last = function () {
	return this[this.length - 1];
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

window.frac = math.fraction.bind(math);
window.fracmath = math.create({number: 'Fraction'});
window.fraceval = fracmath.evaluate.bind(fracmath);
window.matheval = math.evaluate.bind(math);
