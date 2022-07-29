function Level () {
	this.initialize.apply(this, arguments);
}

Level.RELATED_EXPRESSIONS = {
	perfectNumber: function () {
		return this._perfectNumber;
	},
	goodNumber: function () {
		return this._goodNumber;
	},
	badNumber: function () {
		return this._badNumber;
	},
	missNumber: function () {
		return this._missNumber;
	},
	excessNumber: function () {
		return this._excessNumber;
	},
	perfectBig: function () {
		return this._perfectBig;
	},
	goodBig: function () {
		return this._goodBig;
	},
	badBig: function () {
		return this._badBig;
	},
	missBig: function () {
		return this._missBig;
	},
	perfectMeasures: function () {
		return this._perfectMeasures;
	},
	goodMeasures: function () {
		return this._goodMeasures;
	},
	badMeasures: function () {
		return this._badMeasures;
	},
	missMeasures: function () {
		return this._missMeasures;
	},
	score: function () {
		return this.score;
	},
	accuracyRate: function () {
		return this.accuracyRate;
	},
	combo: function () {
		return this.combo
	},
	maxCombo: function () {
		return this.maxCombo
	},
	hp: function () {
		return this.hp
	}
};
Level.MODIFIERS = [
	'playRate',
	'autoPlay',
	'noFail',
	'noBad',
	'noExcess',
	'judgementWindow',
	'autoCompleteHolds'
];
Level.VISUALS = [
	'FCAPIndicator',
	'TPSIndicator',
	'judgementLinePerformances',
	'flashWarningGood',
	'flashWarningMiss',
	'showInaccuracyData',
	'comboPopupInterval',
	'fadeIn',
	'fadeOut',
	'reverseVoices',
	'mirror',
	'mirrorLowerRow',
	'showKeyboard',
	'subtractScore',
	'numbersHUD'
];
Level.PERFECT = 3;
Level.GOOD = 2;
Level.BAD = 1;
Level.MISS = 0;
Level.EXCESS = -1;

Level.prototype.initialize = function (scene, musicUrl, beatmapUrl, recording) {
	this._scene = scene;
	this._musicUrl = musicUrl;
	this._beatmapUrl = beatmapUrl;
	this._recording = recording;
	
	this._setUpRecording();
	this._beatmap = new Beatmap(this._beatmapUrl);
	this.hasMusic = !!this._musicUrl;
	this._initializeJudgeCounters();
	this.combo = 0;
	this.maxCombo = 0;
	this.hp = 1;
	this._holdings = [];
	this._hitsLastSecond = [];
};

Level.prototype.newScene = function () {
	const recording = this._scene.isRecording ? undefined : this.newRecording;
	const retryCount = this._scene.isRecording ? this._scene.retryCount + 1 : this._scene.retryCount;
	return new Scene_Game(this._musicUrl, this._beatmapUrl, recording, retryCount);
};

Level.prototype.newReplayScene = function () {
	return new Scene_Game(this._musicUrl, this._beatmapUrl, this.newRecording, this._scene.retryCount);
};

Level.prototype.progress = function (now) {
	return (now - this._beatmap.start) / this._length;
};

Level.prototype.cutUnclearedEvents = function () {
	const now = this._beatmap.start;
	while (this._unclearedEvents.length > 0 && this._unclearedEvents[0].time < now) {
		const event = this._unclearedEvents.shift();
		this._refreshMeasureStateAfterHitting(event, Level.MISS);
		this._missClear(event);
		this._unclearedHitSounds.shift();
	}
};

Level.prototype._setUpRecording = function () {
	if (this._recording) {
		this._scene.isRecording = false;
		this.newRecording = {
			modifiers: {...this._recording.modifiers},
			hit: [...this._recording.hit],
			loosen: [...this._recording.loosen]
		};
		if (this._recording.visuals)
			this.newRecording.visuals = {...this._recording.visuals};
		this.modifiers = this.newRecording.modifiers;
		if (preferences.recordVisual && this._recording.visuals) {
			this.visuals = this.newRecording.visuals;
		} else {
			this.visuals = {};
			for (const visual of Level.VISUALS)
				this.visuals[visual] = preferences[visual];
		}
	} else {
		this._scene.isRecording = true
		this.modifiers = {};
		for (const modifier of Level.MODIFIERS)
			this.modifiers[modifier] = preferences[modifier];
		this.visuals = {};
		for (const visual of Level.VISUALS)
			this.visuals[visual] = preferences[visual];
		this.newRecording = {modifiers: this.modifiers, hit: [], loosen: []};
		if (preferences.recordVisual)
			this.newRecording.visuals = this.visuals;
	}
};

