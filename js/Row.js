function Row () {
	this.initialize.apply(this, arguments);
}

Row.prepare = function () {
	this._createBigNoteHalo();
};

Row._createBigNoteHalo = function () {
	const r = preferences.headsRadius*2;
	this._bigNoteHalo = new Bitmap(r*2, r*2);
	const context = this._bigNoteHalo._context;
	context.save();
	const gradient = context.createRadialGradient(r, r, 0, r, r, r);
	gradient.addColorStop(0.5, preferences.notesColor);
	gradient.addColorStop(1, preferences.notesColor + '00');
	context.fillStyle = gradient;
	context.beginPath();
	context.arc(r, r, r, 0, 2*Math.PI);
	context.fill();
	context.globalCompositeOperation = 'destination-out';
	context.beginPath();
	context.arc(r, r, r/2, 0, 2*Math.PI);
	context.fill();
	context.restore();
	this._bigNoteHalo._setDirty();
};

Row.prototype.initialize = function (beatmap) {
	this._bitmap = new Bitmap(Graphics.width, TyphmConstants.LINES_HEIGHT);
	this._beatmap = beatmap;
	this.timeFormula = x => Number(x);
	this.judgementLine = new JudgementLine(this);
};

Row.prototype.setXFormulasIfHasnt = function () {
	this.noteXFormula ||= this.judgementLine.xFormula;
	this.hitXFormula ||= this.noteXFormula;
};

Row.prototype.setJudgementLineAttribute = function (attribute, parameters) {
	(this.fakeJudgementLines ? this.fakeJudgementLines.last() : this.judgementLine).setAttribute(attribute, parameters);
};

Row.prototype.setUpBPM = function (BPMData, lastBPM, lastBeatLength, lastBeatDots) {
	let normalizationDenominator = 0;
	const positions = [frac(0)];
	const durations = [0];
	this.BPMMarkers = [];
	
	for (let i = 0; i < BPMData.length; i += 3) {
		const beatNote = BPMData[i];
		const length = TyphmUtils.parseDigit(beatNote[0]);
		const dots = beatNote.length - 1;
		const bpm = BPMData[i + 1];
		const position = frac(BPMData[i + 2] || 0);
		this.BPMMarkers.push({'length': length, 'dots': dots, 'bpm': bpm, 'position': position});
		if (i === 0 && position.compare(0) <= 0) {
			lastBPM = bpm;
			lastBeatLength = length;
			lastBeatDots = dots;
			continue;
		}
		const beatTrueLength = Beatmap.TRUE_LENGTH_CALC({'length': lastBeatLength, 'dots': lastBeatDots});
		const duration = numre('bignumber((position-lastPosition)/trueLength)/lastBPM',
			{'lastBPM':lastBPM,'trueLength':beatTrueLength,'position':position,'lastPosition':positions.last()||0});
		durations.push(normalizationDenominator = normalizationDenominator + duration);
		positions.push(position);
		lastBPM = bpm;
		lastBeatLength = length;
		lastBeatDots = dots;
	}
	const beatTrueLength = Beatmap.TRUE_LENGTH_CALC({'length': lastBeatLength, 'dots': lastBeatDots});
	const duration = numre('bignumber((position-lastPosition)/trueLength)/lastBPM',
		{'lastBPM':lastBPM,'trueLength':beatTrueLength,'position':frac(1),'lastPosition':positions.last()||0});
	durations.push(normalizationDenominator = normalizationDenominator + duration);
	positions.push(frac(1));
	this.millisecondsPerWhole = 60000*Number(normalizationDenominator);
	
	this.timeFormula = x => {
		let i = 0;
		for (; i < positions.length-1; i++) {
			if (Number(x) <= Number(positions[i+1]))
				break;
		}
		return numre('((d2 - d1)*(x - p1)/(p2 - p1) + d1)/d',
			{'x':Number(x),p1:Number(positions[i]),p2:Number(positions[i+1]),d1:durations[i],d2:durations[i+1],d:normalizationDenominator});
	};
	
	return [lastBPM, lastBeatLength, lastBeatDots];
};

