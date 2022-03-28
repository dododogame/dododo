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
	this._loading = new Sprite(new Bitmap(120, TyphmConstants.TEXT_HEIGHT));
	this._center(this._loading, 300);
	this._loading.bitmap.drawText('Loading...', 0, 0, 120, TyphmConstants.TEXT_HEIGHT, 'white');
	this.addChild(this._loading);

	this._pauseButton = new Button(new Bitmap(30, 32), () => { this._pause(); });
	this._pauseButton.y = (TyphmConstants.TEXT_HEIGHT - 32) / 2;
	this._pauseButton.bitmap.fillRect(6, 4, 6, 24, 'white');
	this._pauseButton.bitmap.fillRect(18, 4, 6, 24, 'white');
	this._pauseButton.visible = false;
	this.addChild(this._pauseButton);

	this._back = new Button(new Bitmap(128, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldBack = true; });
	this._back.bitmap.drawText('Back (b)', 0, 0, 128, TyphmConstants.TEXT_HEIGHT, 'center');
	this._back.x = 30;
	this.addChild(this._back);

	this._restart = new Button(new Bitmap(128, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldRestart = true });
	this._restart.bitmap.drawText('Restart (r)', 0, 0, 128, TyphmConstants.TEXT_HEIGHT, 'center');
	this._restart.x = 30+128;
	this.addChild(this._restart);

	this._title = new Sprite(new Bitmap(Graphics.width - (32+128+128+64),
			TyphmConstants.TEXT_HEIGHT));
	this._title.x = 32+128+128;
	this.addChild(this._title);

	this._setButtonsVisible(false);

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

	this._judgeLine = new Sprite(new Bitmap(1, 256));
	this._judgeLine.bitmap.fillAll('white');
	this._judgeLine.anchor.y = 0.5;
	this._judgeLine.visible = false;
	this.addChild(this._judgeLine);

	this._scoreSprite = new Sprite(new Bitmap(256, TyphmConstants.TEXT_HEIGHT));
	this._scoreSprite.anchor.x = 1;
	this._scoreSprite.x = Graphics.width;
	this.addChild(this._scoreSprite);

	this._comboSprite = new Sprite(new Bitmap(128, TyphmConstants.TEXT_HEIGHT));
	this._comboSprite.anchor.y = 1;
	this._comboSprite.y = Graphics.height;
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

	this._fullCombo = new Sprite(new Bitmap(60, TyphmConstants.TEXT_HEIGHT));
	this._fullCombo.anchor.y = 1;
	this._fullCombo.y = Graphics.height;
	this._fullCombo.x = 80;
	this._fullCombo.bitmap.drawText('FC', 0, 0, 60, TyphmConstants.TEXT_HEIGHT, 'center');
	this._fullCombo.visible = false;
	this.addChild(this._fullCombo);

	this._inaccuracyBar = new Sprite(new Bitmap(512, 10));
	this._inaccuracyBar.anchor.y = 0.5;
	this._center(this._inaccuracyBar, Graphics.height - 20);
	this._drawInaccuracyBar(TyphmConstants.DEFAULT_PERFECT, TyphmConstants.DEFAULT_GOOD, TyphmConstants.DEFAULT_BAD);
	this.addChild(this._inaccuracyBar);

	this._inaccuracyBitmap = new Bitmap(3, 16);
	this._inaccuracyBitmap.fillAll('white');

	this._progressIndicator = new Sprite(new Bitmap(Graphics.width, 1));
	this._progressIndicator.bitmap.fillAll('white');
	this._progressIndicator.anchor.x = 1;
	this.addChild(this._progressIndicator);

	if (preferences.autoPlay) {
		this._autoPlayIndicator = new Sprite(new Bitmap(256, TyphmConstants.TEXT_HEIGHT));
		this._autoPlayIndicator.anchor.y = 0.5;
		this._autoPlayIndicator.y = Graphics.height / 2;
		this._autoPlayIndicator.bitmap.drawText('Auto-playing', 0, 0, 256, TyphmConstants.TEXT_HEIGHT, 'left');
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

	this._lastX = 16;
	this._lastTime = 0.0;

	this._line1Index = 0;
	this._line2Index = 1;

	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
	this._blurEventListener = this._onBlur.bind(this);
	window.addEventListener('blur', this._blurEventListener);
	this._touchStartEventListener = this._onTouchStart.bind(this);
	document.addEventListener('touchstart', this._touchStartEventListener);

	this._resumingCountdown = null;

	this._loadingFinished = false;
	this._offsetWizard = false;
	this._onLoad();

	this._shouldRestart = false;
	this._shouldBack = false;
};

