function Scene_Game() {
	this.initialize.apply(this, arguments);
}

Scene_Game.prototype = Object.create(Scene_Base.prototype);
Scene_Game.prototype.constructor = Scene_Game;

Scene_Game.MODIFIERS = [
	'playRate',
	'autoPlay',
	'noBad',
	'noExcess',
	'judgeWindow',
	'autoCompleteHolds'
];
Scene_Game.VISUALS = [
	'FCAPIndicator',
	'TPSIndicator',
	'judgeLinePerformances',
	'flashWarningGood',
	'flashWarningMiss',
	'showInaccuracyData',
	'comboPopupInterval',
	'fadeIn',
	'fadeOut',
	'reverseVoices',
	'mirror',
	'showKeyboard',
	'subtractScore'
];
Scene_Game.PERFECT = 3;
Scene_Game.GOOD = 2;
Scene_Game.BAD = 1;
Scene_Game.MISS = 0;
Scene_Game.EXCEESS = -1;

Scene_Game.prototype.initialize = function (musicUrl, beatmapUrl, recording) {
	Scene_Base.prototype.initialize.call(this);
	this._musicUrl = musicUrl;
	this._beatmapUrl = beatmapUrl;
	this._recording = recording;
};

Scene_Game.prototype.start = function () {
	Scene_Base.prototype.start.call(this);
	
	this._createLoadingSprite();
	this._setUpRecording();
	this._paused = true;
	this._lastPos = 0.0;
	this._starting = performance.now();
	this._createLayers();
	this._createTwoLines();
	if (this._visuals.fadeIn)
		this._createFadeInMask();
	if (this._visuals.fadeOut)
		this._createFadeOutMask();
	this._createJudgeLineSprite();
	this._createPauseButton();
	this._createBackButton();
	this._createRestartButton();
	this._createTitleSprite();
	this._setButtonsVisible(false);
	this._createScoreSprite();
	this._createComboSprite();
	if (this._visuals.showKeyboard)
		this._createKeyboardSprite();
	this._createMarkSprite();
	this._createSummarySprite();
	this._createFullComboSprite();
	this._createInaccuraciesDistributionSprite();
	if (this._visuals.showInaccuracyData)
		this._createInaccuracyDataSprite();
	this._createInaccuracyBarSprite();
	this._createProgressIndicatorSprite();
	this._createAccuracyRateSprite();
	this._createViewRecordingButton();
	this._createSaveRecordingButton();
	this._createModifiersListSprite();
	this._createFlashBitmapsIfNeeded();
	if (this._visuals.TPSIndicator)
		this._createTPSIndicatorSprite();
	
	this._beatmap = new Beatmap(this._beatmapUrl);
	this._hasMusic = !!this._musicUrl;
	this._ended = false;
	this._initializeJudgeCounters();
	this._combo = 0;
	this._maxCombo = 0;
	this._holdings = [];
	this._pressings = {};
	this._hitsLastSecond = [];
	this._line1Index = 0;
	this._line2Index = 1;
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
	if (this._visuals.flashWarningGood)
		this._createFlashBitmap(Scene_Game.GOOD);
	if (this._visuals.flashWarningMiss) {
		this._createFlashBitmap(Scene_Game.BAD);
		this._createFlashBitmap(Scene_Game.MISS);
		this._createFlashBitmap(Scene_Game.EXCEESS);
	}
};

Scene_Game.prototype._initializeJudgeCounters = function () {
	this._perfectNumber = 0;
	this._goodNumber = 0;
	this._badNumber = 0;
	this._missNumber = 0;
	this._excessNumber = 0;
	
	this._perfectMeasures = 0;
	this._goodMeasures = 0;
	this._badMeasures = 0;
	this._missMeasures = 0;
	
	this._perfectBig = 0;
	this._goodBig = 0;
	this._badBig = 0;
	this._missBig = 0;
};

