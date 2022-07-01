function Level () {
	this.initialize.apply(this, arguments);
}

Level.RELATED_EXPRESSIONS = {
	perfectNumber: function () {
		return this._perfectNumber;
	}
};
Level.MODIFIERS = [
	'playRate',
	'autoPlay',
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
Level.EXCEESS = -1;

Level.prototype.initialize = function (scene, musicUrl, beatmapUrl, recording) {
	this._scene = scene;
	this._musicUrl = musicUrl;
	this._beatmapUrl = beatmapUrl;
	this._recording = recording;
	
	this._setUpRecording();
	this._beatmap = new Beatmap(this._beatmapUrl);
	this._hasMusic = !!this._musicUrl;
	this._ended = false;
	this._initializeJudgeCounters();
	this.combo = 0;
	this.maxCombo = 0;
	this._holdings = [];
	this._hitsLastSecond = [];
};

Level.prototype._setUpRecording = function () {
	if (this._recording) {
		this._isRecording = false;
		this._newRecording = {
			modifiers: {...this._recording.modifiers},
			hit: [...this._recording.hit],
			loosen: [...this._recording.loosen]
		};
		if (this._recording.visuals)
			this._newRecording.visuals = {...this._recording.visuals};
		this.modifiers = this._newRecording.modifiers;
		if (preferences.recordVisual && this._recording.visuals) {
			this.visuals = this._newRecording.visuals;
		} else {
			this.visuals = {};
			for (const visual of Scene_Game.VISUALS)
				this.visuals[visual] = preferences[visual];
		}
	} else {
		this._isRecording = true
		this.modifiers = {};
		for (const modifier of Scene_Game.MODIFIERS)
			this.modifiers[modifier] = preferences[modifier];
		this.visuals = {};
		for (const visual of Scene_Game.VISUALS)
			this.visuals[visual] = preferences[visual];
		this._newRecording = {modifiers: this.modifiers, hit: [], loosen: []};
		if (preferences.recordVisual)
			this._newRecording.visuals = this.visuals;
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

Level.prototype.load = async function () {
	InGameText.prepare();
	this._beatmap.prepare();
	this._beatmap.setUpExpressionsWithoutXFrom(this.visuals);
	this._beatmap.setUpExpressionsWithoutXFrom(this.modifiers);
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
	this._beatmap.drawRows(this.visuals.reverseVoices);
	this._beatmap.setMirror(this.visuals.mirror, this.visuals.mirrorLowerRow);
	if (!this._hasMusic && this._beatmap.audioUrl) {
		this._hasMusic = true;
		this._musicUrl = this._beatmap.audioUrl;
	}
	this._offsetWizard = this._beatmap.title === 'offset_wizard' && this._hasMusic;
	this._inaccuraciesArray = [];
	this._lastPos = this._beatmap.start;
	this._makeTitle();
	this._preprocessHitEvents();
	this.calculateScore();
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

Level.prototype._postLoadingAudio = function () {
	[this._row1, this._row2] = this._beatmap.rows;
	this._loadingFinished = true;
	this._setUpNewRow();
};

Level.prototype.update = function (now) {
	this._updateHoldings(now);
	if (now >= this._row1.endTime)
		this.switchRow();
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
};

Level.prototype._processAndRecordLoosen = function (time, key) {
	this._processLoosen(time);
	this._newRecording.loosen.push({'time': time, 'key': key});
};

Level.prototype._processAndRecordHit = function (time, key) {
	this._processHit(time);
	this._newRecording.hit.push({'time': time, 'key': key});
};

Level.prototype._hitSoundEnabled = function () {
	return !!(preferences.enableHitSound && !this._offsetWizard);
};

Level.prototype._hitSoundWithMusic = function () {
	return this._hitSoundEnabled() && (this._modifiers.autoPlay || preferences.hitSoundWithMusic);
};

Level.prototype._playHitSound = function () {
	const player = new WebAudio('/assets/audios/hit_sounds/' + preferences.hitSound);
	player.volume = preferences.hitSoundVolume * preferences.masterVolume;
	player.addLoadListener(player.play.bind(player));
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
	this._beatmap.clearNote(event, Scene_Game.BAD);
	this.numbersUpdated = true;
};

Level.prototype.updateRecordingApply = function (now) {
	while (this._recording.hit.length > 0) {
		const {time, key} = this._recording.hit[0];
		if (now >= time) {
			this._processHit(time);
			this._scene._pressings[key] = true;
			this._recording.hit.shift();
		} else
			break;
	}
	while (this._recording.loosen.length > 0) {
		const {time, key} = this._recording.loosen[0];
		if (now >= time) {
			this._processLoosen(time);
			delete this._scene._pressings[key];
			this._recording.loosen.shift();
		} else
			break;
	}
};

Level.prototype._processHit = function (now) {
	if (this.visuals.TPSIndicator)
		this._hitsLastSecond.push(now);
	if (!this._ended) {
		while (this._unclearedEvents.length > 0) {
			const event = this._unclearedEvents[0];
			if (now >= event.time - this._missBoundary() * this.modifiers.judgementWindow) {
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
				this._inaccuraciesArray.push(inaccuracy / this.modifiers.playRate);
				this._scene._createInaccuracyIndicator(inaccuracy);
			} else if (!this.modifiers.noExcess) {
				this._excessHit(now);
			}
			break;
		}
	}
};

Level.prototype._excessHit = function (now) {
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

Level.prototype._missBoundary = function () {
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
	this.scoreUpdated = true;
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

Level.prototype.getMark = function () {
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
};

Level.prototype.switchRow = function () {
	[this._row1, this._row2] = [this._row2, this._beatmap.rows[t.index + 2]];
	this._setUpNewRow();
};

Level.prototype._setUpNewRow = function () {
	const row = this._row1;
	const rowLengthInMilliseconds = row.endTime - row.startTime;
	if (row.perfect)
		this.perfectTolerance = row.perfect * rowLengthInMilliseconds;
	else
		this.perfectTolerance ||= TyphmConstants.DEFAULT_PERFECT * rowLengthInMilliseconds;
	if (row.good)
		this.goodTolerance = row.good * rowLengthInMilliseconds;
	else
		this.goodTolerance ||= TyphmConstants.DEFAULT_GOOD * rowLengthInMilliseconds;
	if (row.bad)
		this.badTolerance = row.bad * rowLengthInMilliseconds;
	else
		this.badTolerance ||= TyphmConstants.DEFAULT_BAD * rowLengthInMilliseconds;
};