Scene_Game.prototype._drawInaccuracyBar = function (perfect, good, bad) {
	this._inaccuracyBar.bitmap.fillRect(0, 0, 512, 10, 'green');
	this._inaccuracyBar.bitmap.fillRect(256*(1-good/bad), 0, 512*good/bad, 10, 'blue');
	this._inaccuracyBar.bitmap.fillRect(256*(1-perfect/bad), 0, 512*perfect/bad, 10, 'yellow');
}

Scene_Game.prototype.update = function () {
	if (!this._resumingCountdown && !this._paused && !this._ended) {
		const now = this._now();
		this._progressIndicator.x = Graphics.width*Math.min((now-this._beatmap.start)/this._length,1);
		this._judgeLine.x = this._getXFromTime(now);
		this._judgeLine.y = this._line1.y;
		let i = 0;
		while (true) {
			const event = this._unclearedEvents[i];
			if (!event)
				break;
			if (now < event.time)
				break;
			if (preferences.autoPlay && now >= event.time) {
				this._beatmap.clearNote(event, 'perfect');
				this._createHitEffect(event, 'perfect');
				this._combo++;
				this._updateCombo();
				this._perfectNumber++;
				this._updateScore();
				this._unclearedEvents.splice(i, 1);
			} else if (now >= event.time + this._badTolerance*preferences.playRate) {
				this._beatmap.clearNote(event, 'miss');
				this._missNumber++;
				this._combo = 0;
				this._updateCombo();
				this._unclearedEvents.splice(i, 1);
			} else
				i++;
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
		if (this._hasMusic) {
			if (this._beatmap.end && now >= this._beatmap.end)
				this._finish();
		} else {
			if (this._unclearedEvents.length === 0)
				this._finish();
		}
	}
	if (this._shouldRestart) {
		window.scene = new Scene_Game(this._musicUrl, this._beatmapUrl);
	}
	if (this._shouldBack) {
		window.scene = new Scene_Title();
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Game.prototype._setUpNewLine = function () {
	this._lastX = TyphmConstants.MARGIN;
	const line = this._line1.bitmap;
	this._lastTime = line.startTime;
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
	this._millisecondsPerPixel = lineLengthInMilliseconds / (Graphics.width - 2*TyphmConstants.MARGIN);
	this._drawInaccuracyBar(this._perfectTolerance, this._goodTolerance, this._badTolerance);
}

Scene_Game.prototype.stop = function () {
	document.removeEventListener('keydown', this._keydownEventListener);
	window.removeEventListener('blur', this._blurEventListener);
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
	this._title.bitmap.drawText(this._beatmap.title, 0, 0, this._title.width,
			TyphmConstants.TEXT_HEIGHT, 'center');
	this._updateScore();
	this._updateCombo();
	this._unclearedEvents = [...this._beatmap.notes];
	if (this._hasMusic) {
		this._audioPlayer = new WebAudio(this._musicUrl);
		this._audioPlayer.addLoadListener(() => {
			this._audioPlayer.volume = this._beatmap.volume;
			this._length = this._beatmap.length !== 'unknown ' ?
					this._beatmap.length : this._audioPlayer._totalTime*1000;
			this._postLoadingAudio();
		});
		this._audioPlayer.addStopListener(this._onStop.bind(this));
	} else {
		this._length = this._beatmap.events[this._beatmap.events.length - 1].time - this._beatmap.start;
		this._postLoadingAudio();
	}
};

Scene_Game.prototype._postLoadingAudio = function () {
	this._pauseButton.visible = true;
	this._loading.visible = false;
	this._line1.bitmap = this._beatmap.lines[this._line1Index];
	this._line2.bitmap = this._beatmap.lines[this._line2Index];
	this._loadingFinished = true;
	this._setUpNewLine();
	this._resume();
}

Scene_Game.prototype._onBlur = function () {
	if (!this._paused)
		this._pause();
};

Scene_Game.prototype._onStop = function () {
	if (this._activeEnding) {
		this._activeEnding = false;
	} else
		this._finish();
};

Scene_Game.prototype._pause = function () {
	if (this._paused) {
		this._resume();
	} else {
		this._lastPos = this._now();
		this._paused = true;
		this._setButtonsVisible(true);
		this._activeEnding = true;
		if (this._resumingCountdown)
			this.removeChild(this._resumingCountdown);
		if (this._hasMusic) {
			this._audioPlayer.stop();
			this._audioPlayer.addStopListener(this._onStop.bind(this));
		}
	}
};

Scene_Game.prototype._resume = function () {
	if (!this._loadingFinished)
		return;
	this._paused = false;
	this._setButtonsVisible(false);
	if (!this._ended) {
		if (preferences.countdown)
			this._resumingCountdown = new Scene_Game.Sprite_ResumingCountdown(this);
		else
			this.actualResume();
	}
};

Scene_Game.prototype.actualResume = function () {
	this._resumingCountdown = null;
	this._judgeLine.visible = true;
	if (this._hasMusic) {
		this._audioPlayer.play(false, this._lastPos/1000);
		this._audioPlayer.pitch = preferences.playRate;
	} else {
		this._starting = performance.now() - this._lastPos/preferences.playRate;
	}
}

Scene_Game.prototype._onKeydown = function (event) {
	if (event.key ==='Escape') {
		this._pause();
	} else if (this._paused) {
		if (event.key === 'r') {
			this._shouldRestart = true;
		} else if (event.key === 'b') {
			this._shouldBack = true;
		}
	} else if (!preferences.autoPlay) {
		this._processHit();
	}
};

Scene_Game.prototype._onTouchStart = function (event) {
	if (!this._paused && !preferences.autoPlay)
		this._processHit();
}

Scene_Game.prototype._processHit = function () {
	const now = this._now();
	if (!this._ended) {
		const event = this._unclearedEvents[0];
		if (now >= event.time - this._badTolerance*preferences.playRate) {
			if (this._inaccuraciesArray) {
				this._inaccuraciesArray.push(now - event.time);
			}
			const inaccuracy = (now - event.time)/preferences.playRate;
			let judge;
			if (Math.abs(inaccuracy) <= this._perfectTolerance) {
				judge = 'perfect';
				this._perfectNumber++;
				this._combo++;
			} else if (Math.abs(inaccuracy) <= this._goodTolerance) {
				judge = 'good';
				this._goodNumber++;
				this._combo++;
			} else {
				judge = 'bad';
				this._badNumber++;
				this._combo = 0;
			}
			this._beatmap.clearNote(event, judge);
			this._unclearedEvents.splice(0, 1);
			this._updateScore();
			this._updateCombo();
			this._createInaccuracyIndicator(inaccuracy);
			this._createHitEffect(event, judge);
		} else {
			this._createWrongNote(now);
			this._combo = 0;
			this._updateCombo();
			this._excessNumber++;
			this._updateScore();
		}
	}
}

Scene_Game.prototype._updateScore = function () {
	this._scoreSprite.bitmap.clear();
	this._score = Math.round((this._perfectNumber + this._goodNumber/4 - this._excessNumber)*1000000/this._beatmap.notes.length);
	this._scoreSprite.bitmap.drawText(this._score, 0, 0, 256, TyphmConstants.TEXT_HEIGHT, 'right');
};

Scene_Game.prototype._updateCombo = function () {
	if (this._combo > this._maxCombo) {
		this._maxCombo = this._combo;
	}
	this._comboSprite.bitmap.clear();
	this._comboSprite.bitmap.drawText(this._combo, 0, 0, 128, TyphmConstants.TEXT_HEIGHT, 'left');
	if (this._combo > 0 && this._combo % 25 === 0) {
		const comboIndicator = new Sprite(new Bitmap(512, 128));
		comboIndicator.bitmap.fontSize = 108;
		comboIndicator.bitmap.textColor = 'gray';
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
		color = 'yellow';
	else if (judge === 'good')
		color = 'blue';
	else if (judge === 'bad')
		color = 'green';
	else if (judge === 'miss')
		color = 'red';
	hitEffect.bitmap.drawCircle(32, 32, 5, color);
	hitEffect.anchor.x = 0.5;
	hitEffect.anchor.y = 0.5;
	hitEffect.x = event.x;
	const line = this._line1Index === event.lineno ? this._line1 : this._line2;
	hitEffect.y = line.y - TyphmConstants.LINES_HEIGHT / 2 + event.y;
	this.addChild(hitEffect);
	let n = 1;
	hitEffect.update = () => {
		hitEffect.opacity = 255*0.9**(n*60/Graphics._fpsMeter.fps);
		hitEffect.bitmap.drawCircle(32, 32, 32-27/n, color);
		n++;
		if (hitEffect.opacity <= 5)
			this.removeChild(hitEffect);
	};
};

Scene_Game.prototype._createWrongNote = function (time) {
	const wrongNote = new Sprite(new Bitmap(32, 32));
	wrongNote.bitmap.drawCircle(16, 16, 6, 'red');
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

Scene_Game.prototype._getXFromTime = function (time) {
	return this._lastX + (time - this._lastTime) / this._millisecondsPerPixel;
};

Scene_Game.prototype._setButtonsVisible = function (visibility) {
	this._back.visible = visibility;
	this._restart.visible = visibility;
};

Scene_Game.prototype._finish = function () {
	this._ended = true;
	let mark;
	if (this._score >= 1000000) {
		mark = 'P';
	} else if (this._score >= 950000) {
		mark = 'S';
	} else if (this._score >= 900000) {
		mark = 'A';
	} else if (this._score >= 800000) {
		mark = 'B';
	} else if (this._score >= 700000) {
		mark = 'C';
	} else if (this._score >= 600000) {
		mark = 'D';
	} else if (this._score >= 500000) {
		mark = 'E';
	} else {
		mark = 'F';
	}
	this._markSprite.bitmap.fontSize = 108;
	this._markSprite.bitmap.drawText(mark, 0, 0, this._markSprite.width, this._markSprite.height, 'right');
	this._summarySprite.bitmap.textColor = 'yellow';
	this._summarySprite.bitmap.drawText(`Perfect: ${this._perfectNumber}`, 0, 0, this._summarySprite.bitmap.width, TyphmConstants.TEXT_HEIGHT, 'left');
	this._summarySprite.bitmap.textColor = 'blue';
	this._summarySprite.bitmap.drawText(`Good: ${this._goodNumber}`, 0, TyphmConstants.TEXT_HEIGHT, this._summarySprite.bitmap.width, TyphmConstants.TEXT_HEIGHT, 'left');
	this._summarySprite.bitmap.textColor = 'green';
	this._summarySprite.bitmap.drawText(`Bad: ${this._badNumber}`, 0, TyphmConstants.TEXT_HEIGHT*2, this._summarySprite.bitmap.width, TyphmConstants.TEXT_HEIGHT, 'left');
	this._summarySprite.bitmap.textColor = 'red';
	this._summarySprite.bitmap.drawText(`Miss: ${this._missNumber}`, 0, TyphmConstants.TEXT_HEIGHT*3, this._summarySprite.bitmap.width, TyphmConstants.TEXT_HEIGHT, 'left');
	this._summarySprite.bitmap.textColor = 'red';
	this._summarySprite.bitmap.drawText(`Excess: ${this._excessNumber}`, 0, TyphmConstants.TEXT_HEIGHT*4, this._summarySprite.bitmap.width, TyphmConstants.TEXT_HEIGHT, 'left');
	this._summarySprite.bitmap.textColor = 'white';
	this._summarySprite.bitmap.drawText(`Max combo: ${this._maxCombo}`, 0, TyphmConstants.TEXT_HEIGHT*5, this._summarySprite.bitmap.width, TyphmConstants.TEXT_HEIGHT, 'left');
	if (this._combo === this._beatmap.notes.length)
		this._fullCombo.visible = true;
	this._judgeLine.visible = false;
	if (this._inaccuraciesArray)
		preferences.offset -= this._inaccuraciesArray.reduce((a, b) => a + b) / this._inaccuraciesArray.length;
	this._pause();
};

Scene_Game.Sprite_ResumingCountdown = function () {
	this.initialize.apply(this, arguments);
};

Scene_Game.Sprite_ResumingCountdown.prototype = Object.create(Sprite.prototype);
Scene_Game.Sprite_ResumingCountdown.prototype.constructor = Scene_Game.Sprite_ResumingCountdown;

Scene_Game.Sprite_ResumingCountdown.prototype.initialize = function (scene) {
	Sprite.prototype.initialize.call(this, new Bitmap(256, 512));
	this.anchor.x = 0.5;
	this.anchor.y = 0.5;
	this.x = Graphics.width / 2;
	this.y = Graphics.height / 2;
	this.bitmap.fontSize = 200;
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
		this.bitmap.drawText(Math.ceil(this._countdown), 0, 0, 256, 512, 'center');
		this._lastCountdown = countdown;
	}
	this._countdown -= 1 / Graphics._fpsMeter.fps;
};