Scene_Game.prototype._setUpRecording = function () {
	if (this._recording) {
		this._isRecording = false;
		this._newRecording = {
			modifiers: {...this._recording.modifiers},
			hit: [...this._recording.hit],
			loosen: [...this._recording.loosen]
		};
		if (this._recording.visuals)
			this._newRecording.visuals = {...this._recording.visuals};
		this._modifiers = this._newRecording.modifiers;
		if (preferences.recordVisual && this._recording.visuals) {
			this._visuals = this._newRecording.visuals;
		} else {
			this._visuals = {};
			for (const visual of Scene_Game.VISUALS)
				this._visuals[visual] = preferences[visual];
		}
	} else {
		this._isRecording = true
		this._modifiers = {};
		for (const modifier of Scene_Game.MODIFIERS)
			this._modifiers[modifier] = preferences[modifier];
		this._visuals = {};
		for (const visual of Scene_Game.VISUALS)
			this._visuals[visual] = preferences[visual];
		this._newRecording = {modifiers: this._modifiers, hit: [], loosen: []};
		if (preferences.recordVisual)
			this._newRecording.visuals = this._visuals;
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
	this.addChild(this._judgeLineLayer = new Sprite());
	this.addChild(this._hitEffectLayer = new Sprite());
	this.addChild(this._HUDLayer = new Sprite());
	this.addChild(this._overHUDLayer = new Sprite());
	this.addChild(this._summaryLayer = new Sprite());
	this.addChild(this._screenEffectLayer = new Sprite());
};

Scene_Game.prototype._createFadeInMask = function () {
	const distance = this._visuals.fadeIn * Graphics.width
	const sprite = this._fadeInMask = new Sprite(new Bitmap(Graphics.width*3, Graphics.height*3));
	sprite.anchor.x = 0.5;
	sprite.anchor.y = 0.5;
	sprite.bitmap.fillAll(preferences.backgroundColor);
	sprite.bitmap.clearRect(sprite.width/2 - distance, 0, distance * 2, sprite.height);
	sprite.visible = false;
	this._beatmapMaskLayer.addChild(sprite);
};

Scene_Game.prototype._createFadeOutMask = function () {
	const distance = this._visuals.fadeOut * Graphics.width
	const sprite = this._fadeOutMask = new Sprite(new Bitmap(Graphics.width*3, Graphics.height*3));
	sprite.anchor.x = 0.5;
	sprite.anchor.y = 0.5;
	sprite.bitmap.fillRect(sprite.width/2 - distance, 0, distance * 2, sprite.height, preferences.backgroundColor);
	sprite.visible = false;
	this._beatmapMaskLayer.addChild(sprite);
};

Scene_Game.prototype._createTwoLines = function () {
	this._line1 = new Sprite();
	this._line1.width = Graphics.width;
	this._line1.anchor.y = 0.5;
	this._center(this._line1, (Graphics.height - preferences.distanceBetweenLines)/2);
	this._beatmapLayer.addChild(this._line1);
	this._line2 = new Sprite();
	this._line2.width = Graphics.width;
	this._line2.anchor.y = 0.5;
	this._center(this._line2, (Graphics.height + preferences.distanceBetweenLines)/2);
	this._nextBeatmapLayer.addChild(this._line2);
	if (this._visuals.mirror) {
		this._line1.scale.x = -1;
		this._line2.scale.x = -1;
	}
};

Scene_Game.prototype._createJudgeLineSprite = function () {
	this._judgeLine = new Sprite(new Bitmap(1, 1));
	this._judgeLine.bitmap.fillAll('white');
	this._judgeLine.anchor.x = 0.5;
	this._judgeLine.anchor.y = 0.5;
	this._judgeLine.visible = false;
	this._judgeLineLayer.addChild(this._judgeLine);
	this._fakeJudgeLines = [];
};

Scene_Game.prototype._destroyFakeJudgeLines = function () {
	for (let i = 0; i < this._fakeJudgeLines.length; i++) {
		this._judgeLineLayer.removeChild(this._fakeJudgeLines[i]);
	}
};

Scene_Game.prototype._createFakeJudgeLines = function () {
	const line = this._line1.bitmap;
	if (line.fakeJudgeLines) {
		for (let i = 0; i < line.fakeJudgeLines.length; i++) {
			const sprite = new Sprite(new Bitmap(1, 1));
			sprite.bitmap.fillAll('white');
			sprite.anchor.x = 0.5;
			sprite.anchor.y = 0.5;
			this._judgeLineLayer.addChild(sprite);
			this._fakeJudgeLines.push(sprite);
		}
	}
}

Scene_Game.prototype._createPauseButton = function () {
	this._pauseButton = new Button(new Bitmap(30, 32), () => { this._pause(); });
	this._pauseButton.y = (preferences.textHeight - 32) / 2;
	this._pauseButton.zIndex = 10;
	this._pauseButton.bitmap.fillRect(6, 4, 6, 24, 'white');
	this._pauseButton.bitmap.fillRect(18, 4, 6, 24, 'white');
	this._pauseButton.visible = false;
	this._HUDLayer.addChild(this._pauseButton);
}

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
	this._HUDLayer.addChild(this._progressIndicator);
};

