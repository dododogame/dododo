function Scene_Game() {
	this.initialize.apply(this, arguments);
}

Scene_Game.prototype = Object.create(Scene_Base.prototype);
Scene_Game.prototype.constructor = Scene_Game;

Scene_Game.prototype.initialize = function (musicUrl, beatmapUrl) {
	Scene_Base.prototype.initialize.call(this);
	this._musicUrl = musicUrl;
	this._beatmapUrl = beatmapUrl;
};

Scene_Game.prototype.start = function () {
	Scene_Base.prototype.start.call(this);

	this._loading = new Sprite(new Bitmap(256, preferences.textHeight));
	this._center(this._loading, 300);
	this._loading.bitmap.drawText(Strings.loading, 0, 0, 256, preferences.textHeight, 'white');
	this.addChild(this._loading);
	
	this._paused = true;
	this._lastPos = 0.0;
	this._activeEnding = false;
	this._starting = performance.now();
	
	this._line1 = new Sprite();
	this._line1.width = 1024;
	this._line1.anchor.y = 0.5;
	this._center(this._line1, Graphics.height / 4);
	this.addChild(this._line1);
	
	this._line2 = new Sprite();
	this._line2.width = Graphics.width;
	this._line2.anchor.y = 0.5;
	this._center(this._line2, Graphics.height * 3/4);
	this.addChild(this._line2);
	
	this._judgeLine = new Sprite(new Bitmap(1, 1));
	this._judgeLine.bitmap.fillAll('white');
	this._judgeLine.anchor.x = 0.5;
	this._judgeLine.anchor.y = 0.5;
	this._judgeLine.visible = false;
	this.addChild(this._judgeLine);
	
	this._pauseButton = new Button(new Bitmap(30, 32), () => { this._pause(); });
	this._pauseButton.y = (preferences.textHeight - 32) / 2;
	this._pauseButton.zIndex = 10;
	this._pauseButton.bitmap.fillRect(6, 4, 6, 24, 'white');
	this._pauseButton.bitmap.fillRect(18, 4, 6, 24, 'white');
	this._pauseButton.visible = false;
	this.addChild(this._pauseButton);
	
	this._back = new Button(new Bitmap(192, preferences.textHeight),
		() => { this._shouldBack = true; });
	this._back.bitmap.drawText(`${Strings.quitGame} (b)`, 0, 0, 192, preferences.textHeight, 'center');
	this._back.x = 30;
	this._back.zIndex = 10;
	this.addChild(this._back);
	
	this._restart = new Button(new Bitmap(192, preferences.textHeight),
		() => { this._shouldRestart = true });
	this._restart.bitmap.drawText(`${Strings.restartGame} (r)`, 0, 0, 192, preferences.textHeight, 'center');
	this._restart.x = 30+192;
	this.addChild(this._restart);
	
	this._title = new Sprite();
	this._title.width = Graphics.width - (32+192+192+128);
	this._title.height = preferences.textHeight;
	this._title.x = 32+192+192;
	this._title.visible = false;
	this.addChild(this._title);
	
	this._setButtonsVisible(false);
	
	this._scoreSprite = new Sprite(new Bitmap(128, preferences.textHeight));
	this._scoreSprite.anchor.x = 1;
	this._scoreSprite.x = Graphics.width;
	this._scoreSprite.visible = false;
	this.addChild(this._scoreSprite);
	
	this._comboSprite = new Sprite(new Bitmap(64, preferences.textHeight));
	this._comboSprite.anchor.y = 1;
	this._comboSprite.y = Graphics.height;
	this._comboSprite.visible = false;
	this.addChild(this._comboSprite);
	
	this._markSprite = new Sprite(new Bitmap(100, 200));
	this._markSprite.anchor.x = 1;
	this._markSprite.anchor.y = 0.5;
	this._markSprite.x = Graphics.width - 200;
	this._markSprite.y = Graphics.height / 2;
	this.addChild(this._markSprite);
	
	this._summarySprite = new Sprite(new Bitmap(512, 384));
	this._summarySprite.anchor.y = 0.5;
	this._center(this._summarySprite, Graphics.height / 2);
	this.addChild(this._summarySprite);
	
	this._fullCombo = new Sprite(new Bitmap(60, preferences.textHeight));
	this._fullCombo.anchor.y = 1;
	this._fullCombo.y = Graphics.height;
	this._fullCombo.x = 80;
	this._fullCombo.bitmap.drawText(Strings.fullCombo, 0, 0, 60, preferences.textHeight, 'center');
	this._fullCombo.visible = false;
	this.addChild(this._fullCombo);
	
	this._inaccuracyBar = new Sprite(new Bitmap(512, 10));
	this._inaccuracyBar.anchor.y = 0.5;
	this._center(this._inaccuracyBar, Graphics.height - 20);
	this._drawInaccuracyBar(TyphmConstants.DEFAULT_PERFECT, TyphmConstants.DEFAULT_GOOD, TyphmConstants.DEFAULT_BAD);
	this._inaccuracyBar.visible = false;
	this.addChild(this._inaccuracyBar);
	
	this._inaccuracyBitmap = new Bitmap(3, 16);
	this._inaccuracyBitmap.fillAll('white');
	
	this._progressIndicator = new Sprite(new Bitmap(Graphics.width, 1));
	this._progressIndicator.bitmap.fillAll('white');
	this._progressIndicator.anchor.x = 1;
	this.addChild(this._progressIndicator);
	
	this._accuracyRateSprite = new Sprite(new Bitmap(256, preferences.textHeight));
	this._accuracyRateSprite.anchor.y = 1;
	this._accuracyRateSprite.anchor.x = 1;
	this._accuracyRateSprite.x = Graphics.width;
	this._accuracyRateSprite.y = Graphics.height;
	this.addChild(this._accuracyRateSprite);
	
	if (preferences.autoPlay) {
		this._autoPlayIndicator = new Sprite(new Bitmap(256, preferences.textHeight));
		this._autoPlayIndicator.anchor.y = 0.5;
		this._autoPlayIndicator.y = Graphics.height / 2;
		this._autoPlayIndicator.bitmap.drawText(Strings.autoPlaying, 0, 0, 256, preferences.textHeight, 'left');
		this._autoPlayIndicator.visible = false;
		this.addChild(this._autoPlayIndicator);
	}
	
	this._beatmap = new Beatmap(this._beatmapUrl);
	
	this._hasMusic = !!this._musicUrl;
	this._ended = false;
	
	this._perfectNumber = 0;
	this._goodNumber = 0;
	this._badNumber = 0;
	this._missNumber = 0;
	this._excessNumber = 0;
	this._combo = 0;
	this._maxCombo = 0;
	
	this._holdings = [];
	this._pressings = {};
	
	this._line1Index = 0;
	this._line2Index = 1;
	
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
	
	this._resumingCountdown = null;
	
	this._loadingFinished = false;
	this._onLoad();
	
	this._shouldRestart = false;
	this._shouldBack = false;
};