Row.prototype.drawBPM = function (beatNote, dots, bpm, position) {
	const bitmap = this._bitmap;
	const context = bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	context.strokeStyle = preferences.auxiliariesColor;
	const x = preferences.margin + (Graphics.width - 2*preferences.margin)*this.noteXFormula(position);
	const y = TyphmConstants.LINES_HEIGHT/2-96 + (beatNote - 3)*preferences.headsRadius*2;
	for (let i = 0; i < dots; i++) {
		context.beginPath();
		context.arc(x+preferences.headsRadius+5*(i+1), y, 2, 0, 2*Math.PI);
		context.fill();
	}
	context.beginPath();
	context.arc(x, y, preferences.headsRadius, -Math.PI/2, Math.PI*1.5);
	const a = preferences.headsRadius + preferences.stemsLength;
	const b = preferences.beamsSpacing + preferences.beamsWidth;
	const c = preferences.beamsWidth;
	if (beatNote > 1)
		context.fill();
	if (beatNote > 0)
		context.lineTo(x, y - a);
	if (beatNote > 3)
		context.lineTo(x, y - a - b*(beatNote - 3))
	context.stroke();
	if (beatNote > 2) {
		for (let i = 0; i < beatNote - 2; i++) {
			context.beginPath();
			context.moveTo(x, y - a - b*i);
			context.bezierCurveTo(x+6, y-a-b*i, x+16, y-a-b*i+c, x+12, y-a-b*i+c*3);
			context.bezierCurveTo(x+12, y-a-b*i+c*2, x+6, y-a-b*i+c, x, y-a-b*i+c);
			context.fill();
		}
	}
	context.restore();
	const oldTextColor = bitmap.textColor;
	bitmap.textColor = preferences.auxiliariesColor;
	bitmap.drawText(`= ${bpm}`, x+preferences.headsRadius+5*(dots+3), y-30, 200, preferences.textHeight, 'left');
	bitmap.textColor = oldTextColor;
	bitmap._setDirty();
};

Row.prototype.drawBPMIfHas = function () {
	if (this.BPMMarkers) {
		for (let i = 0; i < this.BPMMarkers.length; i++) {
			const {length, dots, bpm, position} = this.BPMMarkers[i];
			this.drawBPM(length, dots, bpm, position);
		}
	}
};

Row.prototype.setTotalLength = function () {
	this.totalLength = frac(0);
	for (let i = 0; i < this.voices[0].length; i++) {
		this.totalLength = this.totalLength.add(Row.calculateLengthRecursive(this.voices[0][i]));
	}
	return this.totalLength;
};

Row.prototype.setMillisecondsPerWholeIfHasnt = function (lastBPM, lastBeatLength, lastBeatDots, lastMillisecondsPerWhole) {
	if (this.millisecondsPerWhole === undefined) {
		if (lastBPM) {
			const beatTrueLength = Beatmap.TRUE_LENGTH_CALC({
				'length': lastBeatLength,
				'dots': lastBeatDots
			});
			const duration = numre('1/(bignumber(lastBPM)*bignumber(trueLength))',
				{'lastBPM': lastBPM, 'trueLength': beatTrueLength});
			this.millisecondsPerWhole = 60000 * duration;
		} else {
			this.millisecondsPerWhole = lastMillisecondsPerWhole;
		}
	}
	return this.millisecondsPerWhole;
};

Row.prototype.setEndTime = function () {
	this.endTime = this.startTime + this.totalLength.valueOf() * this.millisecondsPerWhole;
	return this.endTime;
};

Row.prototype.drawVoicesAndGetLastNotes = function (reverseVoices, lastNotes) {
	const y0 = (TyphmConstants.LINES_HEIGHT - preferences.voicesHeight*(this.voicesNumber-1))/2;
	for (let i = 0; i < this.voices.length; i++) {
		if (i > 0)
			for (let j = 0; j < this.voices[i].length; j++)
				Row.calculateLengthRecursive(this.voices[i][j]);
		let y = y0+preferences.voicesHeight*i;
		if (reverseVoices)
			y = TyphmConstants.LINES_HEIGHT - y;
		this.drawStaffLine(y);
		lastNotes[i] = this.drawVoiceAndGetLastNote(this.voices[i], i === 0, y, lastNotes[i]);
	}
	return lastNotes;
};

Row.prototype.drawStaffLine = function (y) {
	this._bitmap.fillRect(0, y, Graphics.width, 1, preferences.auxiliariesColor);
};

