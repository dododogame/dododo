function Scene_Error() {
	this.initialize.apply(this, arguments);
}

Scene_Error.prototype = Object.create(Scene_Base.prototype);
Scene_Error.prototype.constructor = Scene_Error;

Scene_Error.prototype.initialize = function (error) {
	Scene_Base.prototype.initialize.call(this);
	this._error = error;
};

Scene_Error.prototype.start = function () {
	Scene_Base.prototype.start.call(this);
	
	this._back = new Button(new Bitmap(256, preferences.textHeight), () => this._shouldBack = true);
	this._back.anchor.x = 0.5;
	this._back.x = Graphics.width / 2;
	this._back.y = Graphics.height - preferences.textHeight;
	this._back.bitmap.drawText(`${Strings.back} (Escape)`, 0, 0, this._back.width, preferences.textHeight, 'center');
	this.addChild(this._back);
	
	this._message = new Sprite(new Bitmap(Graphics.width, Graphics.height));
	this._lineIndex = 0;
	if (this._error instanceof BeatmapError) {
		this._appendMessage(Strings.infoForBeatmapper);
		this._text = `${this._error.lineno}:${this._error.column}: ${this._error.message}`;
		this._appendMessage(this._text);
		this._createCopyButton();
	} else if (this._error instanceof BeatmapRuntimeError) {
		this._appendMessage(Strings.infoForBeatmapper);
		this._text = this._error.message;
		this._appendMessage(this._text);
		for (let i = 0; i < this._error.backtrace.length; i++) {
			const caller = this._error.backtrace[i];
			const text = `  at line ${caller.lineno} in ${caller.caller}`;
			this._text += text + '\n';
			this._appendMessage(text);
		}
		this._createCopyButton();
	} else
		this._appendMessage(Strings.failedToLoad);
	this.addChild(this._message);
	
	this._shouldBack = false;
	this._shouldCopy = false;
	
	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
};

Scene_Error.prototype._createCopyButton = function () {
	this._copy = new Button(new Bitmap(256, preferences.textHeight), () => this._shouldCopy = true);
	this._copy.anchor.x = 0.5;
	this._copy.x = Graphics.width / 2;
	this._copy.y = Graphics.height - preferences.textHeight * 2;
	this._copy.bitmap.drawText(`${Strings.copy} (c)`, 0, 0, this._copy.width, preferences.textHeight, 'center');
	this.addChild(this._copy);
};

Scene_Error.prototype.update = function () {
	if (this._shouldBack) {
		window.scene = new Scene_Title();
	}
	if (this._shouldCopy) {
		navigator.clipboard.writeText(this._text);
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Error.prototype.stop = function () {
	Scene_Base.prototype.stop.call(this);
	document.removeEventListener('keydown', this._keydownEventListener);
};

Scene_Error.prototype._onKeydown = function (event) {
	if (event.key === 'Escape') {
		this._shouldBack = true;
	} else if (this._text && event.key === 'c') {
		this._shouldCopy = true;
	}
};

Scene_Error.prototype._appendMessage = function (message) {
	this._message.bitmap.drawText(message, 0, this._lineIndex*preferences.textHeight, this._message.width, preferences.textHeight, 'left');
	this._lineIndex++;
};
