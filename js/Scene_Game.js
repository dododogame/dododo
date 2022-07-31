function Scene_Game() {
	this.initialize.apply(this, arguments);
}

Scene_Game.prototype = Object.create(Scene_Base.prototype);
Scene_Game.prototype.constructor = Scene_Game;

Scene_Game.prototype.initialize = function (musicUrl, beatmapUrl, recording, retryCount) {
	Scene_Base.prototype.initialize.call(this);
	this._level = new Level(this, musicUrl, beatmapUrl, recording);
	this.retryCount = retryCount;
};

Scene_Game.prototype.start = function () {
	Scene_Base.prototype.start.call(this);
	
	this._createLoadingSprite();
	this._paused = true;
	this._lastPos = 0.0;
	this._starting = performance.now();
	this._createLayers();
	this._createTwoRows();
	if (this._level.visuals.fadeIn)
		this._createFadeInMask();
	if (this._level.visuals.fadeOut)
		this._createFadeOutMask();
	this._createJudgementLineSprite();
	this._createPauseButton();
	this._createBackButton();
	this._createRestartButton();
	this._createTitleSprite();
	this._setButtonsVisible(false);
	this._createScoreSprite();
	this._createComboSprite();
	if (this._level.visuals.showKeyboard)
		this._createKeyboardSprite();
	this._createMarkSprite();
	this._createSummarySprite();
	this._createFullComboSprite();
	this._createInaccuraciesDistributionSprite();
	if (this._level.visuals.showInaccuracyData)
		this._createInaccuracyDataSprite();
	this._createInaccuracyBarSprite();
	this._createProgressIndicatorSprite();
	this._createAccuracyRateSprite();
	this._createViewRecordingButton();
	this._createSaveRecordingButton();
	this._createModifiersListSprite();
	this._createFlashBitmapsIfNeeded();
	if (this._level.visuals.TPSIndicator)
		this._createTPSIndicatorSprite();
	if (this._level.visuals.numbersHUD)
		this._createNumbersHUD();
	this._createHpBar();
	this._createRetryCounter();
	
	this._fakeJudgementLines = [];
	this._texts = [];
	
	this._ended = false;
	this._pressings = {};
	this._createListeners();
	this._resumingCountdown = null;
	this._loadingFinished = false;
	
	this._onLoad();
	this._shouldRestart = false;
	this._shouldBack = false;
	this._shouldReplay = false;
};

Scene_Game.prototype._createFlashBitmapsIfNeeded = function () {
	this._flashBitmaps = [];
	if (this._level.visuals.flashWarningGood)
		this._createFlashBitmap(Level.GOOD);
	if (this._level.visuals.flashWarningMiss) {
		this._createFlashBitmap(Level.BAD);
		this._createFlashBitmap(Level.MISS);
		this._createFlashBitmap(Level.EXCESS);
	}
};

Scene_Game.prototype._createLoadingSprite = function () {
	this._loading = new Sprite(new Bitmap(256, preferences.textHeight));
	this._center(this._loading, 300);
	this._loading.bitmap.drawText(Strings.loading, 0, 0, 256, preferences.textHeight, 'white');
	this.addChild(this._loading);
};

Scene_Game.prototype._createLayers = function () {
	this.addChild(this._beatmapLayer = new Sprite());
	this.addChild(this._beatmapMaskLayer = new Sprite());
	this.addChild(this._nextBeatmapLayer = new Sprite());
	this.addChild(this._judgementLineLayer = new Sprite());
	this.addChild(this._hitEffectLayer = new Sprite());
	this.addChild(this._HUDLayer = new Sprite());
	this.addChild(this._overHUDLayer = new Sprite());
	this.addChild(this._summaryLayer = new Sprite());
	this.addChild(this._screenEffectLayer = new Sprite());
};

Scene_Game.prototype._createRetryCounter = function () {
	this._retryCounter = new Sprite(new Bitmap(Graphics.width / 2, preferences.textHeight));
	this._retryCounter.bitmap.drawText(sprintf(Strings.retryCounter, this.retryCount), 0, 0, this._retryCounter.width, preferences.textHeight, 'right');
	this._retryCounter.x = Graphics.width - this._retryCounter.width;
	this._retryCounter.anchor.y = 0.5;
	this._retryCounter.y = Graphics.height / 2;
	if (this.retryCount > 0)
		this._HUDLayer.addChild(this._retryCounter);
};

Scene_Game.prototype._createFadeInMask = function () {
	const distance = this._level.visuals.fadeIn * Graphics.width
	const sprite = this._fadeInMask = new Sprite(new Bitmap(Graphics.width*3, Graphics.height*3));
	sprite.anchor.x = 0.5;
	sprite.anchor.y = 0.5;
	sprite.bitmap.fillAll(preferences.backgroundColor);
	sprite.bitmap.clearRect(sprite.width/2 - distance, 0, distance * 2, sprite.height);
	sprite.visible = false;
	this._beatmapMaskLayer.addChild(sprite);
};

Scene_Game.prototype._createFadeOutMask = function () {
	const distance = this._level.visuals.fadeOut * Graphics.width
	const sprite = this._fadeOutMask = new Sprite(new Bitmap(Graphics.width*3, Graphics.height*3));
	sprite.anchor.x = 0.5;
	sprite.anchor.y = 0.5;
	sprite.bitmap.fillRect(sprite.width/2 - distance, 0, distance * 2, sprite.height, preferences.backgroundColor);
	sprite.visible = false;
	this._beatmapMaskLayer.addChild(sprite);
};

Scene_Game.prototype._createTwoRows = function () {
	this._row1Sprite = new Sprite();
	this._row1Sprite.width = Graphics.width;
	this._row1Sprite.anchor.y = 0.5;
	this._center(this._row1Sprite, (Graphics.height - preferences.distanceBetweenRows)/2);
	this._beatmapLayer.addChild(this._row1Sprite);
	this._row2Sprite = new Sprite();
	this._row2Sprite.width = Graphics.width;
	this._row2Sprite.anchor.y = 0.5;
	this._center(this._row2Sprite, (Graphics.height + preferences.distanceBetweenRows)/2);
	this._nextBeatmapLayer.addChild(this._row2Sprite);
};

Scene_Game.prototype._createJudgementLineSprite = function () {
	this._judgementLine = new Sprite(new Bitmap(1, 1));
	this._judgementLine.bitmap.fillAll('white');
	this._judgementLineLayer.addChild(this._judgementLine);
	this._judgementLineLayer.visible = false;
};

Scene_Game.prototype._destroyFakeJudgementLines = function () {
	for (let i = 0; i < this._fakeJudgementLines.length; i++) {
		this._judgementLineLayer.removeChild(this._fakeJudgementLines[i]);
	}
	this._fakeJudgementLines = [];
};