Scene_Game.prototype._drawInaccuracyBar = function (perfect, good, bad) {
	this._inaccuracyBar.bitmap.fillRect(0, 0, 512, 10, preferences.badColor);
	this._inaccuracyBar.bitmap.fillRect(256*(1-good/bad), 0, 512*good/bad, 10, preferences.goodColor);
	this._inaccuracyBar.bitmap.fillRect(256*(1-perfect/bad), 0, 512*perfect/bad, 10, preferences.perfectColor);
}

Scene_Game.prototype.update = function () {
	const now = this._now();
	const lengthPosition = this._getLengthPositionFromTime(now);
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
	if (!this._resumingCountdown && !this._paused && !this._ended) {
		const line = this._line1.bitmap;
		this._judgeLine.x = this._getXFromLengthPosition(lengthPosition);
		this._judgeLine.y = this._line1.y - line.space_yFormula(lengthPosition);
		this._judgeLine.scale.x = line.widthFormula(lengthPosition);
		this._judgeLine.scale.y = line.heightFormula(lengthPosition);
		this._judgeLine.bitmap.clear();
		this._judgeLine.bitmap.fillAll(TyphmUtils.fromRGBAToHex(line.redFormula(lengthPosition), line.greenFormula(lengthPosition), line.blueFormula(lengthPosition), line.alphaFormula(lengthPosition)));
		if (preferences.autoPlay || preferences.hitSoundWithMusic) {
			while (true) {
				const event = this._unclearedHitSounds[0];
				const offsetNow = now - preferences.offset * preferences.playRate;
				if (event && offsetNow >= event.time) {
					if (offsetNow <= event.time + this._perfectTolerance)
						this._playHitSound();
					this._unclearedHitSounds.splice(0, 1);
				} else
					break;
			}
		}
		while (true) {
			const event = this._unclearedEvents[0];
			if (event && now >= event.time) {
				if (preferences.autoPlay && now <= event.time + this._perfectTolerance) {
					this._createHitEffect(event, 'perfect');
					this._unclearedEvents.splice(0, 1);
					if (event.hold) {
						this._holdings.push([event, 'perfect']);
					} else {
						this._beatmap.clearNote(event, 'perfect');
						this._combo++;
						this._updateCombo();
						this._perfectNumber++;
						this._updateScore();
					}
				} else if (now >= event.time + this._badTolerance) {
					this._beatmap.clearNote(event, 'miss');
					this._missNumber++;
					this._combo = 0;
					if (preferences.autoRestartGood || preferences.autoRestartMiss)
						this._shouldRestart = true;
					this._updateCombo();
					this._updateScore();
					this._unclearedEvents.splice(0, 1);
				} else
					break;
			} else
				break;
		}
		for (let i = 0; i < this._holdings.length; i++) {
			const [event, judge] = this._holdings[i];
			if (now >= event.timeEnd) {
				this._beatmap.clearNote(event, judge);
				if (judge === 'perfect') {
					this._perfectNumber++;
				} else {
					this._goodNumber++;
					if (preferences.autoRestartGood)
						this._shouldRestart = true;
				}
				this._combo++;
				this._updateScore();
				this._updateCombo();
				this._holdings.splice(i, 1);
				i--;
			} else {
				this._beatmap.trackHoldTo(now, this._judgeLine.x, event, judge, this._line1Index);
			}
		}
		if (now >= this._line1.bitmap.endTime) {
			let t = this._line1;
			this._line1 = this._line2;
			this._line2 = t;
			t = this._line1Index;
			this._line1Index = this._line2Index;
			this._line2Index = t;
			this._line2Index += 2;
			this._line2.bitmap = this._beatmap.lines[this._line2Index];
			this._setUpNewLine();
		}
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
	}
	if (this._shouldRestart) {
		window.scene = new Scene_Game(this._musicUrl, this._beatmapUrl);
	}
	if (this._shouldBack) {
		window.scene = this._inaccuraciesArray ? new Scene_Preferences() : new Scene_Title();
	}
	Scene_Base.prototype.update.call(this);
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
}