Row.prototype.setupNoteXAndTime = function (event, timeLengthPassed) {
	const position = timeLengthPassed.div(this.totalLength);
	const positionEnd = timeLengthPassed.add(event.trueLength).div(this.totalLength);
	event.x = Row.denormalizeX(this.noteXFormula(position));
	event.xEnd = Row.denormalizeX(this.noteXFormula(positionEnd));
	event.hitX = Row.denormalizeX(this.hitXFormula(position));
	event.time = this.getTimeFromPosition(position);
	event.timeEnd = this.getTimeFromPosition(positionEnd);
};

Row.prototype.getTimeFromPosition = function (position) {
	return this.timeFormula(position) * this.totalTime + this.startTime;
};

Row.denormalizeX = function (normalizedX) {
	return normalizedX * (Graphics.width - preferences.margin*2) + preferences.margin;
};

Row.prototype.drawVoiceAndGetLastNote = function (voice, isFirstVoice, y, lastNote) {
	this.totalTime = this.totalLength.valueOf() * this.millisecondsPerWhole;
	let timeLengthPassed = frac(0);
	for (let i = 0; i < voice.length; i++) {
		const event = voice[i];
		this.setupNoteXAndTime(event, timeLengthPassed);
		const lastTie = lastNote && lastNote.tie;
		if (event.event === "note") {
			if (lastTie) {
				event.tiedNote = lastNote;
				if (i === 0) {
					this.drawRightHalfTie(event.x, y+(lastNote.multiplicity - 1) * 5);
				} else {
					this.drawTie(lastNote.x, event.x, y+(lastNote.multiplicity - 1) * 5);
				}
			}
			if (event.tie && i === voice.length - 1) {
				this.drawLeftHalfTie(event.x,y+(lastNote.multiplicity - 1) * 5);
			}
			this.drawIndividualNote(event, y, !lastTie);
			lastNote = event;
		} else if (event.event === "group") {
			if (lastTie) {
				const firstNote = Row.getFirstNoteRecursive(event);
				firstNote.tiedNote = lastNote;
				firstNote.multiplicity = lastNote.multiplicity;
				firstNote.big = false;
			}
			lastNote = this.drawGroupAndGetLastNoteRecursive(isFirstVoice, event, y, lastNote,
				i === 0, i === voice.length - 1, Row.getGroupHeightRecursive(event), timeLengthPassed, 1);
		} else if (event.event === 'barline') {
			if (isFirstVoice) {
				this._beatmap.barLines.push({
					"time": event.time,
					"x": event.x,
					"rowIndex": this.index
				});
			}
			this.drawBarline(event.x);
		}
		timeLengthPassed = timeLengthPassed.add(event.trueLength);
	}
	return lastNote;
};

Row.getGroupHeightRecursive = function (group) {
	let result = preferences.headsRadius + preferences.stemsLength;
	for (let i = 0; i < group.notes.length; i++) {
		let height = 0;
		const event = group.notes[i];
		if (event.event === "group") {
			height = this.getGroupHeightRecursive(event);
		} else if (event.event === "note") {
			height = preferences.headsRadius*event.multiplicity + preferences.stemsLength;
			if (event.length > 3) {
				height += (event.length - 3)*(preferences.beamsWidth+preferences.beamsSpacing);
			}
		}
		if (height > result)
			result = height;
	}
	return result;
};

Row.prototype.drawIndividualNote = function (note, y, shouldHit) {
	if (!shouldHit) {
		note.multiplicity = note.tiedNote.multiplicity;
		note.big = false;
	}
	if (note.multiplicity === 0) {
		this.drawRest(note, y);
		return;
	}
	this._beatmap.recordHitEvent(this.index, note, y, shouldHit);
	this.drawStemIfHas(note, y);
	this.drawFlagIfHas(note, y);
	this.drawNoteHeadsAndDots(note, y, shouldHit);
	this.drawHoldBarIfHas(note, y, shouldHit);
};