Scene_Game.prototype._destroyTexts = function () {
	for (let i = 0; i < this._texts.length; i++) {
		this._judgementLineLayer.removeChild(this._texts[i]);
	}
	this._texts = [];
};

Scene_Game.prototype._createFakeJudgementLines = function () {
	for (let i = 0; i < this._level.getFakeJudgementLines().length; i++) {
		const sprite = new Sprite(new Bitmap(1, 1));
		sprite.bitmap.fillAll('white');
		this._judgementLineLayer.addChild(sprite);
		this._fakeJudgementLines.push(sprite);
	}
};

Scene_Game.prototype._createTexts = function () {
	for (let i = 0; i < this._level.getTexts().length; i++) {
		const sprite = new Sprite();
		this._judgementLineLayer.addChild(sprite);
		this._texts.push(sprite);
	}
};

Scene_Game.prototype._createHpBar = function () {
	this._hpBar = new Sprite(new Bitmap(Graphics.width, 1));
	this._hpBar.y = Graphics.height - this._hpBar.height;
	this._hpBar.bitmap.fillAll(preferences.hpColor);
	this._hpBar.visible = false;
	this._HUDLayer.addChild(this._hpBar);
};

Scene_Game.prototype._createPauseButton = function () {
	this._pauseButton = new Button(new Bitmap(30, 32), () => { this._pause(); });
	this._pauseButton.y = (preferences.textHeight - 32) / 2;
	this._pauseButton.zIndex = 10;
	this._pauseButton.bitmap.fillRect(6, 4, 6, 24, 'white');
	this._pauseButton.bitmap.fillRect(18, 4, 6, 24, 'white');
	this._pauseButton.visible = false;
	this._HUDLayer.addChild(this._pauseButton);
};

Scene_Game.prototype._createBackButton = function () {
	this._back = new Button(new Bitmap(192, preferences.textHeight),
		() => { this._shouldBack = true; });
	this._back.bitmap.drawText(`${Strings.quitGame} (b)`, 0, 0, 192, preferences.textHeight, 'center');
	this._back.x = 30;
	this._back.zIndex = 10;
	this._HUDLayer.addChild(this._back);
};

Scene_Game.prototype._createRestartButton = function () {
	this._restart = new Button(new Bitmap(192, preferences.textHeight),
		() => { this._shouldRestart = true });
	this._restart.bitmap.drawText(`${Strings.restartGame} (r)`, 0, 0, 192, preferences.textHeight, 'center');
	this._restart.x = 30+192;
	this._HUDLayer.addChild(this._restart);
};

Scene_Game.prototype._createTitleSprite = function () {
	this._title = new Sprite();
	this._title.width = Graphics.width - (32+192+192+128);
	this._title.height = preferences.textHeight;
	this._title.x = 32+192+192;
	this._title.visible = false;
	this._HUDLayer.addChild(this._title);
};

Scene_Game.prototype._createScoreSprite = function () {
	this._scoreSprite = new Sprite(new Bitmap(128, preferences.textHeight));
	this._scoreSprite.anchor.x = 1;
	this._scoreSprite.x = Graphics.width;
	this._scoreSprite.visible = false;
	this._HUDLayer.addChild(this._scoreSprite);
};

Scene_Game.prototype._createComboSprite = function () {
	this._comboSprite = new Sprite(new Bitmap(64, preferences.textHeight));
	this._comboSprite.anchor.y = 1;
	this._comboSprite.y = Graphics.height;
	this._comboSprite.visible = false;
	this._HUDLayer.addChild(this._comboSprite);
};

Scene_Game.prototype._createKeyboardSprite = function () {
	this._keyboardSprite = new Sprite(new Bitmap(512, preferences.textHeight));
	this._keyboardSprite.y = Graphics.height - 2*preferences.textHeight;
	this._keyboardSprite.visible = false;
	this._HUDLayer.addChild(this._keyboardSprite);
};

Scene_Game.prototype._createMarkSprite = function () {
	this._markSprite = new Sprite(new Bitmap(256, 256));
	this._center(this._markSprite, preferences.textHeight);
	this._HUDLayer.addChild(this._markSprite);
};

Scene_Game.prototype._createSummarySprite = function () {
	this._summarySprite = new Sprite(new Bitmap(512, 384));
	this._summarySprite.y = preferences.textHeight;
	this._summaryLayer.addChild(this._summarySprite);
};

Scene_Game.prototype._createFullComboSprite = function () {
	this._fullCombo = new Sprite(new Bitmap(60, preferences.textHeight));
	this._fullCombo.anchor.y = 1;
	this._fullCombo.y = Graphics.height;
	this._fullCombo.x = 80;
	this._fullCombo.bitmap.drawText(Strings.fullCombo, 0, 0, 60, preferences.textHeight, 'center');
	this._fullCombo.visible = false;
	this._HUDLayer.addChild(this._fullCombo);
};

Scene_Game.prototype._createInaccuraciesDistributionSprite = function () {
	const sprite = this._inaccuraciesDistribution = new Sprite(new Bitmap(Graphics.width, Graphics.height - 11*preferences.textHeight));
	sprite.y = 9*preferences.textHeight;
	sprite.bitmap.fillRect(0, sprite.height - preferences.textHeight, sprite.width, 1, preferences.textColor);
	sprite.bitmap.fillRect(sprite.width/2, 0, 1, sprite.height - preferences.textHeight, preferences.textColor);
	sprite.bitmap.fillRect(sprite.width/3, 0, 1, sprite.height - preferences.textHeight, preferences.textColor);
	sprite.bitmap.fillRect(sprite.width*2/3, 0, 1, sprite.height - preferences.textHeight, preferences.textColor);
	sprite.bitmap.drawText('μ', sprite.width/2-64, sprite.height-preferences.textHeight, 128, preferences.textHeight, 'center');
	sprite.bitmap.drawText('μ+σ', sprite.width*2/3-64, sprite.height-preferences.textHeight, 128, preferences.textHeight, 'center');
	sprite.bitmap.drawText('μ-σ', sprite.width/3-64, sprite.height-preferences.textHeight, 128, preferences.textHeight, 'center');
	sprite.visible = false;
	this._summaryLayer.addChild(sprite);
};

Scene_Game.prototype._createInaccuracyDataSprite = function () {
	this._inaccuracyDataSprite = new Sprite(new Bitmap(256, preferences.textHeight));
	this._center(this._inaccuracyDataSprite, Graphics.height - 2 * preferences.textHeight);
	this._HUDLayer.addChild(this._inaccuracyDataSprite);
};