Scene_Game.prototype.stop = function () {
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
	await this._beatmap.load();
	this._beatmap.drawLines();
	if (!this._hasMusic && this._beatmap.audioUrl) {
		this._hasMusic = true;
		this._musicUrl = this._beatmap.audioUrl;
	}
	if (this._beatmap.title === 'offset_wizard' && this._hasMusic)
		this._inaccuraciesArray = [];
	this._lastPos = this._beatmap.start;
	this._makeTitle();
	this._updateScore();
	this._updateCombo();
	this._unclearedEvents = [...this._beatmap.notes];
	this._unclearedHitSounds = [...this._beatmap.notes];
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
	if (preferences.autoPlay)
		this._autoPlayIndicator.visible = true;
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
			this.removeChild(this._resumingCountdown);
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
		if (preferences.countdown)
			this._resumingCountdown = new Scene_Game.Sprite_ResumingCountdown(this);
		else
			this.actualResume();
	} else {
		this.actualResume();
	}
};

Scene_Game.prototype.actualResume = function () {
	this._resumingCountdown = null;
	if (!this._ended)
		this._judgeLine.visible = true;
	if (this._hasMusic) {
		this._audioPlayer.pitch = preferences.playRate;
		this._audioPlayer.play(false, this._lastPos/1000);
	} else {
		this._starting = performance.now() - this._lastPos/preferences.playRate;
	}
}