Row.prototype.drawStemIfHas = function (note, y, height) {
	const y0 = y - (note.multiplicity - 1) * preferences.headsRadius;
	const context = this._bitmap._context;
	context.save();
	context.lineWidth = 2;
	context.strokeStyle = preferences.auxiliariesColor;
	context.beginPath();
	context.moveTo(note.x, y0 - preferences.headsRadius);
	const a = preferences.headsRadius + preferences.stemsLength;
	const b = preferences.beamsSpacing + preferences.beamsWidth;
	if (height) {
		context.lineTo(note.x, y - height);
	} else {
		if (note.length > 0)
			context.lineTo(note.x, y0 - a);
		if (note.length > 3)
			context.lineTo(note.x, y0 - a - b * (note.length - 3))
	}
	context.stroke();
	context.restore();
	this._bitmap._setDirty();
};

Row.prototype.drawFlagIfHas = function (note, y) {
	y -= (note.multiplicity - 1) * preferences.headsRadius;
	const context = this._bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	context.beginPath();
	context.moveTo(note.x, y - preferences.headsRadius);
	const a = preferences.headsRadius + preferences.stemsLength;
	const b = preferences.beamsSpacing + preferences.beamsWidth;
	const c = preferences.beamsWidth;
	if (note.length > 2) {
		for (let i = 0; i < note.length - 2; i++) {
			context.beginPath();
			context.moveTo(note.x, y - a - b*i);
			context.bezierCurveTo(note.x+6, y-a-b*i, note.x+16, y-a-b*i+c, note.x+12, y-a-b*i+c*3);
			context.bezierCurveTo(note.x+12, y-a-b*i+c*2, note.x+6, y-a-b*i+c, note.x, y-a-b*i+c);
			context.fill();
		}
	}
	context.restore();
	this._bitmap._setDirty();
};

Row.prototype.drawNoteHeadsAndDots = function (note, y, shouldHit) {
	y -= (note.multiplicity - 1) * preferences.headsRadius;
	const context = this._bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	context.strokeStyle = preferences.auxiliariesColor;
	context.lineWidth = 2;
	for (let i = 0; i < note.dots; i++) {
		for (let j = 0; j < note.multiplicity; j++) {
			context.beginPath();
			context.arc(note.x +preferences.headsRadius + 5 * (i+1), y + preferences.headsRadius*(2 * j - 1), 2, 0, 2 * Math.PI);
			context.fill();
		}
	}
	context.restore();
	for (let i = 0; i < note.multiplicity; i++) {
		this.drawNoteHead(note.x, y + i*preferences.headsRadius*2, note.length > 1,
			note.big, shouldHit ? preferences.notesColor : preferences.auxiliariesColor);
	}
};

Row.prototype.getBitmap = function () {
	return this._bitmap;
};

Row.prototype.drawHoldBarIfHas = function (note, y, shouldHit) {
	y -= (note.multiplicity - 1) * preferences.headsRadius;
	if (note.hold) {
		const context = this._bitmap._context;
		context.save();
		context.strokeStyle = 'white';
		context.lineWidth = preferences.holdWidth;
		for (let i = 0; i < note.multiplicity; i++) {
			context.beginPath();
			context.moveTo(shouldHit ? note.x + preferences.headsRadius : note.x - preferences.headsRadius - 1, y + i*preferences.headsRadius*2);
			context.lineTo(note.xEnd - preferences.headsRadius, y+i*preferences.headsRadius*2);
			context.stroke();
		}
		context.restore();
		this._bitmap._setDirty();
	}
};

Row.prototype.drawRightHalfTie = function (x, y) {
	const context = this._bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	context.beginPath();
	context.moveTo(x, y + 10);
	context.bezierCurveTo(x*2/3, y+20, x/3, y+20, 0, y+20);
	context.lineTo(0, y+16);
	context.bezierCurveTo(x/3, y+16, x*2/3, y+16, x, y+10);
	context.fill();
	context.restore();
	this._bitmap._setDirty();
};

Row.prototype.drawLeftHalfTie = function (x, y) {
	const context = this._bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	const d = Graphics.width - x;
	context.beginPath();
	context.moveTo(x, y + 10);
	context.bezierCurveTo(Graphics.width - d*2/3, y+20, Graphics.width - d/3, y+20, Graphics.width, y+20);
	context.lineTo(Graphics.width, y+16);
	context.bezierCurveTo(Graphics.width - d/3, y+16, Graphics.width - d*2/3, y+16, x, y+10);
	context.fill();
	context.restore();
	this._bitmap._setDirty();
};