Scene_Game.prototype._createAccuracyRateSprite = function () {
	this._accuracyRateSprite = new Sprite(new Bitmap(256, preferences.textHeight));
	this._accuracyRateSprite.anchor.y = 1;
	this._accuracyRateSprite.anchor.x = 1;
	this._accuracyRateSprite.x = Graphics.width;
	this._accuracyRateSprite.y = Graphics.height;
	this._HUDLayer.addChild(this._accuracyRateSprite);
};

Scene_Game.prototype._createInaccuracyBarSprite = function () {
	this._inaccuracyBar = new Sprite(new Bitmap(512, 10));
	this._inaccuracyBar.anchor.y = 0.5;
	this._center(this._inaccuracyBar, Graphics.height - preferences.textHeight / 2);
	this._drawInaccuracyBar(TyphmConstants.DEFAULT_PERFECT, TyphmConstants.DEFAULT_GOOD, TyphmConstants.DEFAULT_BAD);
	this._inaccuracyBar.visible = false;
	this._HUDLayer.addChild(this._inaccuracyBar);
	this._inaccuracyBitmap = new Bitmap(3, 16); // for use with inaccuracy indicators (small rules)
	this._inaccuracyBitmap.fillAll('white');
};

Scene_Game.prototype._createProgressIndicatorSprite = function () {
	this._progressIndicator = new Sprite(new Bitmap(Graphics.width, 1));
	this._progressIndicator.bitmap.fillAll('white');
	this._progressIndicator.anchor.x = 1;
	this._progressIndicator.visible = false;
	this._HUDLayer.addChild(this._progressIndicator);
};

Scene_Game.prototype._createViewRecordingButton = function () {
	this._viewRecordingButton = new Button(new Bitmap(512, preferences.textHeight), () => this._shouldReplay = true );
	this._viewRecordingButton.bitmap.drawText(`${Strings.viewRecording} (w)`,
		0, 0, this._viewRecordingButton.width, preferences.textHeight, 'right');
	this._viewRecordingButton.anchor.x = 1;
	this._viewRecordingButton.x = Graphics.width;
	this._viewRecordingButton.y = preferences.textHeight;
	this._viewRecordingButton.visible = false;
	this._summaryLayer.addChild(this._viewRecordingButton);
};

Scene_Game.prototype._createModifiersListSprite = function () {
	this._modifiersListSprite = new Sprite(new Bitmap(Graphics.width, preferences.textHeight));
	this._modifiersListSprite.anchor.y = 0.5;
	this._modifiersListSprite.y = Graphics.height / 2;
	this._modifiersListSprite.bitmap.drawText(this._level.modifiersListString(), 0, 0,
		this._modifiersListSprite.width, preferences.textHeight, 'left');
	this._modifiersListSprite.visible = false;
	this._summaryLayer.addChild(this._modifiersListSprite);
};

Scene_Game.prototype._createSaveRecordingButton = function () {
	this._saveRecordingButton = new Button(new Bitmap(512, preferences.textHeight), () => this._saveRecording());
	this._saveRecordingButton.bitmap.drawText(`${Strings.saveRecording} (s)`,
		0, 0, this._saveRecordingButton.width, preferences.textHeight, 'right');
	this._saveRecordingButton.anchor.x = 1;
	this._saveRecordingButton.x = Graphics.width;
	this._saveRecordingButton.y = preferences.textHeight*2;
	this._saveRecordingButton.visible = false;
	this._summaryLayer.addChild(this._saveRecordingButton);
};

Scene_Game.prototype._createTPSIndicatorSprite = function () {
	this._TPSIndicator = new Sprite(new Bitmap(256, preferences.textHeight));
	this._TPSIndicator.anchor.x = 1;
	this._TPSIndicator.x = Graphics.width;
	this._TPSIndicator.y = Graphics.height - 2*preferences.textHeight;
	this._TPSIndicator.visible = false;
	this._HUDLayer.addChild(this._TPSIndicator);
};

Scene_Game.prototype._createNumbersHUD = function () {
	this._numbersHUD = new Sprite(new Bitmap(Graphics.width, preferences.textHeight));
	this._numbersHUD.y = preferences.textHeight;
	this._numbersHUD.visible = false;
	this._HUDLayer.addChild(this._numbersHUD);
	const bitmap = this._numbersHUD.bitmap;
	const w = bitmap.width / 5;
	const h = bitmap.height;
	this._numbersHUD.refresh = () => {
		bitmap.clear();
		bitmap.textColor = preferences.perfectColor;
		bitmap.drawText(this._level.perfectNumberString(), 0, 0, w, h, 'center');
		bitmap.textColor = preferences.goodColor;
		bitmap.drawText(this._level.goodNumberString(), w, 0, w, h, 'center');
		bitmap.textColor = preferences.badColor;
		bitmap.drawText(this._level.badNumberString(), w*2, 0, w, h, 'center');
		bitmap.textColor = preferences.missColor;
		bitmap.drawText(this._level.missNumberString(), w*3, 0, w, h, 'center');
		bitmap.textColor = preferences.excessColor;
		bitmap.drawText(this._level.excessNumberString(), w*4, 0, w, h, 'center');
	};
};

Scene_Game.prototype._createFlashBitmap = function (judge) {
	this._flashBitmaps[judge] = new Bitmap(Graphics.width, Graphics.height);
	this._flashBitmaps[judge].fillAll(Level.getColorFromJudge(judge));
};

Scene_Game.prototype._flashWarn = function (judge) {
	const sprite = new Sprite(this._flashBitmaps[judge]);
	sprite.opacity = 50;
	sprite.update = () => {
		sprite.opacity -= 500 / Graphics._fpsMeter.fps;
		if (sprite.opacity <= 0)
			this._screenEffectLayer.removeChild(sprite);
	};
	this._screenEffectLayer.addChild(sprite);
};

Scene_Game.prototype._saveRecording = function () {
	const link = document.createElement("a");
	link.href = URL.createObjectURL(new Blob([JSON.stringify(this._newRecording)], {type: 'text/plain'}));
	link.download = `replay-${new Date().toISOString()}.json`;
	link.click();
};

Scene_Game.prototype._drawInaccuracyBar = function (perfect, good, bad) {
	if (this._level.modifiers.noBad) {
		this._inaccuracyBar.bitmap.fillRect(0, 0, 512, 10, preferences.goodColor);
		this._inaccuracyBar.bitmap.fillRect(256 * (1 - perfect / good), 0, 512 * perfect / good, 10, preferences.perfectColor);
	} else {
		this._inaccuracyBar.bitmap.fillRect(0, 0, 512, 10, preferences.badColor);
		this._inaccuracyBar.bitmap.fillRect(256 * (1 - good / bad), 0, 512 * good / bad, 10, preferences.goodColor);
		this._inaccuracyBar.bitmap.fillRect(256 * (1 - perfect / bad), 0, 512 * perfect / bad, 10, preferences.perfectColor);
	}
};