Scene_Game.prototype._onKeydown = function (event) {
	if (event.key === 'Escape' || event.key === 'F7' && preferences.F7Pause) {
		this._pause();
	} else if (!event.ctrlKey && !event.altKey && !event.metaKey && '`1234567890\\qwertyuiop[]asdfghjkl;\'zxcvbnm,./'.includes(event.key)) {
		if (this._pressings[event.key])
			return;
		this._pressings[event.key] = true;
		if (preferences.backtickRestart && event.key === '`') {
			this._shouldRestart = true;
		} else if (this._restart.visible) {
			if (event.key === 'r') {
				this._shouldRestart = true;
			} else if (event.key === 'b') {
				this._shouldBack = true;
			}
		} else if (!preferences.autoPlay) {
			this._processHit();
		}
	}
};

Scene_Game.prototype._onKeyup = function (event) {
	delete this._pressings[event.key];
	if (!this._paused && !preferences.autoPlay) {
		this._processLoosen(event.key);
	}
};

Scene_Game.prototype._onTouchEnd = function (event) {
	const changedTouches = event.changedTouches;
	for (let i = 0; i < changedTouches.length; i++) {
		delete this._pressings[changedTouches.item(i).identifier];
	}
	if (!this._paused && !preferences.autoPlay) {
		for (let i = 0; i < changedTouches.length; i++) {
			this._processLoosen(changedTouches.item(i).identifier);
		}
	}
};

Scene_Game.prototype._onTouchStart = function (event) {
	const changedTouches = event.changedTouches;
	for (let i = 0; i < changedTouches.length; i++) {
		this._pressings[changedTouches.item(i).identifier] = true;
	}
	if (!this._paused && !preferences.autoPlay) {
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
		for (let i = 0; i < identifiers.length; i++) {
			this._processHit();
		}
	}
};

Scene_Game.prototype._playHitSound = function () {
	if (preferences.enableHitSound && !this._inaccuraciesArray) {
		const player = new WebAudio('/assets/audios/hit_sounds/' + preferences.hitSound);
		player.volume = preferences.hitSoundVolume * preferences.masterVolume;
		player.addLoadListener(player.play.bind(player));
	}
};

Scene_Game.prototype._processHit = function () {
	const now = this._now();
	if (!this._ended) {
		const event = this._unclearedEvents[0];
		if (event && now >= event.time - this._badTolerance) {
			if (this._inaccuraciesArray) {
				this._inaccuraciesArray.push(now - event.time);
			}
			const inaccuracy = now - event.time;
			let judge;
			if (Math.abs(inaccuracy) <= this._perfectTolerance) {
				if (!preferences.hitSoundWithMusic)
					this._playHitSound();
				judge = 'perfect';
				if (!event.hold) {
					this._perfectNumber++;
					this._combo++;
				} else {
					this._holdings.push([event, judge]);
				}
			} else if (Math.abs(inaccuracy) <= this._goodTolerance) {
				if (!preferences.hitSoundWithMusic)
					this._playHitSound();
				judge = 'good';
				if (!event.hold) {
					this._goodNumber++;
					this._combo++;
					if (preferences.autoRestartGood)
						this._shouldRestart = true;
				} else {
					this._holdings.push([event, judge]);
				}
			} else {
				judge = 'bad';
				this._badNumber++;
				if (preferences.autoRestartGood || preferences.autoRestartMiss)
					this._shouldRestart = true;
				this._combo = 0;
			}
			this._beatmap.clearNote(event, judge);
			this._unclearedEvents.splice(0, 1);
			if (!event.hold || judge === 'bad') {
				this._updateScore();
				this._updateCombo();
				this._createInaccuracyIndicator(inaccuracy);
			} else {
				this._holdings.sort((a, b) => a.timeEnd - b.timeEnd);
			}
			this._createHitEffect(event, judge);
		} else {
			this._createWrongNote(now);
			this._combo = 0;
			this._updateCombo();
			this._excessNumber++;
			if (preferences.autoRestartGood || preferences.autoRestartMiss)
				this._shouldRestart = true;
			this._updateScore();
		}
	}
};