Row.prototype.drawTie = function (x1, x2, y) {
	const context = this._bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	context.beginPath();
	context.moveTo(x1, y+10);
	context.bezierCurveTo(x1*2/3+x2/3, y+24, x1/3+x2*2/3, y+24, x2, y+10);
	context.bezierCurveTo(x1/3+x2*2/3, y+20, x1*2/3+x2/3, y+20, x1, y+10);
	context.fill();
	context.restore();
	this._bitmap._setDirty();
};

Row.prototype.drawGroupAndGetLastNoteRecursive = function (isFirstVoice, group, y, lastNote, isFirst, isLast, height, lengthStart, previousEvent, nextEvent, layer) {
	const notes = group.notes;
	let timeLengthPassed = lengthStart;
	for (let i = 0; i < notes.length; i++) {
		const event = notes[i];
		this.setupNoteXAndTime(event, timeLengthPassed);
		const lastTie = lastNote && lastNote.tie;
		let previousIndex = i - 1;
		while (notes[previousIndex] && notes[previousIndex].event === "barline") {
			previousIndex--;
		}
		const previousNote = previousIndex < 0 ? previousEvent : notes[previousIndex];
		let nextIndex = i + 1;
		while (notes[nextIndex] && notes[nextIndex].event === "barline") {
			nextIndex++;
		}
		const nextNote = nextIndex >= notes.length ? nextEvent : notes[nextIndex];
		if (event.event === "note") {
			if (lastTie) {
				event.tiedNote = lastNote;
				if (i === 0 && isFirst) {
					this.drawRightHalfTie(event.x, y+(lastNote.multiplicity - 1) * preferences.headsRadius);
				} else {
					this.drawTie(lastNote.x, event.x, y+(lastNote.multiplicity - 1) * preferences.headsRadius);
				}
			}
			if (event.tie && i === notes.length - 1 && isLast) {
				this.drawLeftHalfTie(event.x, y + (lastNote.multiplicity - 1) * preferences.headsRadius);
			}
			this.drawBeamedNote(event, y, previousNote, nextNote, !lastTie,
				height, timeLengthPassed);
			lastNote = event;
		} else if (event.event === "group") {
			if (lastTie) {
				const firstNote = Row.getFirstNoteRecursive(event);
				firstNote.tiedNote = lastNote;
				firstNote.multiplicity = lastNote.multiplicity;
				firstNote.big = false;
			}
			lastNote = this.drawGroupAndGetLastNoteRecursive(isFirstVoice, event, y, lastNote,
				i === 0, isLast && i === notes.length - 1, height, timeLengthPassed, previousNote, nextNote, layer + 1);
		} else if (event.event === 'barline') {
			if (isFirstVoice)
				this._beatmap.barLines.push({"time": event.time, "x": event.x, "rowIndex": this.index});
			this.drawBarline(event.x);
		}
		timeLengthPassed = timeLengthPassed.add(event.trueLength);
	}
	if (group.ratio1) {
		const bitmap = this._bitmap
		const oldFontSize = bitmap.fontSize;
		const oldColor = bitmap.textColor;
		bitmap.fontSize = 16;
		bitmap.textColor = preferences.auxiliariesColor;
		const width = bitmap.measureTextWidth(group.ratio1);
		const x = (group.x + lastNote.x) / 2;
		if (!Row.isGroupBeamedRecursive(group)) {
			const context = bitmap._context;
			context.save();
			context.strokeStyle = preferences.auxiliariesColor;
			context.lineWidth = 1;
			context.beginPath();
			context.moveTo(group.x - preferences.headsRadius, y - height);
			context.lineTo(group.x - preferences.headsRadius, y - height - 12);
			context.lineTo(x - width / 2 - preferences.headsRadius, y - height - 12);
			context.moveTo(lastNote.x + preferences.headsRadius, y - height);
			context.lineTo(lastNote.x + preferences.headsRadius, y - height - 12);
			context.lineTo(x + width / 2 + preferences.headsRadius, y - height - 12);
			context.stroke();
			context.restore();
		}
		bitmap.drawText(group.ratio1, x - width/2, y - height - 24, width, 24, 'center');
		bitmap.fontSize = oldFontSize;
		bitmap.textColor = oldColor;
	}
	return lastNote;
};