Scene_Game.prototype._createListeners = function () {
	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
	this._blurEventListener = this._onBlur.bind(this);
	window.addEventListener('blur', this._blurEventListener);
	this._touchStartEventListener = this._onTouchStart.bind(this);
	document.addEventListener('touchstart', this._touchStartEventListener);
	this._touchEndEventListener = this._onTouchEnd.bind(this);
	document.addEventListener('touchend', this._touchEndEventListener);
	this._keyupEventListener = this._onKeyup.bind(this);
	document.addEventListener('keyup', this._keyupEventListener);
};

Scene_Game.prototype._updateProgress = function (now) {
	if (!this._musicEnded) {
		let progress = this._level.progress(now);
		if (progress >= 1) {
			progress = 1;
			this._musicEnded = true;
			if (this.audioPlayer && this.audioPlayer.isPlaying())
				this.audioPlayer.stop();
		}
		this._progressIndicator.x = Graphics.width * progress;
	} else {
		this._progressIndicator.x = Graphics.width;
	}
};

Scene_Game.prototype._updateJudgementLine = function (now) {
	const row = this._level._row1;
	if (row === undefined)
		return;
	if (this._resumingCountdown)
		now -= this._resumingCountdown.remaining * this._level.modifiers.playRate;
	if (now < row.startTime)
		return;
	const lengthPosition = this._level._getLengthPositionFromTime(now);
	if (this._level.visuals.judgementLinePerformances) {
		row.judgementLine.applyToSprite(this._judgementLine, lengthPosition, this._row1Sprite.y, row.mirror);
		for (let i = 0; i < this._fakeJudgementLines.length; i++)
			row.fakeJudgementLines[i].applyToSprite(this._fakeJudgementLines[i], lengthPosition, this._row1Sprite.y, row.mirror);
		for (let i = 0; i < this._texts.length; i++)
			row.texts[i].applyToSprite(this._texts[i], lengthPosition, this._row1Sprite.y, row.mirror);
		this._judgementLineLayer.children.sort((a, b) => a.zIndex - b.zIndex);
	} else {
		this._judgementLine.x = this._level._getNoteXFromLengthPosition(lengthPosition);
		if (row.mirror)
			this._judgementLine.x = Graphics.width - this._judgementLine.x;
		this._judgementLine.y = this._row1Sprite.y;
		this._judgementLine.scale.y = row.voicesNumber * preferences.voicesHeight;
		this._judgementLine.anchor.x = 0.5;
		this._judgementLine.anchor.y = 0.5;
	}
	if (this._level.visuals.fadeIn) {
		this._fadeInMask.y = this._row1Sprite.y;
		this._fadeInMask.x = this._judgementLine.x;
	}
	if (this._level.visuals.fadeOut) {
		this._fadeOutMask.y = this._row1Sprite.y;
		this._fadeOutMask.x = this._judgementLine.x;
	}
};

Scene_Game.prototype._updateTPSIndicator = function (now) {
	this._TPSIndicator.bitmap.clear();
	this._TPSIndicator.bitmap.drawText(`${this._level.getCurrentTPS(now)} TPS`, 0, 0,
		this._TPSIndicator.width, preferences.textHeight, 'right');
};

Scene_Game.prototype._getXNow = function (mirror) {
	return mirror ? Graphics.width - this._judgementLine.x : this._judgementLine.x;
};

Scene_Game.prototype._switchRow = function () {
	this._beatmapLayer.removeChild(this._row1Sprite);
	this._nextBeatmapLayer.removeChild(this._row2Sprite);
	[this._row1Sprite, this._row2Sprite] = [this._row2Sprite, this._row1Sprite];
	this._level.switchRow();
	this._row2Sprite.bitmap = this._level.row2Bitmap();
	this._beatmapLayer.addChild(this._row1Sprite);
	if (this._row2Sprite.bitmap)
		this._nextBeatmapLayer.addChild(this._row2Sprite);
	if (this._level.hasRowsLeft())
		this._setUpNewRow();
};

Scene_Game.prototype._changeSceneIfShould = function () {
	if (this._shouldRestart)
		window.scene = this._level.newScene();
	if (this._shouldBack)
		window.scene = this._level._offsetWizard ? new Scene_Preferences() : new Scene_Title();
	if (this._shouldReplay)
		window.scene = this._level.newReplayScene();
	if (this._shouldError)
		window.scene = new Scene_Error(this._error);
};

Scene_Game.prototype._finishIfShould = function (now) {
	if (!this._ended && this._level.shouldFinish(now)) {
		this._musicEnded = true;
		this._finish();
	}
	if (!this._ended && this._level.failed && !this._level.modifiers.noFail) {
		if (preferences.autoRestartFail)
			this._shouldRestart = true;
		else
			this._finish();
	}
	if (!this._ended && this._level.allEventsFinished()) {
		this._finish();
		if (this.audioPlayer) {
			this.audioPlayer.addFinishListener(() => {
				this._musicEnded = true;
				this._pauseButton.visible = false;
			});
		}
	}
};

Scene_Game.prototype._updateKeyboard = function () {
	this._keyboardSprite.bitmap.clear();
	this._keyboardSprite.bitmap.drawText(Object.keys(this._pressings).join(' '), 0, 0,
		this._keyboardSprite.width, preferences.textHeight, 'left');
};

Scene_Game.prototype.update = function () {
	const now = this._now();
	this._updateProgress(now);
	if (!this._ended) {
		if (this._level.visuals.showKeyboard && !this._level.modifiers.autoPlay)
			this._updateKeyboard();
		if (!this._paused) {
			if (!this._resumingCountdown) {
				if (!this.isRecording)
					this._level.updateRecordingApply(now, this._pressings);
				if (this._level.visuals.TPSIndicator)
					this._updateTPSIndicator(now);
				if (this._hitSoundWithMusic())
					this._level.updateHitSoundWithMusic(now);
				this._level.autoPlayUpdateAndProcessMiss(now);
				this._level.updateHoldings(now);
				if (this._level.shouldSwitchRow(now))
					this._switchRow();
				this._finishIfShould(now);
			}
			this._updateJudgementLine(now);
			this._updateScoreAndCombo();
			if (this._level.visuals.numbersHUD)
				this._updateNumbersHUD();
			this._updateHpBar();
		}
	}
	this._changeSceneIfShould();
	Scene_Base.prototype.update.call(this);
};