Scene_Game.prototype._createViewRecordingButton = function () {
	this._viewRecordingButton = new Button(new Bitmap(512, preferences.textHeight), () => this._shouldReplay = true );
	this._viewRecordingButton.bitmap.drawText(Strings.viewRecording,
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
	const modifiersTexts = [];
	for (const modifier in this._modifiers) {
		if (this._modifiers[modifier] !== Scene_Preferences.DEFAULT_PREFERENCES[modifier])
			modifiersTexts.push(sprintf(Strings['inGame_' + modifier], this._modifiers[modifier]));
	}
	this._modifiersListSprite.bitmap.drawText(modifiersTexts.join(', '), 0, 0,
		this._modifiersListSprite.width, preferences.textHeight, 'left');
	this._modifiersListSprite.visible = false;
	this._summaryLayer.addChild(this._modifiersListSprite);
};

Scene_Game.prototype._createSaveRecordingButton = function () {
	this._saveRecordingButton = new Button(new Bitmap(512, preferences.textHeight), () => this._saveRecording());
	this._saveRecordingButton.bitmap.drawText(Strings.saveRecording,
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
	this._TPSIndicator.y = preferences.textHeight;
	this._TPSIndicator.visible = false;
	this._HUDLayer.addChild(this._TPSIndicator);
};

Scene_Game.prototype._createFlashBitmap = function (judge) {
	this._flashBitmaps[judge] = new Bitmap(Graphics.width, Graphics.height);
	this._flashBitmaps[judge].fillAll(Scene_Game.getColorFromJudge(judge));
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
	if (this._modifiers.noBad) {
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
		let progress = (now - this._beatmap.start) / this._length;
		if (progress >= 1) {
			progress = 1;
			this._musicEnded = true;
			if (this._audioPlayer && this._audioPlayer.isPlaying())
				this._audioPlayer.stop();
		}
		this._progressIndicator.x = Graphics.width * progress;
	} else {
		this._progressIndicator.x = Graphics.width;
	}
};

Scene_Game.prototype._updateJudgeLine = function (now) {
	const lengthPosition = this._getLengthPositionFromTime(now);
	const line = this._line1.bitmap;
	this._judgeLine.x = this._getXFromLengthPosition(lengthPosition);
	if (this._visuals.mirror)
		this._judgeLine.x = Graphics.width - this._judgeLine.x;
	if (this._visuals.judgeLinePerformances) {
		this._judgeLine.y = this._line1.y - line.space_yFormula(lengthPosition);
		this._judgeLine.scale.x = line.widthFormula(lengthPosition);
		this._judgeLine.scale.y = line.heightFormula(lengthPosition);
		this._judgeLine.bitmap.clear();
		this._judgeLine.bitmap.fillAll(TyphmUtils.fromRGBAToHex(
			line.redFormula(lengthPosition), line.greenFormula(lengthPosition),
			line.blueFormula(lengthPosition), line.alphaFormula(lengthPosition)));
		for (let i = 0; i < this._fakeJudgeLines.length; i++) {
			const judgeLine = this._fakeJudgeLines[i];
			const set = line.fakeJudgeLines[i];
			judgeLine.x = preferences.margin + set.space_xFormula(lengthPosition) * (Graphics.width - 2*preferences.margin);
			if (this._visuals.mirror)
				judgeLine.x = Graphics.width - judgeLine.x;
			judgeLine.y = this._line1.y - set.space_yFormula(lengthPosition);
			judgeLine.scale.x = set.widthFormula(lengthPosition);
			judgeLine.scale.y = set.heightFormula(lengthPosition);
			judgeLine.bitmap.clear();
			judgeLine.bitmap.fillAll(TyphmUtils.fromRGBAToHex(
				set.redFormula(lengthPosition), set.greenFormula(lengthPosition),
				set.blueFormula(lengthPosition), set.alphaFormula(lengthPosition)));
		}
	} else {
		this._judgeLine.y = this._line1.y;
		this._judgeLine.scale.y = line.voicesNumber * preferences.voicesHeight;
	}
	if (this._visuals.fadeIn) {
		this._fadeInMask.y = this._line1.y;
		this._fadeInMask.x = this._judgeLine.x;
	}
	if (this._visuals.fadeOut) {
		this._fadeOutMask.y = this._line1.y;
		this._fadeOutMask.x = this._judgeLine.x;
	}
};

Scene_Game.prototype._updateTPSIndicator = function (now) {
	while ((now - this._hitsLastSecond[0]) / this._modifiers.playRate > 1000)
		this._hitsLastSecond.shift();
	this._TPSIndicator.bitmap.clear();
	this._TPSIndicator.bitmap.drawText(`${this._hitsLastSecond.length} TPS`, 0, 0,
		this._TPSIndicator.width, preferences.textHeight, 'right');
};

Scene_Game.prototype._updateHitSoundWithMusic = function (now) {
	while (this._unclearedHitSounds.length > 0) {
		const event = this._unclearedHitSounds[0];
		const offsetNow = now - preferences.offset * this._modifiers.playRate;
		if (offsetNow >= event.time - TyphmConstants.HIT_SOUND_ADVANCE*this._modifiers.playRate) {
			if (offsetNow <= event.time + this._perfectTolerance) {
				setTimeout(() => this._playHitSound(), (event.time - offsetNow)/this._modifiers.playRate);
			}
			this._unclearedHitSounds.splice(0, 1);
		} else
			break;
	}
};

Scene_Game.prototype._missBoundary = function () {
	return this._modifiers.noBad ? this._goodTolerance : this._badTolerance;
};

Scene_Game.prototype._autoPlayUpdateAndProcessMiss = function (now) {
	while (this._unclearedEvents.length > 0) {
		const event = this._unclearedEvents[0];
		if (now >= event.time) {
			if (this._modifiers.autoPlay && now <= event.time + this._perfectTolerance * this._modifiers.judgeWindow) {
				this._perfectHit();
				if (this._visuals.TPSIndicator)
					this._hitsLastSecond.push(now);
			} else if (now >= event.time + this._missBoundary() * this._modifiers.judgeWindow) {
				this._missHit();
			} else
				break;
		} else
			break;
	}
};

Scene_Game.prototype._missHit = function () {
	const event = this._unclearedEvents.shift();
	this._refreshMeasureStateAfterHitting(event, Scene_Game.MISS);
	this._onDestinedMiss();
	this._missClear(event);
};

Scene_Game.prototype._missClear = function (event) {
	this._beatmap.clearNote(event, Scene_Game.MISS);
	this._missNumber++;
	if (event.big)
		this._missBig++;
	this._combo = 0;
	this._updateCombo();
	this._updateScore();
};

Scene_Game.getColorFromJudge = function (judge) {
	if (judge === Scene_Game.PERFECT)
		return preferences.perfectColor;
	else if (judge === Scene_Game.GOOD)
		return preferences.goodColor;
	else if (judge === Scene_Game.BAD)
		return preferences.badColor;
	else if (judge === Scene_Game.MISS)
		return preferences.missColor;
	else if (judge === Scene_Game.EXCEESS)
		return preferences.excessColor;
};

Scene_Game.prototype._updateHoldings = function (now) {
	while (this._holdings.length > 0) {
		const {event, judge} = this._holdings[0];
		if (now >= event.timeEnd) {
			if (judge === Scene_Game.PERFECT) {
				this._perfectClear(event);
			} else if (judge === Scene_Game.GOOD) {
				this._goodClear(event);
			}
			this._holdings.shift();
		} else {
			break;
		}
	}
	for (let i = 0; i < this._holdings.length; i++) {
		const {event, judge} = this._holdings[i];
		const xNow = this._visuals.mirror ? Graphics.width - this._judgeLine.x : this._judgeLine.x;
		this._beatmap.trackHoldTo(now, xNow, event, judge, this._line1Index);
	}
};

Scene_Game.prototype._switchLine = function () {
	this._beatmapLayer.removeChild(this._line1);
	this._nextBeatmapLayer.removeChild(this._line2);
	let t = this._line1;
	this._line1 = this._line2;
	this._line2 = t;
	t = this._line1Index;
	this._line1Index = this._line2Index;
	this._line2Index = t;
	this._line2Index += 2;
	this._line2.bitmap = this._beatmap.lines[this._line2Index];
	this._beatmapLayer.addChild(this._line1);
	this._nextBeatmapLayer.addChild(this._line2);
	this._setUpNewLine();
};

Scene_Game.prototype._changeSceneIfShould = function () {
	if (this._shouldRestart)
		window.scene = new Scene_Game(this._musicUrl, this._beatmapUrl, this._isRecording ? undefined : this._newRecording);
	if (this._shouldBack)
		window.scene = this._offsetWizard ? new Scene_Preferences() : new Scene_Title();
	if (this._shouldReplay)
		window.scene = new Scene_Game(this._musicUrl, this._beatmapUrl, this._newRecording);
	if (this._shouldError)
		window.scene = new Scene_Error(this._error);
};

Scene_Game.prototype._finishIfShould = function (now) {
	if (!this._ended && now >= this._beatmap.start + this._length) {
		this._musicEnded = true;
		this._finish();
	}
	if (!this._ended && this._unclearedEvents.length === 0 && this._holdings.length === 0) {
		this._finish();
		if (this._audioPlayer) {
			this._audioPlayer.addFinishListener(() => {
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
	if (!this._paused && !this._ended) {
		if (this._visuals.showKeyboard)
			this._updateKeyboard();
		if (!this._resumingCountdown) {
			if (!this._isRecording)
				this._updateRecordingApply(now);
			this._updateJudgeLine(now);
			if (this._visuals.TPSIndicator)
				this._updateTPSIndicator(now);
			if (this._hitSoundEnabled() && (this._modifiers.autoPlay || preferences.hitSoundWithMusic))
				this._updateHitSoundWithMusic(now);
			this._autoPlayUpdateAndProcessMiss(now);
			this._updateHoldings(now);
			if (now >= this._line1.bitmap.endTime)
				this._switchLine();
			this._finishIfShould(now);
		}
	}
	this._changeSceneIfShould();
	Scene_Base.prototype.update.call(this);
};

Scene_Game.prototype._updateRecordingApply = function (now) {
	while (this._recording.hit.length > 0) {
		const {time, key} = this._recording.hit[0];
		if (now >= time) {
			this._processHit(time);
			this._pressings[key] = true;
			this._recording.hit.shift();
		} else
			break;
	}
	while (this._recording.loosen.length > 0) {
		const {time, key} = this._recording.loosen[0];
		if (now >= time) {
			this._processLoosen(time);
			delete this._pressings[key];
			this._recording.loosen.shift();
		} else
			break;
	}
};

Scene_Game.prototype._setUpNewLine = function () {
	const line = this._line1.bitmap;
	const lineLengthInMilliseconds = line.endTime - line.startTime;
	if (line.perfect)
		this._perfectTolerance = line.perfect * lineLengthInMilliseconds;
	else
		this._perfectTolerance ||= TyphmConstants.DEFAULT_PERFECT * lineLengthInMilliseconds;
	if (line.good)
		this._goodTolerance = line.good * lineLengthInMilliseconds;
	else
		this._goodTolerance ||= TyphmConstants.DEFAULT_GOOD * lineLengthInMilliseconds;
	if (line.bad)
		this._badTolerance = line.bad * lineLengthInMilliseconds;
	else
		this._badTolerance ||= TyphmConstants.DEFAULT_BAD * lineLengthInMilliseconds;
	this._drawInaccuracyBar(this._perfectTolerance, this._goodTolerance, this._badTolerance);
	if (this._visuals.judgeLinePerformances) {
		this._destroyFakeJudgeLines();
		this._createFakeJudgeLines();
	}
};

Scene_Game.prototype.stop = function () {
	Scene_Base.prototype.stop.call(this);
	if (this._audioPlayer) {
		this._audioPlayer.stop();
		this._audioPlayer.clear();
	}
	document.removeEventListener('keydown', this._keydownEventListener);
	window.removeEventListener('blur', this._blurEventListener);
	document.removeEventListener('touchstart', this._touchStartEventListener);
	document.removeEventListener('keyup', this._keyupEventListener);
	document.removeEventListener('touchend', this._touchEndEventListener);
};

Scene_Game.prototype._onLoad = async function () {
	try {
		await this._beatmap.load();
	} catch (e) {
		if (e instanceof TypeError || e instanceof BeatmapError) {
			this._error = e;
			this._shouldError = true;
			return;
		} else
			throw e;
	}
	this._beatmap.drawLines(this._visuals.reverseVoices);
	if (!this._hasMusic && this._beatmap.audioUrl) {
		this._hasMusic = true;
		this._musicUrl = this._beatmap.audioUrl;
	}
	this._offsetWizard = this._beatmap.title === 'offset_wizard' && this._hasMusic
	this._inaccuraciesArray = [];
	this._lastPos = this._beatmap.start;
	this._makeTitle();
	this._unclearedEvents = [...this._beatmap.notes];
	this._unclearedHitSounds = [...this._beatmap.notes];
	this._unclearedMeasures = this._beatmap.barlines.map(barline => barline.time);
	this._currentMeasureJudge = Scene_Game.PERFECT;
	this._totalBig = this._beatmap.notes.reduce((bigCount, event) => bigCount + (event.big ? 1 : 0), 0);
	this._updateScore();
	this._updateCombo();
	if (this._hasMusic) {
		this._audioPlayer = new WebAudio(this._musicUrl);
		this._audioPlayer.addLoadListener(() => {
			this._audioPlayer.volume = this._beatmap.volume * preferences.masterVolume * preferences.musicVolume;
			this._length = this._beatmap.length !== 'unknown ' ?
					this._beatmap.length : this._audioPlayer._totalTime*1000;
			this._postLoadingAudio();
		});
	} else {
		this._length = this._unclearedEvents.last().timeEnd - this._beatmap.start;
		this._postLoadingAudio();
	}
};

Scene_Game.prototype._makeTitle = function () {
	const trueTitle = new Sprite(new Bitmap(this._restart.bitmap.measureTextWidth(this._beatmap.title), preferences.textHeight));
	trueTitle.bitmap.drawText(this._beatmap.title, 0, 0, trueTitle.width, preferences.textHeight, 'center');
	const maskSprite = new Sprite(new Bitmap(this._title.x + this._title.width, this._title.y + this._title.height));
	maskSprite.bitmap.fillRect(this._title.x, this._title.y, this._title.width, this._title.height, 'white');
	trueTitle.filters = [new PIXI.SpriteMaskFilter(maskSprite)];
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

Scene_Game.prototype._postLoadingAudio = function () {
	this._pauseButton.visible = true;
	this._loading.visible = false;
	this._inaccuracyBar.visible = true;
	this._scoreSprite.visible = true;
	this._comboSprite.visible = true;
	this._title.visible = true;
	this._modifiersListSprite.visible = true;
	if (this._visuals.showKeyboard)
		this._keyboardSprite.visible = true;
	if (this._visuals.TPSIndicator)
		this._TPSIndicator.visible = true;
	if (this._visuals.fadeIn)
		this._fadeInMask.visible = true;
	if (this._visuals.fadeOut)
		this._fadeOutMask.visible = true;
	this._line1.bitmap = this._beatmap.lines[this._line1Index];
	this._line2.bitmap = this._beatmap.lines[this._line2Index];
	this._loadingFinished = true;
	this._setUpNewLine();
	this._resume();
};

Scene_Game.prototype._onBlur = function () {
	if (preferences.autoPause && !this._paused && !this._ended)
		this._pause();
};

Scene_Game.prototype._pause = function () {
	if (this._paused) {
		this._resume();
	} else if (!this._musicEnded) {
		this._lastPos = this._now();
		this._paused = true;
		this._setButtonsVisible(true);
		if (this._resumingCountdown)
			this._overHUDLayer.removeChild(this._resumingCountdown);
		if (this._hasMusic)
			this._audioPlayer.stop();
	}
};

Scene_Game.prototype._resume = function () {
	if (!this._loadingFinished)
		return;
	this._paused = false;
	if (!this._ended) {
		this._setButtonsVisible(false);
		if (preferences.countdown) {
			this._resumingCountdown = new Scene_Game.Sprite_ResumingCountdown(this);
			this._overHUDLayer.addChild(this._resumingCountdown);
		} else
			this.actualResume();
	} else {
		this.actualResume();
	}
};

Scene_Game.prototype.actualResume = function () {
	this._overHUDLayer.removeChild(this._resumingCountdown);
	this._resumingCountdown = null;
	if (!this._ended)
		this._judgeLine.visible = true;
	if (this._hasMusic) {
		this._audioPlayer.pitch = this._modifiers.playRate;
		this._audioPlayer.play(false,
			Math.max(this._lastPos - preferences.offset*this._modifiers.playRate, 0)/1000);
	} else {
		this._starting = performance.now() - this._lastPos/this._modifiers.playRate;
	}
}

Scene_Game.prototype._onKeydown = function (event) {
	if (!this._loadingFinished)
		return;
	const key = event.key === ' ' ? 'Spacebar' : event.key;
	if (key === 'Escape' || key === 'F7' && preferences.F7Pause) {
		this._pause();
	} else if (!event.ctrlKey && !event.altKey && !event.metaKey && TyphmConstants.HITTABLE_KEYS.includes(key)) {
		if (this._pressings[key])
			return;
		this._pressings[key] = true;
		if (preferences.backtickRestart && key === '`') {
			this._shouldRestart = true;
		} else if (this._restart.visible) {
			if (key === 'r') {
				this._shouldRestart = true;
			} else if (key === 'b') {
				this._shouldBack = true;
			}
		} else if (!this._modifiers.autoPlay && this._isRecording) {
			const now = this._now();
			this._processHit(now);
			this._newRecording.hit.push({time: now, key: key});
		}
	}
};

Scene_Game.prototype._onKeyup = function (event) {
	if (!this._loadingFinished)
		return;
	const key = event.key === ' ' ? 'Spacebar' : event.key;
	delete this._pressings[key];
	if (!this._paused && !this._modifiers.autoPlay && this._isRecording) {
		const now = this._now();
		this._processLoosen(now);
		this._newRecording.loosen.push({time: now, key: key});
	}
};

Scene_Game.prototype._onTouchEnd = function (event) {
	if (!this._loadingFinished)
		return;
	const changedTouches = event.changedTouches;
	for (let i = 0; i < changedTouches.length; i++) {
		delete this._pressings[changedTouches.item(i).identifier];
	}
	if (!this._paused && !this._modifiers.autoPlay && this._isRecording) {
		const now = this._now();
		for (let i = 0; i < changedTouches.length; i++) {
			this._processLoosen(now);
			this._newRecording.loosen.push({time: now, key: changedTouches.item(i).identifier});
		}
	}
};

Scene_Game.prototype._onTouchStart = function (event) {
	if (!this._loadingFinished)
		return;
	const changedTouches = event.changedTouches;
	for (let i = 0; i < changedTouches.length; i++) {
		this._pressings[changedTouches.item(i).identifier] = true;
	}
	if (!this._paused && !this._modifiers.autoPlay && this._isRecording) {
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
		for (let i = 0; i < identifiers.length; i++) {
			this._processHit(now);
			this._newRecording.hit.push({time: now, key: identifiers[i]});
		}
	}
};

Scene_Game.prototype._hitSoundEnabled = function () {
	return !!(preferences.enableHitSound && !this._offsetWizard);
};

Scene_Game.prototype._playHitSound = function () {
	const player = new WebAudio('/assets/audios/hit_sounds/' + preferences.hitSound);
	player.volume = preferences.hitSoundVolume * preferences.masterVolume;
	player.addLoadListener(player.play.bind(player));
};

Scene_Game.prototype._perfectHit = function () {
	const event = this._unclearedEvents.shift();
	this._refreshMeasureStateAfterHitting(event, Scene_Game.PERFECT);
	if (this._hitSoundEnabled() && !preferences.hitSoundWithMusic)
		this._playHitSound();
	if (event.hold) {
		this._holdings.push({'event': event, judge: Scene_Game.PERFECT});
		this._holdings.sort((a, b) => a.event.timeEnd - b.event.timeEnd);
	} else {
		this._perfectClear(event);
	}
	this._createHitEffect(event, Scene_Game.PERFECT);
};

Scene_Game.prototype._perfectClear = function (event) {
	this._beatmap.clearNote(event, Scene_Game.PERFECT);
	this._perfectNumber++;
	this._combo++;
	if (event.big)
		this._perfectBig++;
	this._updateScore();
	this._updateCombo();
};

Scene_Game.prototype._goodHit = function () {
	const event = this._unclearedEvents.shift();
	this._refreshMeasureStateAfterHitting(event, Scene_Game.GOOD);
	if (this._hitSoundEnabled() && !preferences.hitSoundWithMusic)
		this._playHitSound();
	this._onDestinedGood();
	if (event.hold) {
		this._holdings.push({'event': event, judge: Scene_Game.GOOD});
		this._holdings.sort((a, b) => a.event.timeEnd - b.event.timeEnd);
	} else {
		this._goodClear(event);
	}
	this._createHitEffect(event, Scene_Game.GOOD);
};

Scene_Game.prototype._onDestinedGood = function () {
	if (this._visuals.flashWarningGood)
		this._flashWarn(Scene_Game.GOOD)
	if (this._isRecording && preferences.autoRestartGood)
		this._shouldRestart = true;
};

Scene_Game.prototype._goodClear = function (event) {
	this._beatmap.clearNote(event, Scene_Game.GOOD);
	this._goodNumber++;
	this._combo++;
	if (event.big)
		this._goodBig++;
	this._updateScore();
	this._updateCombo();
};

Scene_Game.prototype._refreshMeasureStateAfterHitting = function (event, judge) {
	while (this._unclearedMeasures.length > 0 && event.time >= this._unclearedMeasures[0])
		this._clearMeasure();
	this._currentMeasureJudge = Math.min(judge, this._currentMeasureJudge);
};

Scene_Game.prototype._badHit = function () {
	const event = this._unclearedEvents.shift();
	this._refreshMeasureStateAfterHitting(event, Scene_Game.BAD);
	this._onDestinedBad();
	this._badClear(event);
	this._createHitEffect(event, Scene_Game.BAD);
};

Scene_Game.prototype._onDestinedBad = function () {
	if (this._visuals.flashWarningMiss)
		this._flashWarn(Scene_Game.BAD)
	if (this._isRecording && (preferences.autoRestartGood || preferences.autoRestartMiss))
		this._shouldRestart = true;
};

Scene_Game.prototype._badClear = function (event) {
	this._badNumber++;
	if (event.big)
		this._badBig++;
	this._combo = 0;
	this._updateScore();
	this._updateCombo();
	this._beatmap.clearNote(event, Scene_Game.BAD);
};

Scene_Game.prototype._processHit = function (now) {
	if (this._visuals.TPSIndicator)
		this._hitsLastSecond.push(now);
	if (!this._ended) {
		while (this._unclearedEvents.length > 0) {
			const event = this._unclearedEvents[0];
			if (now >= event.time - this._missBoundary() * this._modifiers.judgeWindow) {
				const inaccuracy = now - event.time;
				const judge = this._getJudgeFromInaccuracy(inaccuracy);
				if (judge === Scene_Game.PERFECT)
					this._perfectHit();
				else if (judge === Scene_Game.GOOD)
					this._goodHit();
				else if (judge === Scene_Game.BAD && !this._modifiers.noBad)
					this._badHit();
				else {
					this._missHit();
					continue;
				}
				this._inaccuraciesArray.push(inaccuracy);
				this._createInaccuracyIndicator(inaccuracy);
			} else if (!this._modifiers.noExcess) {
				this._excessHit(now);
			}
			break;
		}
	}
};

Scene_Game.prototype._excessHit = function (now) {
	this._createWrongNote(now);
	this._combo = 0;
	this._updateCombo();
	this._excessNumber++;
	if (this._isRecording && (preferences.autoRestartGood || preferences.autoRestartMiss))
		this._shouldRestart = true;
	if (this._visuals.flashWarningMiss)
		this._flashWarn(Scene_Game.EXCEESS)
	this._updateScore();
};

Scene_Game.prototype._processLoosen = function (now) {
	if (!this._modifiers.autoCompleteHolds && Object.keys(this._pressings).length < this._holdings.length) {
		const {event, judge} = this._holdings.shift();
		if (now < event.timeEnd - this._goodTolerance * this._modifiers.judgeWindow) {
			this._onDestinedMiss();
			this._missClear(event);
		} else if (judge === Scene_Game.PERFECT) {
			this._perfectClear(event);
		} else if (judge === Scene_Game.GOOD) {
			this._goodClear(event);
		}
	}
};

Scene_Game.prototype._onDestinedMiss = function () {
	if (this._isRecording && (preferences.autoRestartGood || preferences.autoRestartMiss))
		this._shouldRestart = true;
	if (this._visuals.flashWarningMiss)
		this._flashWarn(Scene_Game.MISS);
};

Scene_Game.prototype._updateScore = function () {
	this._scoreSprite.bitmap.clear();
	if (this._visuals.subtractScore) {
		this._score = Math.floor(500000 * (
			(
				this._beatmap.notes.length+this._totalBig-this._goodNumber-this._badNumber-this._missNumber-this._goodBig-this._badBig-this._missBig +
				(this._goodNumber+this._goodBig)/4 - this._excessNumber
			) / (this._beatmap.notes.length + this._totalBig) + (
				this._beatmap.barlines.length-this._goodMeasures-this._badMeasures-this._missMeasures + this._goodMeasures/2
			) / this._beatmap.barlines.length
		));
	} else {
		this._score = Math.floor(500000 * (
			(
				this._perfectNumber+this._perfectBig + (this._goodNumber+this._goodBig)/4 - this._excessNumber
			) / (this._beatmap.notes.length + this._totalBig) + (
				this._perfectMeasures + this._goodMeasures/2
			) / this._beatmap.barlines.length
		));
	}
	this._scoreSprite.bitmap.textColor = this._getScoreColor();
	this._scoreSprite.bitmap.drawText(this._score, 0, 0, this._scoreSprite.width, preferences.textHeight, 'right');
	if (!this._unclearedEvents || this._unclearedEvents.length === this._beatmap.notes.length)
		return;
	this._accuracyRateSprite.bitmap.clear();
	this._accuracyRate = (this._perfectNumber + this._goodNumber/4 - this._excessNumber)/(this._perfectNumber + this._goodNumber + this._badNumber + this._missNumber);
	this._accuracyRateSprite.bitmap.textColor = this._getScoreColor();
	this._accuracyRateSprite.bitmap.drawText(sprintf('%.2f%% %s', this._accuracyRate*100, this._getMark()),
		0, 0, this._accuracyRateSprite.width, preferences.textHeight, 'right');
};

Scene_Game.prototype._getScoreColor = function () {
	if (this._visuals.FCAPIndicator) {
		if (this._goodNumber === 0 && this._badNumber === 0 && this._missNumber === 0 && this._excessNumber === 0) {
			return preferences.perfectColor;
		} else if (this._badNumber === 0 && this._missNumber === 0 && this._excessNumber === 0) {
			return preferences.goodColor;
		} else {
			return preferences.textColor;
		}
	} else {
		return preferences.textColor;
	}
};

Scene_Game.prototype._updateCombo = function () {
	if (this._combo > this._maxCombo) {
		this._maxCombo = this._combo;
	}
	this._comboSprite.bitmap.clear();
	this._comboSprite.bitmap.textColor = this._getScoreColor();
	this._comboSprite.bitmap.drawText(this._combo, 0, 0, this._comboSprite.width, preferences.textHeight, 'left');
	if (this._visuals.comboPopupInterval && this._combo > 0 && this._combo % this._visuals.comboPopupInterval === 0) {
		const comboIndicator = new Sprite(new Bitmap(512, 128));
		comboIndicator.bitmap.fontSize = 108;
		comboIndicator.bitmap.textColor = preferences.textColor + '80';
		comboIndicator.bitmap.drawText(this._combo, 0, 0, 512, 128, 'center');
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
	if (this._hasMusic) {
		if (this._resumingCountdown)
			return this._lastPos;
		else if (this._paused)
			return this._lastPos + preferences.offset;
		else
			return this._audioPlayer.seek()*1000 + preferences.offset*this._modifiers.playRate;
	} else {
		if (this._resumingCountdown || this._paused)
			return this._lastPos;
		else
			return (performance.now() - this._starting) * this._modifiers.playRate;
	}
};

Scene_Game.prototype._createInaccuracyIndicator = function (inaccuracy) {
	const inaccuracyIndicator = new Sprite(this._inaccuracyBitmap);
	inaccuracyIndicator.anchor.x = 0.5;
	inaccuracyIndicator.anchor.y = 0.5;
	inaccuracyIndicator.x = this._inaccuracyBar.x + 
			this._inaccuracyBar.width/2 * inaccuracy/(this._missBoundary() * this._modifiers.judgeWindow);
	inaccuracyIndicator.y = this._inaccuracyBar.y;
	this._overHUDLayer.addChild(inaccuracyIndicator);
	inaccuracyIndicator.update = () => {
		inaccuracyIndicator.opacity -= 0.5*60/Graphics._fpsMeter.fps;
		if (inaccuracyIndicator.opacity <= 0)
			this._overHUDLayer.removeChild(inaccuracyIndicator);
	};
	if (this._visuals.showInaccuracyData) {
		this._inaccuracyDataSprite.bitmap.clear();
		this._inaccuracyDataSprite.bitmap.textColor = Scene_Game.getColorFromJudge(this._getJudgeFromInaccuracy(inaccuracy));
		this._inaccuracyDataSprite.bitmap.drawText(sprintf('%+.0fms', inaccuracy), 0, 0,
			this._inaccuracyDataSprite.width, preferences.textHeight, 'center');
	}
};

Scene_Game.prototype._getJudgeFromInaccuracy = function (inaccuracy) {
	const absInaccuracy = Math.abs(inaccuracy);
	if (absInaccuracy <= this._perfectTolerance * this._modifiers.judgeWindow)
		return Scene_Game.PERFECT;
	if (absInaccuracy <= this._goodTolerance * this._modifiers.judgeWindow)
		return Scene_Game.GOOD;
	if (absInaccuracy <= this._badTolerance * this._modifiers.judgeWindow)
		return Scene_Game.BAD;
	return Scene_Game.MISS;
};

Scene_Game.prototype._createHitEffect = function (event, judge) {
	const r = preferences.hitEffectRadius;
	const hitEffect = new Sprite(new Bitmap(2*r, 2*r));
	const color = Scene_Game.getColorFromJudge(judge);
	hitEffect.bitmap.drawCircle(r, r, preferences.headsRadius, color);
	hitEffect.anchor.x = 0.5;
	hitEffect.anchor.y = 0.5;
	hitEffect.x = event.hitX;
	if (this._visuals.mirror)
		hitEffect.x = Graphics.width - hitEffect.x;
	const line = this._line1Index === event.lineno ? this._line1 : this._line2;
	hitEffect.y = line.y - TyphmConstants.LINES_HEIGHT / 2 + event.y;
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
	wrongNote.x = this._getXFromTime(time);
	wrongNote.y = this._line1.y;
	this._beatmapLayer.addChild(wrongNote);
	wrongNote.update = () => {
		wrongNote.opacity *= 0.98**(60/Graphics._fpsMeter.fps);
		if (wrongNote.opacity <= 5)
			this._beatmapLayer.removeChild(wrongNote);
	};
};

Scene_Game.prototype._getLengthPositionFromTime = function (time) {
	const line = this._line1.bitmap;
	if (!line || !line.timeFormula)
		return 0;
	const timePosition = (time - line.startTime) / line.totalTime;
	let min = 0, max = 1;
	let lengthPosition;
	while (max - min > 1e-6) {
		lengthPosition = (min + max) / 2;
		if (line.timeFormula(lengthPosition) > timePosition) {
			max = lengthPosition;
		} else if (line.timeFormula(lengthPosition) === timePosition) {
			break;
		} else {
			min = lengthPosition;
		}
	}
	return lengthPosition;
};

Scene_Game.prototype._getXFromLengthPosition = function (lengthPosition) {
	if (this._line1 && this._line1.bitmap)
		return preferences.margin + this._line1.bitmap.space_xFormula(lengthPosition) * (Graphics.width - 2*preferences.margin);
};

Scene_Game.prototype._getXFromTime = function (time) {
	return this._getXFromLengthPosition(this._getLengthPositionFromTime(time));
};

Scene_Game.prototype._setButtonsVisible = function (visibility) {
	this._back.visible = visibility;
	this._restart.visible = visibility;
};

Scene_Game.prototype._finish = function () {
	if (this._ended)
		return;
	this._ended = true;
	this._destroyFakeJudgeLines();
	this._drawSummary();
	if (this._combo === this._beatmap.notes.length)
		this._fullCombo.visible = true;
	this._judgeLine.visible = false;
	this._line1.visible = false;
	this._line2.visible = false;
	if (this._visuals.showKeyboard)
		this._keyboardSprite.visible = false;
	if (this._visuals.TPSIndicator)
		this._TPSIndicator.visible = false;
	if (this._visuals.showInaccuracyData)
		this._inaccuracyDataSprite.visible = false;
	if (this._offsetWizard && this._inaccuraciesArray.length > 0)
		preferences.offset -= math.mean(this._inaccuraciesArray);
	if (this._inaccuraciesArray.length > 0)
		this._inaccuraciesDistribution.visible = true;
	this._setButtonsVisible(true);
	this._viewRecordingButton.visible = true;
	this._saveRecordingButton.visible = true;
};

Scene_Game.prototype._drawInaccuraciesDistribution = function () {
	if (this._inaccuraciesArray.length < 2)
		return;
	const mu = math.mean(this._inaccuraciesArray);
	const sigma2 = math.variance(this._inaccuraciesArray);
	const sigma = Math.sqrt(sigma2);
	const twoS2 = 2*TyphmConstants.INACCURACIES_DISTRIBUTION_BLUR / this._inaccuraciesArray.length;
	const n = TyphmConstants.INACCURACIES_DISTRIBUTION_PIECES;
	const points = new Array(n).fill(0);
	for (let i = 0; i < n; i++) {
		const x = (i/(n-1) - 0.5)*6;
		for (let j = 0; j < this._inaccuraciesArray.length; j++) {
			const z = (this._inaccuraciesArray[j] - mu) / sigma
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

Scene_Game.prototype._clearMeasure = function () {
	if (this._currentMeasureJudge === Scene_Game.PERFECT)
		this._perfectMeasures++;
	else if (this._currentMeasureJudge === Scene_Game.GOOD)
		this._goodMeasures++;
	else if (this._currentMeasureJudge === Scene_Game.BAD)
		this._badMeasures++;
	else if (this._currentMeasureJudge === Scene_Game.MISS)
		this._missMeasures++;
	this._unclearedMeasures.shift();
	this._currentMeasureJudge = Scene_Game.PERFECT;
};

Scene_Game.prototype._drawSummary = function () {
	this._clearMeasure();
	this._updateScore();
	this._markSprite.bitmap.fontSize = 108;
	this._markSprite.bitmap.textColor = this._getScoreColor();
	this._markSprite.bitmap.drawText(this._getMark(),
		0, 0, this._markSprite.width, this._markSprite.height, 'center');
	this._summarySprite.bitmap.textColor = preferences.perfectColor;
	this._summarySprite.bitmap.drawText(`${Strings.perfect}: ${this._perfectNumber} (${this._perfectMeasures})`,
		0, 0, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.goodColor;
	this._summarySprite.bitmap.drawText(`${Strings.good}: ${this._goodNumber} (${this._goodMeasures})`,
		0, preferences.textHeight, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.badColor;
	this._summarySprite.bitmap.drawText(`${Strings.bad}: ${this._badNumber} (${this._badMeasures})`,
		0, preferences.textHeight*2, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.missColor;
	this._summarySprite.bitmap.drawText(`${Strings.miss}: ${this._missNumber} (${this._missMeasures})`,
		0, preferences.textHeight*3, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.excessColor;
	this._summarySprite.bitmap.drawText(`${Strings.excess}: ${this._excessNumber}`,
		0, preferences.textHeight*4, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.textColor;
	this._summarySprite.bitmap.drawText(`${Strings.maxCombo}: ${this._maxCombo}`,
		0, preferences.textHeight*5, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._drawInaccuraciesDistribution();
};

Scene_Game.prototype._getMark = function () {
	if (this._accuracyRate >= 1) {
		return Strings.markP;
	} else if (this._accuracyRate >= 0.95) {
		return Strings.markS;
	} else if (this._accuracyRate >= 0.9) {
		return Strings.markA;
	} else if (this._accuracyRate >= 0.8) {
		return Strings.markB;
	} else if (this._accuracyRate >= 0.7) {
		return Strings.markC;
	} else if (this._accuracyRate >= 0.6) {
		return Strings.markD;
	} else if (this._accuracyRate >= 0.5) {
		return Strings.markE;
	} else {
		return Strings.markF;
	}
}

Scene_Game.Sprite_ResumingCountdown = function () {
	this.initialize.apply(this, arguments);
};

Scene_Game.Sprite_ResumingCountdown.prototype = Object.create(Sprite.prototype);
Scene_Game.Sprite_ResumingCountdown.prototype.constructor = Scene_Game.Sprite_ResumingCountdown;

Scene_Game.Sprite_ResumingCountdown.prototype.initialize = function (scene) {
	Sprite.prototype.initialize.call(this, new Bitmap(preferences.fontSize*8, preferences.textHeight*8));
	this.anchor.x = 0.5;
	this.anchor.y = 0.5;
	this.x = Graphics.width / 2;
	this.y = Graphics.height / 2;
	this.bitmap.fontSize = preferences.fontSize*8;
	this._scene = scene;
	const maxCount = 3;
	for (let i = 0; i <= maxCount; i++) {
		setTimeout(() => this._countTo(i), (maxCount - i)*1000);
	}
};

Scene_Game.Sprite_ResumingCountdown.prototype._countTo = function (n) {
	if (!this.parent)
		return;
	if (n === 0) {
		this._scene.actualResume();
	} else {
		this.bitmap.clear();
		this.bitmap.drawText(n, 0, 0, this.width, this.height, 'center');
	}
};