Row.isGroupBeamedRecursive = function (group) {
	for (let i = 0; i < group.notes.length; i++) {
		const event = group.notes[i];
		const isBeamed = event.event === "group" ? this.isGroupBeamedRecursive(event) : this.getBeamsNumber(event) > 0;
		if (!isBeamed)
			return false;
	}
	return true;
};

Row.getFirstNoteRecursive = function (event) {
	let result = event;
	while (result.event === "group") {
		result = result.notes[0];
	}
	return result;
};

Row.getLastNoteRecursive = function (event) {
	let result = event;
	while (result.event === "group") {
		result = result.notes.last();
	}
	return result;
};

Row.getBeamsNumber = function (note) {
	if (note.multiplicity > 0) {
		return Math.max(note.length - 2, 0);
	} else {
		return 0;
	}
};

Row.prototype.drawBeams = function (note, y, height, beginIndex, endIndex) {
	const context = this._bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	const b = preferences.beamsSpacing + preferences.beamsWidth;
	const c = preferences.beamsWidth;
	for (let i = beginIndex; i < endIndex; i++) {
		context.beginPath();
		context.rect(note.x, y - height + b * i, note.xEnd - note.x, c);
		context.fill();
	}
	context.restore();
	this._bitmap._setDirty();
};

Row.prototype.drawUnconnectedBeams = function (note, y, height, beginIndex, endIndex, leftOrRight) {
	const context = this._bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	const b = preferences.beamsSpacing + preferences.beamsWidth;
	const c = preferences.beamsWidth;
	const d = preferences.unconnectedBeamsLength;
	for (let i = beginIndex; i < endIndex; i++) {
		context.beginPath();
		context.rect(leftOrRight ? note.x - d : note.x, y - height + b * i, d, c);
		context.fill();
	}
	context.restore();
	this._bitmap._setDirty();
};

Row.prototype.drawBeamedNote = function (note, y, previous, next, shouldHit, height, timeLengthPassed) {
	if (!shouldHit) {
		note.multiplicity = note.tiedNote.multiplicity;
		note.big = false;
	}
	if (note.multiplicity === 0) {
		this.drawRest(note, y);
		return;
	}
	this._beatmap.recordHitEvent(this.index, note, y, shouldHit);
	const beams = Row.getBeamsNumber(note);
	const nextBeams = next && Row.getBeamsNumber(Row.getFirstNoteRecursive(next))
	const previousBeams = previous && Row.getBeamsNumber(Row.getLastNoteRecursive(previous));
	if (beams === 0) {
		this.drawStemIfHas(note, y);
		this.drawFlagIfHas(note, y);
	} else if (next && nextBeams > 0) {
		this.drawStemIfHas(note, y, height);
		if (nextBeams >= beams) {
			this.drawBeams(note, y, height, 0, beams);
		} else {
			this.drawBeams(note, y, height, 0, nextBeams);
			if (previous && previousBeams > 0) {
				if (previousBeams < nextBeams)
					this.drawBeams(note, y, height, nextBeams, beams);
				else if (previousBeams < beams) {
					if (previousBeams > nextBeams) {
						this.drawUnconnectedBeams(note, y, height, previousBeams, beams, true);
					} else { // previousBeams === nextBeams
						if (timeLengthPassed.add(note.trueLength).mod(note.trueLength).d < note.trueLength.d)
							this.drawUnconnectedBeams(note, y, height, previousBeams, beams, true);
						else
							this.drawUnconnectedBeams(note, y, height, nextBeams, beams, false);
					}
				}
			} else
				this.drawUnconnectedBeams(note, y, height, nextBeams, beams, false);
		}
	} else if (previous && previousBeams > 0) {
		this.drawStemIfHas(note, y, height);
		if (previousBeams < beams)
			this.drawUnconnectedBeams(note, y, height, previousBeams, beams, true);
	} else {
		this.drawStemIfHas(note, y);
		this.drawFlagIfHas(note, y);
	}
	this.drawNoteHeadsAndDots(note, y, shouldHit);
	this.drawHoldBarIfHas(note, y, shouldHit);
};