Scene_Game.prototype._updateHpBar = function () {
	this._hpBar.x = Graphics.width * (this._level.hp - 1);
};

Scene_Game.prototype._updateNumbersHUD = function () {
	if (this._level.numbersUpdated) {
		this._numbersHUD.refresh();
		this._level.numbersUpdated = false;
	}
};

Scene_Game.prototype._updateScoreAndCombo = function () {
	if (this._level.scoreUpdated) {
		this._refreshScore();
		this._level.scoreUpdated = false;
	}
	if (this._level.comboUpdated) {
		this._refreshCombo();
		this._level.comboUpdated = false;
	}
};

Scene_Game.prototype._setUpNewRow = function () {
	this._level.setUpMirror(this._row1Sprite, this._row2Sprite);
	this._level.setUpNewRow();
	this._drawInaccuracyBar(this._level.perfectTolerance, this._level.goodTolerance, this._level.badTolerance);
	if (this._level.visuals.judgementLinePerformances) {
		this._destroyFakeJudgementLines();
		this._destroyTexts();
		this._createFakeJudgementLines();
		this._createTexts();
	}
};

Scene_Game.prototype.stop = function () {
	Scene_Base.prototype.stop.call(this);
	if (this.audioPlayer) {
		this.audioPlayer.stop();
		this.audioPlayer.clear();
	}
	document.removeEventListener('keydown', this._keydownEventListener);
	window.removeEventListener('blur', this._blurEventListener);
	document.removeEventListener('touchstart', this._touchStartEventListener);
	document.removeEventListener('keyup', this._keyupEventListener);
	document.removeEventListener('touchend', this._touchEndEventListener);
};

Scene_Game.prototype._onLoad = async function () {
	try {
		await this._level.loadBeatmap();
	} catch (e) {
		if (e instanceof TypeError || e instanceof BeatmapError) {
			this._error = e;
			this._shouldError = true;
			return;
		} else
			throw e;
	}
	this._lastPos = this._level.initialNow();
	this._makeTitle();
	this._level.loadAudio();
};

Scene_Game.prototype._makeTitle = function () {
	const titleText = this._level.title();
	const trueTitle = new Sprite(new Bitmap(this._restart.bitmap.measureTextWidth(titleText), preferences.textHeight));
	trueTitle.bitmap.drawText(titleText, 0, 0, trueTitle.width, preferences.textHeight, 'center');
	trueTitle.mask = new PIXI.Graphics();
	trueTitle.mask.beginFill(0x000000);
	trueTitle.mask.drawRect(this._title.x, this._title.y, this._title.width, this._title.height);
	this._title.addChild(trueTitle);
	if (trueTitle.width > this._title.width) {
		let speed = 0.06; // pixels per milliseconds
		let leftward = true;
		let rightward = false;
		let stayTime = 0;
		this._title.update = () => {
			if (leftward) {
				trueTitle.x -= speed * 1000 / Graphics._fpsMeter.fps;
				if (trueTitle.x + trueTitle.width <= this._title.width) {
					trueTitle.x = this._title.width - trueTitle.width;
					leftward = false;
				}
			} else if (rightward) {
				trueTitle.x += speed * 1000 / Graphics._fpsMeter.fps;
				if (trueTitle.x >= 0) {
					trueTitle.x = 0;
					rightward = false;
				}
			} else {
				stayTime++;
				if (stayTime / Graphics._fpsMeter.fps >= 1) { // stayed for over 1s
					stayTime = 0;
					if (trueTitle.x === 0)
						leftward = true;
					else
						rightward = true;
				}
			}
		};
	} else {
		trueTitle.x = (this._title.width - trueTitle.width) / 2;
	}
};

Scene_Game.prototype._makeHUDsVisible = function () {
	this._pauseButton.visible = true;
	this._loading.visible = false;
	this._inaccuracyBar.visible = true;
	this._scoreSprite.visible = true;
	this._comboSprite.visible = true;
	this._title.visible = true;
	this._progressIndicator.visible = true;
	this._modifiersListSprite.visible = true;
	if (this._level.visuals.showKeyboard)
		this._keyboardSprite.visible = true;
	if (this._level.visuals.TPSIndicator)
		this._TPSIndicator.visible = true;
	if (this._level.visuals.fadeIn)
		this._fadeInMask.visible = true;
	if (this._level.visuals.fadeOut)
		this._fadeOutMask.visible = true;
	if (this._level.visuals.numbersHUD) {
		this._numbersHUD.visible = true;
		this._numbersHUD.refresh();
	}
	this._hpBar.visible = true;
	const start = performance.now();
	this._retryCounter.update = () => {
		this._retryCounter.opacity = 255 * (1 - (performance.now() - start) / 1000);
		if (this._retryCounter.opacity <= 0)
			this._HUDLayer.removeChild(this._retryCounter);
	};
};

Scene_Game.prototype.postLoadingAudio = function () {
	this._makeHUDsVisible();
	this._row1Sprite.bitmap = this._level.row1Bitmap();
	this._row2Sprite.bitmap = this._level.row2Bitmap();
	if (this._level._row1.index % 2 === 1) {
		this._row1Sprite.y = Graphics.height - this._row1Sprite.y;
		this._row2Sprite.y = Graphics.height - this._row2Sprite.y;
	}
	this._loadingFinished = true;
	this._level.cutUnclearedEvents();
	this._setUpNewRow();
	this._resume();
};

Scene_Game.prototype._onBlur = function () {
	if (preferences.autoPause && !this._paused && !this._ended)
		this._actualPause();
	if (!this._ended && this._level.isRecording) {
		for (const key in this._pressings)
			delete this._pressings[key];
	}
};

Scene_Game.prototype._pause = function () {
	if (this._paused) {
		this._resume();
	} else if (!this._musicEnded) {
		this._actualPause();
	}
};

Scene_Game.prototype._actualPause = function () {
	this._lastPos = this._now();
	this._paused = true;
	this._setButtonsVisible(true);
	if (this.isRecording)
		this._lastPressings = {...this._pressings};
	if (this._resumingCountdown)
		this._overHUDLayer.removeChild(this._resumingCountdown);
	if (this._level.hasMusic)
		this.audioPlayer.stop();
};

Scene_Game.prototype._resume = function () {
	if (!this._loadingFinished)
		return;
	this._paused = false;
	if (!this._ended) {
		this._setButtonsVisible(false);
		this._judgementLineLayer.visible = true;
		if (preferences.countdown) {
			this._createResumingCountdown();
		} else
			this.actualResume();
		if (this.isRecording) {
			for (const key in this._lastPressings) {
				if (!this._pressings[key])
					this._level._processAndRecordLoosen(this._lastPos, key);
			}
			for (const key in this._pressings) {
				if (!this._lastPressings[key])
					this._level._processAndRecordHit(this._lastPos, key);
			}
			this._lastPressings = null;
		}
	} else {
		this.actualResume();
	}
};