Scene_Game.prototype._processLoosen = function () {
	if (Object.keys(this._pressings).length < this._holdings.length) {
		const [event, judge] = this._holdings.shift();
		if (this._now() < event.timeEnd - this._goodTolerance) {
			this._beatmap.clearNote(event, 'miss');
			this._missNumber++;
			this._combo = 0;
			if (preferences.autoRestartGood || preferences.autoRestartMiss)
				this._shouldRestart = true;
			this._updateScore();
			this._updateCombo();
		}
	}
};

Scene_Game.prototype._updateScore = function () {
	this._scoreSprite.bitmap.clear();
	this._score = Math.floor((this._perfectNumber + this._goodNumber/4 - this._excessNumber)*1000000/this._beatmap.notes.length);
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
	if (preferences.FCAPIndicator) {
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
	if (this._combo > 0 && this._combo % 25 === 0) {
		const comboIndicator = new Sprite(new Bitmap(512, 128));
		comboIndicator.bitmap.fontSize = 108;
		comboIndicator.bitmap.textColor = preferences.textColor + '80';
		comboIndicator.bitmap.drawText(this._combo, 0, 0, 512, 128, 'center');
		comboIndicator.anchor.y = 0.5;
		this._center(comboIndicator, Graphics.height / 2);
		this.addChild(comboIndicator);
		comboIndicator.update = () => {
			comboIndicator.opacity *= 0.95**(60/Graphics._fpsMeter.fps);
			if (comboIndicator.opacity <= 5)
				this.removeChild(comboIndicator);
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
			return this._audioPlayer.seek()*1000 + preferences.offset*preferences.playRate;
	} else {
		if (this._resumingCountdown || this._paused)
			return this._lastPos;
		else
			return (performance.now() - this._starting) * preferences.playRate;
	}
};

Scene_Game.prototype._createInaccuracyIndicator = function (inaccuracy) {
	const inaccuracyIndicator = new Sprite(this._inaccuracyBitmap);
	inaccuracyIndicator.anchor.x = 0.5;
	inaccuracyIndicator.anchor.y = 0.5;
	inaccuracyIndicator.x = this._inaccuracyBar.x + 
			this._inaccuracyBar.width/2 * inaccuracy/this._badTolerance;
	inaccuracyIndicator.y = this._inaccuracyBar.y;
	this.addChild(inaccuracyIndicator);
	inaccuracyIndicator.update = () => {
		inaccuracyIndicator.opacity -= 0.5*60/Graphics._fpsMeter.fps;
		if (inaccuracyIndicator.opacity <= 0)
			this.removeChild(inaccuracyIndicator);
	};
};

Scene_Game.prototype._createHitEffect = function (event, judge) {
	const hitEffect = new Sprite(new Bitmap(64, 64));
	let color;
	if (judge === 'perfect')
		color = preferences.perfectColor;
	else if (judge === 'good')
		color = preferences.goodColor;
	else if (judge === 'bad')
		color = preferences.badColor;
	else if (judge === 'miss')
		color = preferences.missColor;
	hitEffect.bitmap.drawCircle(32, 32, preferences.headsRadius, color);
	hitEffect.anchor.x = 0.5;
	hitEffect.anchor.y = 0.5;
	hitEffect.x = event.x;
	const line = this._line1Index === event.lineno ? this._line1 : this._line2;
	hitEffect.y = line.y - TyphmConstants.LINES_HEIGHT / 2 + event.y;
	this.addChild(hitEffect);
	let n = 1;
	hitEffect.update = () => {
		hitEffect.opacity = 255*0.9**(n*60/Graphics._fpsMeter.fps);
		hitEffect.bitmap.drawCircle(32, 32, 32-(32 - preferences.headsRadius)/n, color);
		n++;
		if (hitEffect.opacity <= 5)
			this.removeChild(hitEffect);
	};
};

Scene_Game.prototype._createWrongNote = function (time) {
	const wrongNote = new Sprite(new Bitmap(32, 32));
	wrongNote.bitmap.drawCircle(16, 16, preferences.headsRadius, preferences.excessColor);
	wrongNote.anchor.x = 0.5;
	wrongNote.anchor.y = 0.5;
	wrongNote.x = this._getXFromTime(time);
	wrongNote.y = this._line1.y;
	this.addChild(wrongNote);
	wrongNote.update = () => {
		wrongNote.opacity *= 0.98**(60/Graphics._fpsMeter.fps);
		if (wrongNote.opacity <= 5)
			this.removeChild(wrongNote);
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
	this._markSprite.bitmap.fontSize = 108;
	this._markSprite.bitmap.textColor = this._getScoreColor();
	this._markSprite.bitmap.drawText(this._getMark(), 0, 0, this._markSprite.width, this._markSprite.height, 'right');
	this._summarySprite.bitmap.textColor = preferences.perfectColor;
	this._summarySprite.bitmap.drawText(`${Strings.perfect}: ${this._perfectNumber}`, 0, 0, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.goodColor;
	this._summarySprite.bitmap.drawText(`${Strings.good}: ${this._goodNumber}`, 0, preferences.textHeight, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.badColor;
	this._summarySprite.bitmap.drawText(`${Strings.bad}: ${this._badNumber}`, 0, preferences.textHeight*2, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.missColor;
	this._summarySprite.bitmap.drawText(`${Strings.miss}: ${this._missNumber}`, 0, preferences.textHeight*3, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = preferences.excessColor;
	this._summarySprite.bitmap.drawText(`${Strings.excess}: ${this._excessNumber}`, 0, preferences.textHeight*4, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	this._summarySprite.bitmap.textColor = 'white';
	this._summarySprite.bitmap.drawText(`${Strings.maxCombo}: ${this._maxCombo}`, 0, preferences.textHeight*5, this._summarySprite.bitmap.width, preferences.textHeight, 'left');
	if (this._combo === this._beatmap.notes.length)
		this._fullCombo.visible = true;
	this._judgeLine.visible = false;
	this._line1.visible = false;
	this._line2.visible = false;
	if (this._inaccuraciesArray && this._inaccuraciesArray.length > 0)
		preferences.offset -= this._inaccuraciesArray.reduce((a, b) => a + b) / this._inaccuraciesArray.length;
	this._setButtonsVisible(true);
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
	this._countdown = 3;
	this._lastCountdown = null;
	this._scene = scene;
	this._scene.addChild(this);
};

Scene_Game.Sprite_ResumingCountdown.prototype.update = function () {
	const countdown = Math.ceil(this._countdown);
	if (countdown === 0) {
		this._scene.removeChild(this);
		this._scene.actualResume();
		return;
	}
	if (this._lastCountdown !== countdown) {
		this.bitmap.clear();
		this.bitmap.drawText(Math.ceil(this._countdown), 0, 0, this.width, this.height, 'center');
		this._lastCountdown = countdown;
	}
	this._countdown -= 1 / Graphics._fpsMeter.fps;
};