Row.prototype.drawBarline = function (x) {
	const context = this._bitmap._context;
	context.globalCompositeOperation = 'destination-over';
	this._bitmap.fillRect(x, (TyphmConstants.LINES_HEIGHT - preferences.barLinesHeight) / 2, 1,
		preferences.barLinesHeight, preferences.auxiliariesColor);
	context.globalCompositeOperation = 'source-over';
};

Row.prototype.drawRest = function (note, y) {
	const bitmap = this._bitmap;
	if (note.length === 0) {
		bitmap.fillRect(note.x - 6, y, 12, 6, preferences.auxiliariesColor);
	} else if (note.length === 1) {
		bitmap.fillRect(note.x - 6, y - 6, 12, 6, preferences.auxiliariesColor);
	} else if (note.length === 2) {
		const context = bitmap._context;
		context.save();
		context.strokeStyle = preferences.auxiliariesColor;
		context.lineWidth = 2;
		context.beginPath();
		context.moveTo(note.x - 4, y - 16);
		context.lineTo(note.x + 4, y - 8);
		context.lineTo(note.x-4, y);
		context.lineTo(note.x, y + 4);
		context.arc(note.x, y + 8, 4, Math.PI*3/2, Math.PI/2, true)
		context.stroke();
		context.restore();
	} else {
		const heads = note.length - 2;
		const y0 = y - Math.ceil(heads/2)*10 + preferences.headsRadius;
		for (let i = 0; i < heads; i++) {
			bitmap.drawCircle(note.x - preferences.headsRadius, y0 + i*10, 3, preferences.auxiliariesColor);
		}
		const context = bitmap._context;
		context.save();
		context.strokeStyle = preferences.auxiliariesColor;
		context.lineWidth = 2;
		context.beginPath();
		for (let i = 0; i < heads; i++) {
			context.moveTo(note.x - preferences.headsRadius, y0 + i*10 + 3);
			context.lineTo(note.x, y0 + i*10 - 3);
		}
		context.stroke();
		context.beginPath();
		context.moveTo(note.x, y0 - 3);
		context.lineTo(note.x, y0 + heads*10);
		context.stroke();
		context.restore();
	}
	const context = bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	for (let i = 0; i < note.dots; i++) {
		context.beginPath();
		context.arc(note.x+preferences.headsRadius+5*(i+1), y, 2, 0, 2*Math.PI);
		context.fill();
	}
	context.restore();
	bitmap._setDirty();
}

Row.prototype.drawNoteHead = function (x, y, solid, big, color) {
	const context = this._bitmap._context;
	const r = preferences.headsRadius;
	context.save();
	context.fillStyle = color;
	context.strokeStyle = color;
	context.lineWidth = 2;
	context.beginPath();
	context.arc(x, y, r, -Math.PI/2, Math.PI*1.5);
	context.stroke();
	if (solid)
		context.fill();
	if (big) {
		context.globalCompositeOperation = 'destination-over';
		context.drawImage(Row._bigNoteHalo._canvas, 0, 0, 4*r, 4*r, x - 2*r, y - 2*r, 4*r, 4*r);
	}
	context.restore();
	this._bitmap._setDirty();
};

Row.calculateLengthRecursive = function (event) {
	if (event.event === "note") {
		event.trueLength = Beatmap.TRUE_LENGTH_CALC(event);
	} else if (event.event === "group") {
		event.trueLength = frac(0);
		for (let i = 0; i < event.notes.length; i++) {
			this.calculateLengthRecursive(event.notes[i]);
			event.notes[i].trueLength = event.notes[i].trueLength.mul(event.ratio);
			event.trueLength = event.trueLength.add(event.notes[i].trueLength);
		}
	} else if (event.event === "barline") {
		event.trueLength = frac(0);
	}
	return event.trueLength;
};

Row.prototype.trackHold = function (x, xNow, y, judge) {
	const context = this._bitmap._context;
	context.save();
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(xNow, y);
	context.lineWidth = preferences.holdWidth;
	let color;
	if (judge === Scene_Game.PERFECT)
		color = preferences.perfectColor;
	else if (judge === Scene_Game.GOOD)
		color = preferences.goodColor;
	context.strokeStyle = color;
	context.stroke();
	context.restore();
	this._bitmap._setDirty();
};