Scene_Game.prototype._createResumingCountdown = function () {
	this._resumingCountdown = new Scene_Game.Sprite_ResumingCountdown(this, ...this._level.getInstantaneousMillisecondsPerWholeAndBeatOffset(this._lastPos));
	this._overHUDLayer.addChild(this._resumingCountdown);
};

Scene_Game.prototype.actualResume = function () {
	this._overHUDLayer.removeChild(this._resumingCountdown);
	this._resumingCountdown = null;
	if (this._level.hasMusic) {
		if (!this.audioPlayer.isPlaying()) {
			this.audioPlayer.pitch = this._level.modifiers.playRate;
			this.audioPlayer.play(false,
				Math.max(this._lastPos - preferences.offset * this._level.modifiers.playRate, 0) / 1000);
		}
	} else {
		this._starting = performance.now() - this._lastPos/this._level.modifiers.playRate;
	}
};

Scene_Game.prototype._onKeydown = function (event) {
	if (!this._loadingFinished)
		return;
	const key = event.key === ' ' ? 'Spacebar' : event.key;
	if (key === 'Escape' || key === 'F8' && preferences.F8Pause) {
		this._pause();
	} else if (!event.ctrlKey && !event.altKey && !event.metaKey && TyphmConstants.HITTABLE_KEYS.includes(key)) {
		if (this._pressings[key])
			return;
		if (this.isRecording)
			this._pressings[key] = true;
		if (preferences.backtickRestart && key === '`') {
			this._shouldRestart = true;
		} else if (this._restart.visible) {
			if (key === 'r') {
				this._shouldRestart = true;
			} else if (key === 'b') {
				this._shouldBack = true;
			} else if (this._viewRecordingButton.visible) {
				if (key === 'w') {
					this._shouldReplay = true;
				} else if (key === 's') {
					this._saveRecording();
				}
			}
		} else if (!this._level.modifiers.autoPlay && this.isRecording && !this._ended)
			this._level._processAndRecordHit(this._now(), key);
	}
};

Scene_Game.prototype._onKeyup = function (event) {
	if (!this._loadingFinished)
		return;
	const key = event.key === ' ' ? 'Spacebar' : event.key;
	if (this.isRecording)
		delete this._pressings[key];
	if (!this._paused && !this._level.modifiers.autoPlay && this.isRecording && !this._ended)
		this._level._processAndRecordLoosen(this._now(), key);
};

Scene_Game.prototype._onTouchEnd = function (event) {
	if (!this._loadingFinished)
		return;
	const changedTouches = event.changedTouches;
	for (let i = 0; i < changedTouches.length; i++) {
		delete this._pressings[changedTouches.item(i).identifier];
	}
	if (!this._paused && !this._level.modifiers.autoPlay && this.isRecording) {
		const now = this._now();
		for (let i = 0; i < changedTouches.length; i++)
			this._level._processAndRecordLoosen(now, changedTouches.item(i).identifier);
	}
};

Scene_Game.prototype._onTouchStart = function (event) {
	if (!this._loadingFinished)
		return;
	const changedTouches = event.changedTouches;
	for (let i = 0; i < changedTouches.length; i++) {
		this._pressings[changedTouches.item(i).identifier] = true;
	}
	if (!this._paused && !this._level.modifiers.autoPlay && this.isRecording) {
		const identifiers = [];
		for (let i = 0; i < changedTouches.length; i++) {
			const touch = changedTouches.item(i);
			if (!this._pauseButton.isInside(Graphics.pageToCanvasX(touch.pageX), Graphics.pageToCanvasY(touch.pageY))) {
				this._pressings[touch.identifier] = true;
				identifiers.push(touch.identifier); // not supported by Safari...
			} else {
				return;
			}
		}
		const now = this._now();
		for (let i = 0; i < identifiers.length; i++)
			this._level._processAndRecordHit(now, identifiers[i]);
	}
};

Scene_Game.prototype._hitSoundEnabled = function () {
	return !!(preferences.enableHitSound && !this._offsetWizard);
};

Scene_Game.prototype._hitSoundWithMusic = function () {
	return this._hitSoundEnabled() && (this._level.modifiers.autoPlay || preferences.hitSoundWithMusic);
};

Scene_Game.prototype._onDestinedGood = function () {
	this._level.incrementHp(Level.GOOD);
	if (this._level.visuals.flashWarningGood)
		this._flashWarn(Scene_Game.GOOD)
	if (this.isRecording && preferences.autoRestartGood)
		this._shouldRestart = true;
};

Scene_Game.prototype._onDestinedBad = function () {
	this._level.incrementHp(Level.BAD);
	if (this._level.visuals.flashWarningMiss)
		this._flashWarn(Level.BAD)
	if (this.isRecording && (preferences.autoRestartGood || preferences.autoRestartMiss))
		this._shouldRestart = true;
};

Scene_Game.prototype._onDestinedExcess = function () {
	this._level.incrementHp(Level.EXCESS);
	if (this.isRecording && (preferences.autoRestartGood || preferences.autoRestartMiss))
		this._shouldRestart = true;
	if (this._level.visuals.flashWarningMiss)
		this._flashWarn(Level.EXCESS)
};

Scene_Game.prototype._onDestinedMiss = function () {
	this._level.incrementHp(Level.MISS);
	if (this.isRecording && (preferences.autoRestartGood || preferences.autoRestartMiss))
		this._shouldRestart = true;
	if (this._level.visuals.flashWarningMiss)
		this._flashWarn(Level.MISS);
};

Scene_Game.prototype._refreshScore = function () {
	this._scoreSprite.bitmap.clear();
	this._scoreSprite.bitmap.textColor = this._level.getScoreColor();
	this._scoreSprite.bitmap.drawText(this._level.score, 0, 0, this._scoreSprite.width, preferences.textHeight, 'right');
	if (!this._level.shouldDrawAccuracyRate())
		return;
	this._accuracyRateSprite.bitmap.clear();
	this._accuracyRateSprite.bitmap.textColor = this._level.getScoreColor();
	this._accuracyRateSprite.bitmap.drawText(sprintf('%.2f%% %s', this._level.accuracyRate*100, this._level.getMark()),
		0, 0, this._accuracyRateSprite.width, preferences.textHeight, 'right');
};