Level.prototype._initializeJudgeCounters = function () {
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

Level.prototype.initialNow = function () {
	return this._beatmap.start;
};

Level.prototype.title = function () {
	return this._beatmap.title;
};

Level.prototype.row1Bitmap = function () {
	return this._row1.getBitmap();
};

Level.prototype.row2Bitmap = function () {
	return this._row2 && this._row2.getBitmap();
};

Level.prototype.loadBeatmap = async function () {
	InGameText.prepare();
	this._beatmap.prepare(this);
	this._beatmap.setUpExpressionsWithoutXFrom(this.visuals);
	this._beatmap.setUpExpressionsWithoutXFrom(this.modifiers);
	await this._beatmap.load();
	this._beatmap.drawRows(this.visuals.reverseVoices);
	this._beatmap.setMirror(this.visuals.mirror, this.visuals.mirrorLowerRow);
	if (!this.hasMusic && this._beatmap.audioUrl) {
		this.hasMusic = true;
		this._musicUrl = this._beatmap.audioUrl;
	}
	this._offsetWizard = this._beatmap.title === 'offset_wizard' && this.hasMusic;
	this.inaccuraciesArray = [];
	this._lastPos = this._beatmap.start;
	this._preprocessHitEvents();
	this.calculateScore();
	this.clearCombo();
};

Level.prototype.shouldAdjustOffset = function () {
	return this._offsetWizard && this.inaccuraciesArray.length > 0;
};

Level.prototype.adjustOffset = function () {
	preferences.offset -= math.mean(this.inaccuraciesArray);
};

Level.prototype.shouldDisplayInaccuraciesDistribution = function () {
	return this.inaccuraciesArray.length > 0;
};

Level.prototype.getFakeJudgementLines = function () {
	return this._row1.fakeJudgementLines;
};

Level.prototype.getTexts = function () {
	return this._row1.texts;
};

Level.prototype.allEventsFinished = function () {
	return this._unclearedEvents.length === 0 && this._holdings.length === 0;
};

Level.prototype.loadAudio = function () {
	if (this.hasMusic) {
		const audioPlayer = this._scene.audioPlayer = new WebAudio(this._musicUrl);
		audioPlayer.addLoadListener(() => {
			audioPlayer.volume = this._beatmap.volume * preferences.masterVolume * preferences.musicVolume;
			this._length = this._beatmap.length !== 'unknown ' ?
				this._beatmap.length : audioPlayer._totalTime*1000;
			this._postLoadingAudio();
		});
	} else {
		this._length = this._unclearedEvents.last().timeEnd - this._beatmap.start;
		this._postLoadingAudio();
	}
};

Level.prototype._postLoadingAudio = function () {
	const now = this.initialNow();
	const index = this._beatmap.rows.findIndex(row => row.endTime > now);
	this._row1 = this._beatmap.rows[index];
	this._row2 = this._beatmap.rows[index + 1];
	this._scene.postLoadingAudio();
};

Level.prototype.updateHoldings = function (now) {
	while (this._holdings.length > 0) {
		const {event, judge} = this._holdings[0];
		if (now >= event.timeEnd) {
			if (judge === Level.PERFECT) {
				this._perfectClear(event);
			} else if (judge === Level.GOOD) {
				this._goodClear(event);
			}
			this._holdings.shift();
		} else {
			break;
		}
	}
	for (let i = 0; i < this._holdings.length; i++) {
		const {event, judge} = this._holdings[i];
		const xNow = this._scene._getXNow(this._row1.mirror);
		this._beatmap.trackHoldTo(now, xNow, event, judge, this._row1);
	}
};

Level.prototype.getInstantaneousMillisecondsPerWholeAndBeatOffset = function (now) {
	const row = this._row1;
	let millisecondsPerWhole, beatOffset;
	if (preferences.countdownBeats && now < row.endTime) {
		if (now >= row.startTime) {
			const lengthPosition = this._getLengthPositionFromTime(now);
			const derivative = (row.timeFormula(lengthPosition + 1e-4) - row.timeFormula(lengthPosition - 1e-4)) / 2e-4;
			millisecondsPerWhole = derivative * row.totalTime / row.totalLength.valueOf();
			beatOffset = (lengthPosition * row.totalLength.valueOf() % 0.25) * millisecondsPerWhole;
		} else {
			const derivative = (row.timeFormula(1e-4) - row.timeFormula(0)) / 1e-4;
			millisecondsPerWhole = derivative * row.totalTime / row.totalLength.valueOf();
			const millisecondsPerQuarter = millisecondsPerWhole / 4;
			beatOffset = millisecondsPerQuarter - (row.startTime - now) % millisecondsPerQuarter;
		}
	}
	return [millisecondsPerWhole, beatOffset];
};

Level.prototype.modifiersListString = function () {
	const modifiersTexts = [];
	for (const modifier in this.modifiers) {
		if (this.modifiers[modifier] !== Scene_Preferences.DEFAULT_PREFERENCES[modifier])
			modifiersTexts.push(sprintf(Strings['inGame_' + modifier], this.modifiers[modifier]));
	}
	return modifiersTexts.join(', ');
};

Level.prototype._processAndRecordLoosen = function (time, key) {
	this._processLoosen(time);
	this.newRecording.loosen.push({'time': time, 'key': key});
};

Level.prototype._processAndRecordHit = function (time, key) {
	this._processHit(time);
	this.newRecording.hit.push({'time': time, 'key': key});
};

Level.prototype._hitSoundEnabled = function () {
	return !!(preferences.enableHitSound && !this._offsetWizard);
};

Level.prototype._hitSoundWithMusic = function () {
	return this._hitSoundEnabled() && (this.modifiers.autoPlay || preferences.hitSoundWithMusic);
};

Level.prototype.autoPlayUpdateAndProcessMiss = function (now) {
	while (this._unclearedEvents.length > 0) {
		const event = this._unclearedEvents[0];
		if (now >= event.time) {
			if (this.modifiers.autoPlay) {// && now <= event.time + this.perfectTolerance * this.modifiers.judgementWindow) {
				this._perfectHit();
				if (this.visuals.TPSIndicator)
					this._hitsLastSecond.push(now);
			} else if (now >= event.time + this.missBoundary() * this.modifiers.judgementWindow) {
				this._missHit();
			} else
				break;
		} else
			break;
	}
};

Level.getColorFromJudge = function (judge) {
	if (judge === Level.PERFECT)
		return preferences.perfectColor;
	else if (judge === Level.GOOD)
		return preferences.goodColor;
	else if (judge === Level.BAD)
		return preferences.badColor;
	else if (judge === Level.MISS)
		return preferences.missColor;
	else if (judge === Level.EXCESS)
		return preferences.excessColor;
};

Level.prototype.getCurrentTPS = function (now) {
	while ((now - this._hitsLastSecond[0]) / this.modifiers.playRate > 1000)
		this._hitsLastSecond.shift();
	return this._hitsLastSecond.length;
};

Level.prototype._playHitSound = function () {
	const player = new WebAudio('/assets/audios/hit_sounds/' + preferences.hitSound);
	player.volume = preferences.hitSoundVolume * preferences.masterVolume;
	player.addLoadListener(player.play.bind(player));
};

Level.prototype.updateHitSoundWithMusic = function (now) {
	const offsetNow = now - preferences.offset * this.modifiers.playRate;
	while (this._unclearedHitSounds.length > 0) {
		const event = this._unclearedHitSounds[0];
		if (offsetNow >= event.time - TyphmConstants.HIT_SOUND_ADVANCE*this.modifiers.playRate) {
			if (offsetNow <= event.time + this.perfectTolerance) {
				setTimeout(() => this._playHitSound(), (event.time - offsetNow)/this.modifiers.playRate);
			}
			this._unclearedHitSounds.shift();
		} else
			break;
	}
};

Level.prototype.shouldFinish = function (now) {
	return now >= this._beatmap.start + this._length;
};

Level.prototype.incrementHp = function (judge) {
	switch (judge) {
		case Level.PERFECT:
			this.hp += this.perfectHp;
			break;
		case Level.GOOD:
			this.hp += this.goodHp;
			break;
		case Level.BAD:
			this.hp += this.badHp;
			break;
		case Level.MISS:
			this.hp += this.missHp;
			break;
		case Level.EXCESS:
			this.hp += this.excessHp;
			break;
	}
	if (this.hp > 1)
		this.hp = 1;
	if (this.hp < 0) {
		this.hp = 0;
		this.failed = true;
	}
};

Level.prototype._perfectHit = function () {
	const event = this._unclearedEvents.shift();
	this._refreshMeasureStateAfterHitting(event, Level.PERFECT);
	if (this._hitSoundEnabled() && !preferences.hitSoundWithMusic)
		this._playHitSound();
	if (event.hold) {
		this._holdings.push({'event': event, judge: Level.PERFECT});
		this._holdings.sort((a, b) => a.event.timeEnd - b.event.timeEnd);
	} else {
		this._perfectClear(event);
	}
	this._scene._createHitEffect(event, Level.PERFECT);
};

Level.prototype._perfectClear = function (event) {
	this.incrementHp(Level.PERFECT);
	this._beatmap.clearNote(event, Level.PERFECT);
	this._perfectNumber++;
	if (event.big)
		this._perfectBig++;
	this.calculateScore();
	this.incrementCombo();
	this.numbersUpdated = true;
};

Level.prototype._goodHit = function () {
	const event = this._unclearedEvents.shift();
	this._refreshMeasureStateAfterHitting(event, Level.GOOD);
	if (this._hitSoundEnabled() && !preferences.hitSoundWithMusic)
		this._playHitSound();
	this._scene._onDestinedGood();
	if (event.hold) {
		this._holdings.push({'event': event, judge: Level.GOOD});
		this._holdings.sort((a, b) => a.event.timeEnd - b.event.timeEnd);
	} else {
		this._goodClear(event);
	}
	this._scene._createHitEffect(event, Level.GOOD);
};

Level.prototype._goodClear = function (event) {
	this._beatmap.clearNote(event, Level.GOOD);
	this._goodNumber++;
	if (event.big)
		this._goodBig++;
	this.calculateScore();
	this.incrementCombo();
	this.numbersUpdated = true;
};

Level.prototype._refreshMeasureStateAfterHitting = function (event, judge) {
	this._currentMeasureJudge = Math.min(judge, this._currentMeasureJudge);
	if (event.isLastInMeasure)
		this._clearMeasure();
};

Level.prototype._badHit = function () {
	const event = this._unclearedEvents.shift();
	this._refreshMeasureStateAfterHitting(event, Level.BAD);
	this._scene._onDestinedBad();
	this._badClear(event);
	this._scene._createHitEffect(event, Level.BAD);
};

Level.prototype._badClear = function (event) {
	this._badNumber++;
	if (event.big)
		this._badBig++;
	this.calculateScore();
	this.clearCombo();
	this._beatmap.clearNote(event, Level.BAD);
	this.numbersUpdated = true;
};

Level.prototype.updateRecordingApply = function (now, pressings) {
	while (this._recording.hit.length > 0) {
		const {time, key} = this._recording.hit[0];
		if (now >= time) {
			this._processHit(time);
			pressings[key] = true;
			this._recording.hit.shift();
		} else
			break;
	}
	while (this._recording.loosen.length > 0) {
		const {time, key} = this._recording.loosen[0];
		if (now >= time) {
			this._processLoosen(time);
			delete pressings[key];
			this._recording.loosen.shift();
		} else
			break;
	}
};

Level.prototype._processHit = function (now) {
	if (this.visuals.TPSIndicator)
		this._hitsLastSecond.push(now);
	while (this._unclearedEvents.length > 0) {
		const event = this._unclearedEvents[0];
		if (now >= event.time - this.missBoundary() * this.modifiers.judgementWindow) {
			const inaccuracy = now - event.time;
			const judge = this.getJudgeFromInaccuracy(inaccuracy);
			if (judge === Level.PERFECT)
				this._perfectHit();
			else if (judge === Level.GOOD)
				this._goodHit();
			else if (judge === Level.BAD && !this.modifiers.noBad)
				this._badHit();
			else {
				this._missHit();
				continue;
			}
			this.inaccuraciesArray.push(inaccuracy / this.modifiers.playRate);
			this._scene._createInaccuracyIndicator(inaccuracy);
		} else if (!this.modifiers.noExcess) {
			this._excessHit(now);
		}
		break;
	}
};

Level.prototype._excessHit = function (now) {
	this._scene._createWrongNote(now);
	this.clearCombo();
	this._excessNumber++;
	this._scene._onDestinedExcess();
	this.calculateScore();
};

Level.prototype._processLoosen = function (now) {
	if (!this.modifiers.autoCompleteHolds && Object.keys(this._scene._pressings).length < this._holdings.length) {
		const {event, judge} = this._holdings.shift();
		if (now < event.timeEnd - this.goodTolerance * this.modifiers.judgementWindow) {
			this._scene._onDestinedMiss();
			this._missClear(event);
		} else if (judge === Scene_Game.PERFECT) {
			this._perfectClear(event);
		} else if (judge === Scene_Game.GOOD) {
			this._goodClear(event);
		}
	}
};

Level.prototype._missHit = function () {
	const event = this._unclearedEvents.shift();
	this._refreshMeasureStateAfterHitting(event, Level.MISS);
	this._scene._onDestinedMiss();
	this._missClear(event);
};

Level.prototype._missClear = function (event) {
	this._beatmap.clearNote(event, Level.MISS);
	this._missNumber++;
	if (event.big)
		this._missBig++;
	this.calculateScore();
	this.clearCombo();
	this.numbersUpdated = true;
};

Level.prototype.missBoundary = function () {
	return this.modifiers.noBad ? this.goodTolerance : this.badTolerance;
};

Level.prototype.calculateScore = function () {
	if (this.visuals.subtractScore) {
		this.score = Math.floor(500000 * (
			(
				this._totalNotes+this._totalBig-this._goodNumber-this._badNumber-this._missNumber-this._goodBig-this._badBig-this._missBig +
				(this._goodNumber+this._goodBig)/4 - this._excessNumber
			) / (this._totalNotes + this._totalBig) + (
				this._totalMeasures-this._goodMeasures-this._badMeasures-this._missMeasures + this._goodMeasures/2
			) / this._totalMeasures
		));
	} else {
		this.score = Math.floor(500000 * (
			(
				this._perfectNumber+this._perfectBig + (this._goodNumber+this._goodBig)/4 - this._excessNumber
			) / (this._totalNotes + this._totalBig) + (
				this._perfectMeasures + this._goodMeasures/2
			) / this._totalMeasures
		));
	}
	if (this.shouldDrawAccuracyRate())
		this.accuracyRate = (this._perfectNumber + this._goodNumber/4 - this._excessNumber)/(this._perfectNumber + this._goodNumber + this._badNumber + this._missNumber);
	this.scoreUpdated = true;
};

Level.prototype.shouldDrawAccuracyRate = function () {
	return this._unclearedEvents && this._unclearedEvents.length !== this._beatmap.notes.length;
};

Level.prototype.incrementCombo = function () {
	this.combo++;
	if (this.combo > this.maxCombo)
		this.maxCombo = this.combo;
	this.comboUpdated = true;
};

Level.prototype.clearCombo = function () {
	this.combo = 0;
	this.comboUpdated = true;
};

Level.prototype.shouldPopUpCombo = function () {
	return this.visuals.comboPopupInterval && this.combo > 0 && this.combo % this.visuals.comboPopupInterval === 0;
};

Level.prototype.isAP = function () {
	return this._goodNumber === 0 && this._badNumber === 0 && this._missNumber === 0 && this._excessNumber === 0;
};

Level.prototype.isFC = function () {
	return this._badNumber === 0 && this._missNumber === 0 && this._excessNumber === 0;
};

Level.prototype._preprocessHitEvents = function () {
	this._unclearedEvents = [...this._beatmap.notes];
	this._unclearedHitSounds = [...this._beatmap.notes];
	this._totalMeasures = 0;
	this._totalNotes = this._unclearedEvents.length;
	for (let i = 0, j = 0; i < this._beatmap.barLines.length && j < this._totalNotes; i++, j++) {
		const barlineTime = this._beatmap.barLines[i].time;
		if (barlineTime <= this._unclearedEvents[j].time)
			continue;
		while (j < this._totalNotes - 1 && this._unclearedEvents[j + 1].time < barlineTime) {
			this._unclearedEvents[j].isLastInMeasure = false;
			j++;
		}
		this._unclearedEvents[j].isLastInMeasure = true;
		this._totalMeasures++;
	}
	this._currentMeasureJudge = Level.PERFECT;
	this._totalBig = this._beatmap.notes.reduce((bigCount, event) => bigCount + (event.big ? 1 : 0), 0);
};

Level.prototype.getJudgeFromInaccuracy = function (inaccuracy) {
	const absInaccuracy = Math.abs(inaccuracy);
	if (absInaccuracy <= this.perfectTolerance * this.modifiers.judgementWindow)
		return Level.PERFECT;
	if (absInaccuracy <= this.goodTolerance * this.modifiers.judgementWindow)
		return Level.GOOD;
	if (absInaccuracy <= this.badTolerance * this.modifiers.judgementWindow)
		return Level.BAD;
	return Level.MISS;
};

Level.prototype.getHitEffectX = function (event) {
	let result = event.hitX;
	if (this._beatmap.rows[event.rowIndex].mirror)
		result = Graphics.width - result;
	return result;
};

Level.prototype.isInRow1Position = function (event) {
	return event.rowIndex % 2 === this._row1.index % 2;
};

Level.prototype._getLengthPositionFromTime = function (time) {
	const row = this._row1;
	if (!row || !row.timeFormula)
		return 0;
	const timePosition = (time - row.startTime) / row.totalTime;
	let min = 0, max = 1;
	let lengthPosition;
	while (max - min > 1e-6) {
		lengthPosition = (min + max) / 2;
		if (row.timeFormula(lengthPosition) > timePosition) {
			max = lengthPosition;
		} else if (row.timeFormula(lengthPosition) === timePosition) {
			break;
		} else {
			min = lengthPosition;
		}
	}
	return lengthPosition;
};

Level.prototype._getXFromLengthPosition = function (lengthPosition) {
	return preferences.margin + this._row1.judgementLine.xFormula(lengthPosition) * (Graphics.width - 2*preferences.margin);
};

Level.prototype._getNoteXFromLengthPosition = function (lengthPosition) {
	return preferences.margin + this._row1.noteXFormula(lengthPosition) * (Graphics.width - 2*preferences.margin);
};

Level.prototype._getXFromTime = function (time) {
	return this._getXFromLengthPosition(this._getLengthPositionFromTime(time));
};

Level.prototype._getNoteXFromTime = function (time) {
	let result = this._getNoteXFromLengthPosition(this._getLengthPositionFromTime(time));
	if (this._row1.mirror)
		result = Graphics.width - result;
	return result;
};

Level.prototype._clearMeasure = function () {
	if (this._currentMeasureJudge === Level.PERFECT)
		this._perfectMeasures++;
	else if (this._currentMeasureJudge === Level.GOOD)
		this._goodMeasures++;
	else if (this._currentMeasureJudge === Level.BAD)
		this._badMeasures++;
	else if (this._currentMeasureJudge === Level.MISS)
		this._missMeasures++;
	this._currentMeasureJudge = Level.PERFECT;
};

Level.prototype.perfectNumberString = function () {
	return `${this._perfectNumber} (${this._perfectMeasures})`;
};

Level.prototype.goodNumberString = function () {
	return `${this._goodNumber} (${this._goodMeasures})`;
};

Level.prototype.badNumberString = function () {
	return `${this._badNumber} (${this._badMeasures})`;
};

Level.prototype.missNumberString = function () {
	return `${this._missNumber} (${this._missMeasures})`;
};

Level.prototype.excessNumberString = function () {
	return `${this._excessNumber}`;
};

Level.prototype.getMark = function () {
	if (this.failed) {
		return Strings.markG;
	} else if (this.accuracyRate >= 1) {
		return Strings.markP;
	} else if (this.accuracyRate >= 0.95) {
		return Strings.markS;
	} else if (this.accuracyRate >= 0.9) {
		return Strings.markA;
	} else if (this.accuracyRate >= 0.8) {
		return Strings.markB;
	} else if (this.accuracyRate >= 0.7) {
		return Strings.markC;
	} else if (this.accuracyRate >= 0.6) {
		return Strings.markD;
	} else if (this.accuracyRate >= 0.5) {
		return Strings.markE;
	} else {
		return Strings.markF;
	}
};

Level.prototype.getScoreColor = function () {
	if (this.visuals.FCAPIndicator) {
		if (this.isAP()) {
			return preferences.perfectColor;
		} else if (this.isFC()) {
			return preferences.goodColor;
		} else {
			return preferences.textColor;
		}
	} else {
		return preferences.textColor;
	}
};

Level.prototype.shouldSwitchRow = function (now) {
	return now >= this._row1.endTime;
};

Level.prototype.switchRow = function () {
	[this._row1, this._row2] = [this._row2, this._beatmap.rows[this._row1.index + 2]];
};

Level.prototype.setUpMirror = function (row1Sprite, row2Sprite) {
	row1Sprite.scale.x = this._row1.mirror ? -1 : 1;
	if (this._row2)
		row2Sprite.scale.x = this._row2.mirror ? -1 : 1;
};

Level.prototype.hasRowsLeft = function () {
	return this._row1 !== undefined;
};

Level.prototype.setUpNewRow = function () {
	const row = this._row1;
	this._beatmap.currentRow = row;
	const rowLengthInMilliseconds = row.endTime - row.startTime;
	if (row.perfect)
		this.perfectWindowRatio = row.perfect;
	else
		this.perfectWindowRatio ||= TyphmConstants.DEFAULT_PERFECT;
	if (row.good)
		this.goodWindowRatio = row.good;
	else
		this.goodWindowRatio ||= TyphmConstants.DEFAULT_GOOD;
	if (row.bad)
		this.badWindowRatio = row.bad;
	else
		this.badWindowRatio ||= TyphmConstants.DEFAULT_BAD;
	this.perfectTolerance = this.perfectWindowRatio * rowLengthInMilliseconds;
	this.goodTolerance = this.goodWindowRatio * rowLengthInMilliseconds;
	this.badTolerance = this.badWindowRatio * rowLengthInMilliseconds;
	if (row.perfectHp !== undefined)
		this.perfectHp = row.perfectHp;
	else if (this.perfectHp === undefined)
		this.perfectHp = TyphmConstants.DEFAULT_PERFECT_HP;
	if (row.goodHp !== undefined)
		this.goodHp = row.goodHp;
	else if (this.goodHp === undefined)
		this.goodHp = TyphmConstants.DEFAULT_GOOD_HP;
	if (row.badHp !== undefined)
		this.badHp = row.badHp;
	else if (this.badHp === undefined)
		this.badHp = TyphmConstants.DEFAULT_BAD_HP;
	if (row.missHp !== undefined)
		this.missHp = row.missHp;
	else if (this.missHp === undefined)
		this.missHp = TyphmConstants.DEFAULT_MISS_HP;
	if (row.excessHp !== undefined)
		this.excessHp = row.excessHp;
	else if (this.excessHp === undefined)
		this.excessHp = TyphmConstants.DEFAULT_EXCESS_HP;
};
