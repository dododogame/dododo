function Scene_Warning() {
	this.initialize.apply(this, arguments);
}

Scene_Warning.prototype = Object.create(Scene_Base.prototype);
Scene_Warning.prototype.constructor = Scene_Warning;

Scene_Warning.prototype.initialize = function (musicUrl, beatmapUrl, recording) {
	Scene_Base.prototype.initialize.call(this);
	this._musicUrl = musicUrl;
	this._beatmapUrl = beatmapUrl;
	this._recording = recording;
};

Scene_Warning.prototype._createWarningContents = function () {
	this._warningContents = new SoftWrapText(Strings.pseWarningContents, 0, preferences.textHeight, Graphics.width, Graphics.height - preferences.textHeight*4, 'center');
};

Scene_Warning.prototype._drawWarningTitle = function () {
	this._warningTitle = new Sprite(new Bitmap(Graphics.width, preferences.textHeight));
	this._warningTitle.bitmap.drawText(Strings.pseWarningTitle, 0, 0, this._warningTitle.width, preferences.textHeight, 'center');
	this.addChild(this._warningTitle);
};

Scene_Warning.prototype._createBackButton = function () {
	this._back = new Button(new Bitmap(256, preferences.textHeight), () => this._shouldBack = true);
	this._back.anchor.x = 0.5;
	this._back.x = Graphics.width / 2;
	this._back.y = Graphics.height - preferences.textHeight;
	this._back.bitmap.drawText(`${Strings.back} (b)`, 0, 0, this._back.width, preferences.textHeight, 'center');
	this.addChild(this._back);
};

Scene_Warning.prototype._createPlayAnywayButton = function () {
	this._playAnyway = new Button(new Bitmap(256, preferences.textHeight), () => this._shouldPlayAnyway = true);
	this._playAnyway.anchor.x = 0.5;
	this._playAnyway.x = Graphics.width / 2;
	this._playAnyway.y = Graphics.height - preferences.textHeight*2;
	this._playAnyway.bitmap.drawText(`${Strings.playAnyway} (a)`, 0, 0, this._playAnyway.width, preferences.textHeight, 'center');
	this.addChild(this._playAnyway);
};

Scene_Warning.prototype._createTurnOffPerformancesButton = function () {
	this._turnOffPerformances = new Button(new Bitmap(768, preferences.textHeight), () => this._shouldTurnOffPerformances = true);
	this._turnOffPerformances.anchor.x = 0.5;
	this._turnOffPerformances.y = Graphics.height - preferences.textHeight*3;
	this._turnOffPerformances.x = Graphics.width / 2;
	this._turnOffPerformances.bitmap.drawText(`${Strings.turnOffPerformances} (t)`, 0, 0, this._turnOffPerformances.width, preferences.textHeight, 'center');
	this.addChild(this._turnOffPerformances);
};

Scene_Warning.prototype.start = function () {
	Scene_Base.prototype.start.call(this);
	this._drawWarningTitle();
	this._createWarningContents();
	this._createBackButton();
	this._createPlayAnywayButton();
	this._createTurnOffPerformancesButton();
	
	this._shouldBack = false;
	this._shouldPlayAnyway = false;
	this._shouldTurnOffPerformances = false;
	
	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
};

Scene_Warning.prototype.update = function () {
	if (this._shouldBack) {
		window.scene = new Scene_Title();
	} else if (this._shouldPlayAnyway) {
		window.scene = new Scene_Game(this._musicUrl, this._beatmapUrl, this._recording, 0);
	} else if (this._shouldTurnOffPerformances) {
		window.scene = new Scene_Game(this._musicUrl, this._beatmapUrl, this._recording, 0, true);
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Warning.prototype.stop = function () {
	Scene_Base.prototype.stop.call(this);
	document.removeEventListener('keydown', this._keydownEventListener);
	this._warningContents.destroy();
};

Scene_Warning.prototype._onKeydown = function (event) {
	if (event.key === 'b') {
		this._shouldBack = true;
	} else if (event.key === 'a') {
		this._shouldPlayAnyway = true;
	} else if (event.key === 't') {
		this._shouldTurnOffPerformances = true;
	}
};