Scene_Game.prototype._refreshCombo = function () {
	this._comboSprite.bitmap.clear();
	this._comboSprite.bitmap.textColor = this._level.getScoreColor();
	this._comboSprite.bitmap.drawText(this._level.combo, 0, 0, this._comboSprite.width, preferences.textHeight, 'left');
	if (this._level.shouldPopUpCombo()) {
		const comboIndicator = new Sprite(new Bitmap(512, 128));
		comboIndicator.bitmap.fontSize = 108;
		comboIndicator.bitmap.textColor = preferences.textColor + '80';
		comboIndicator.bitmap.drawText(this._level.combo, 0, 0, 512, 128, 'center');
		comboIndicator.anchor.y = 0.5;
		this._center(comboIndicator, Graphics.height / 2);
		this._overHUDLayer.addChild(comboIndicator);
		comboIndicator.update = () => {
			comboIndicator.opacity *= 0.95**(60/Graphics._fpsMeter.fps);
			if (comboIndicator.opacity <= 5)
				this._overHUDLayer.removeChild(comboIndicator);
		};
	}
};

Scene_Game.prototype._now = function () {
	if (this._level.hasMusic) {
		if (this._resumingCountdown)
			return this._lastPos;
		else if (this._paused)
			return this._lastPos + preferences.offset;
		else
			return this.audioPlayer.seek()*1000 + preferences.offset*this._level.modifiers.playRate;
	} else {
		if (this._resumingCountdown || this._paused)
			return this._lastPos;
		else
			return (performance.now() - this._starting) * this._level.modifiers.playRate;
	}
};

Scene_Game.prototype._createInaccuracyIndicator = function (inaccuracy) {
	const inaccuracyIndicator = new Sprite(this._inaccuracyBitmap);
	inaccuracyIndicator.anchor.x = 0.5;
	inaccuracyIndicator.anchor.y = 0.5;
	inaccuracyIndicator.x = this._inaccuracyBar.x + 
			this._inaccuracyBar.width/2 * inaccuracy/(this._level.missBoundary() * this._level.modifiers.judgementWindow);
	inaccuracyIndicator.y = this._inaccuracyBar.y;
	this._overHUDLayer.addChild(inaccuracyIndicator);
	inaccuracyIndicator.update = () => {
		inaccuracyIndicator.opacity -= 0.5*60/Graphics._fpsMeter.fps;
		if (inaccuracyIndicator.opacity <= 0)
			this._overHUDLayer.removeChild(inaccuracyIndicator);
	};
	if (this._level.visuals.showInaccuracyData) {
		this._inaccuracyDataSprite.bitmap.clear();
		this._inaccuracyDataSprite.bitmap.textColor = Level.getColorFromJudge(this._level.getJudgeFromInaccuracy(inaccuracy));
		this._inaccuracyDataSprite.bitmap.drawText(sprintf('%+.0fms', inaccuracy/this._level.modifiers.playRate), 0, 0,
			this._inaccuracyDataSprite.width, preferences.textHeight, 'center');
	}
};

Scene_Game.prototype._createHitEffect = function (event, judge) {
	const r = preferences.hitEffectRadius;
	const hitEffect = new Sprite(new Bitmap(2*r, 2*r));
	const color = Level.getColorFromJudge(judge);
	hitEffect.bitmap.drawCircle(r, r, preferences.headsRadius, color);
	hitEffect.anchor.x = 0.5;
	hitEffect.anchor.y = 0.5;
	hitEffect.x = this._level.getHitEffectX(event);
	const rowSprite = this._level.isInRow1Position(event) ? this._row1Sprite : this._row2Sprite;
	hitEffect.y = rowSprite.y - Row.ROWS_HEIGHT / 2 + event.y;
	this._hitEffectLayer.addChild(hitEffect);
	let n = 1;
	hitEffect.update = () => {
		hitEffect.opacity = 255*0.9**(n*60/Graphics._fpsMeter.fps);
		hitEffect.bitmap.drawCircle(r, r, r-(r - preferences.headsRadius)/n, color);
		n++;
		if (hitEffect.opacity <= 5)
			this._hitEffectLayer.removeChild(hitEffect);
	};
};

Scene_Game.prototype._createWrongNote = function (time) {
	const wrongNote = new Sprite(new Bitmap(32, 32));
	wrongNote.bitmap.drawCircle(16, 16, preferences.headsRadius, preferences.excessColor);
	wrongNote.anchor.x = 0.5;
	wrongNote.anchor.y = 0.5;
	wrongNote.x = this._level._getNoteXFromTime(time);
	wrongNote.y = this._row1Sprite.y;
	this._beatmapLayer.addChild(wrongNote);
	wrongNote.update = () => {
		wrongNote.opacity *= 0.98**(60/Graphics._fpsMeter.fps);
		if (wrongNote.opacity <= 5)
			this._beatmapLayer.removeChild(wrongNote);
	};
};

Scene_Game.prototype._setButtonsVisible = function (visibility) {
	this._back.visible = visibility;
	this._restart.visible = visibility;
};

Scene_Game.prototype._finish = function () {
	if (this._ended)
		return;
	this._ended = true;
	this._destroyFakeJudgementLines();
	this._destroyTexts();
	this._drawSummary();
	if (this._level.isFC())
		this._fullCombo.visible = true;
	this._judgementLineLayer.visible = false;
	this._row1Sprite.visible = false;
	this._row2Sprite.visible = false;
	if (this._level.visuals.showKeyboard)
		this._keyboardSprite.visible = false;
	if (this._level.visuals.TPSIndicator)
		this._TPSIndicator.visible = false;
	if (this._level.visuals.showInaccuracyData)
		this._inaccuracyDataSprite.visible = false;
	if (this._level.visuals.numbersHUD)
		this._numbersHUD.visible = false;
	if (this._level.shouldAdjustOffset())
		this._level.adjustOffset();
	if (this._level.shouldDisplayInaccuraciesDistribution())
		this._inaccuraciesDistribution.visible = true;
	this._setButtonsVisible(true);
	this._viewRecordingButton.visible = true;
	this._saveRecordingButton.visible = true;
};

Scene_Game.prototype._drawInaccuraciesDistribution = function () {
	if (this._level.inaccuraciesArray.length < 2)
		return;
	const mu = math.mean(this._level.inaccuraciesArray);
	const sigma2 = math.variance(this._level.inaccuraciesArray);
	const sigma = Math.sqrt(sigma2);
	const twoS2 = 2*TyphmConstants.INACCURACIES_DISTRIBUTION_BLUR / this._level.inaccuraciesArray.length;
	const n = TyphmConstants.INACCURACIES_DISTRIBUTION_PIECES;
	const points = new Array(n).fill(0);
	for (let i = 0; i < n; i++) {
		const x = (i/(n-1) - 0.5)*6;
		for (let j = 0; j < this._level.inaccuraciesArray.length; j++) {
			const z = (this._level.inaccuraciesArray[j] - mu) / sigma
			points[i] += 1 / (1 + (z-x)**2 / twoS2);
		}
	}
	const peak = points.reduce((oldMax, y) => Math.max(oldMax, y), 0);
	const context = this._inaccuraciesDistribution.bitmap._context;
	const width = this._inaccuraciesDistribution.width;
	const height = this._inaccuraciesDistribution.height - preferences.textHeight;
	context.save();
	context.lineWidth = 2;
	context.strokeStyle = preferences.textColor;
	context.fillStyle = preferences.textColor + '80';
	context.beginPath();
	for (let i = 0; i < n; i++)
		context[i === 0 ? 'moveTo' : 'lineTo'](width*i/(n-1), height*(1-points[i]/peak));
	context.stroke();
	context.lineTo(width, height);
	context.lineTo(0, height);
	context.fill();
	context.restore();
	this._inaccuraciesDistribution.bitmap.drawText(sprintf('μ=%+.0fms', mu), width-256, 0, 256, preferences.textHeight, 'right');
	this._inaccuraciesDistribution.bitmap.drawText(sprintf('σ=%.0fms', sigma), width-256, preferences.textHeight, 256, preferences.textHeight, 'right');
};

Scene_Game.prototype._drawSummary = function () {
	this._markSprite.bitmap.fontSize = 108;
	this._markSprite.bitmap.textColor = this._level.getScoreColor();
	this._markSprite.bitmap.drawText(this._level.getMark(),
		0, 0, this._markSprite.width, this._markSprite.height, 'center');
	this._summarySprite.bitmap.textColor = preferences.perfectColor;
	this._summarySprite.bitmap.drawText(`${Strings.perfect}: ${this._level.perfectNumberString()}`,
		0, 0, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.goodColor;
	this._summarySprite.bitmap.drawText(`${Strings.good}: ${this._level.goodNumberString()}`,
		0, preferences.textHeight, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.badColor;
	this._summarySprite.bitmap.drawText(`${Strings.bad}: ${this._level.badNumberString()}`,
		0, preferences.textHeight*2, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.missColor;
	this._summarySprite.bitmap.drawText(`${Strings.miss}: ${this._level.missNumberString()}`,
		0, preferences.textHeight*3, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.excessColor;
	this._summarySprite.bitmap.drawText(`${Strings.excess}: ${this._level.excessNumberString()}`,
		0, preferences.textHeight*4, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.textColor;
	this._summarySprite.bitmap.drawText(`${Strings.maxCombo}: ${this._level.maxCombo}`,
		0, preferences.textHeight*5, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._drawInaccuraciesDistribution();
};

Scene_Game.Sprite_ResumingCountdown = function () {
	this.initialize.apply(this, arguments);
};

Scene_Game.Sprite_ResumingCountdown.MAX_COUNT = 3;

Scene_Game.Sprite_ResumingCountdown.prototype = Object.create(Sprite.prototype);
Scene_Game.Sprite_ResumingCountdown.prototype.constructor = Scene_Game.Sprite_ResumingCountdown;

Scene_Game.Sprite_ResumingCountdown.prototype.initialize = function (scene, millisecondsPerWhole, beatsOffset) {
	Sprite.prototype.initialize.call(this, new Bitmap(preferences.fontSize*8, preferences.textHeight*8));
	this.anchor.x = 0.5;
	this.anchor.y = 0.5;
	this.x = Graphics.width / 2;
	this.y = Graphics.height / 2;
	this.bitmap.fontSize = preferences.fontSize*8;
	this._scene = scene;
	this._start = performance.now();
	const actualResumingTimeout = this.remaining = Scene_Game.Sprite_ResumingCountdown.MAX_COUNT*1000;
	for (let i = 0; i <= Scene_Game.Sprite_ResumingCountdown.MAX_COUNT; i++) {
		setTimeout(() => this._countTo(i), actualResumingTimeout - i*1000);
	}
	if (millisecondsPerWhole) {
		const millisecondsPerQuarter = millisecondsPerWhole / 4 / this._scene._level.modifiers.playRate;
		for (let time = actualResumingTimeout + preferences.offset - beatsOffset/this._scene._level.modifiers.playRate; time >= 0; time -= millisecondsPerQuarter) {
			if (time < actualResumingTimeout)
				setTimeout(this._playHitSound.bind(this), time);
		}
	}
	if (this._scene._hitSoundWithMusic()) {
		const unclearedHitSounds = this._scene._level._unclearedHitSounds;
		const offsetNow = this._scene._lastPos - preferences.offset * this._scene._level.modifiers.playRate;
		while (unclearedHitSounds.length > 0) {
			const event = unclearedHitSounds[0];
			if (offsetNow >= event.time - TyphmConstants.HIT_SOUND_ADVANCE*this._scene._level.modifiers.playRate) {
				const timeout = (event.time - offsetNow)/this._scene._level.modifiers.playRate + actualResumingTimeout;
				if (timeout >= actualResumingTimeout + preferences.offset * this._scene._level.modifiers.playRate)
					setTimeout(this._playHitSound.bind(this), timeout);
				unclearedHitSounds.shift();
			} else
				break;
		}
	}
	if (this._scene._level.hasMusic) {
		const audioPlayer = this._scene.audioPlayer;
		setTimeout(() => {
			if (this.parent && window.scene === this.parent.parent && !audioPlayer.isPlaying()) {
				audioPlayer.pitch = this._scene._level.modifiers.playRate;
				audioPlayer.play(false, Math.max(this._scene._lastPos, 0) / 1000);
			}
		}, actualResumingTimeout + preferences.offset)
	}
};

Scene_Game.Sprite_ResumingCountdown.prototype._playHitSound = function () {
	if (this.parent && window.scene === this.parent.parent)
		this._scene._level._playHitSound();
};

Scene_Game.Sprite_ResumingCountdown.prototype._countTo = function (n) {
	if (!this.parent || scene !== this.parent.parent)
		return;
	if (n === 0) {
		this._scene.actualResume();
	} else {
		this.bitmap.clear();
		this.bitmap.drawText(n, 0, 0, this.width, this.height, 'center');
		this.scale.x = 1;
		this.scale.y = 1;
	}
};

Scene_Game.Sprite_ResumingCountdown.prototype.update = function () {
	Sprite.prototype.update.call(this);
	const timeElapsed = performance.now() - this._start;
	this.remaining = Scene_Game.Sprite_ResumingCountdown.MAX_COUNT*1000 - timeElapsed;
	const scale = 1 - timeElapsed % 1000 / 1000
	this.scale.x = scale;
	this.scale.y = scale;
};
