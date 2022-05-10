function Beatmap () {
	this.initialize.apply(this, arguments);
}

Beatmap.prototype.initialize = function (url) {
	this.url = url;
};

Beatmap.prototype.load = async function () {
	let [head, data] = eol.lf((await fetch(this.url).then(r => r.text()))).split('---\n');
	head = head.split('\n').map(s => s.split(': '));
	for (let i = 0; i < head.length; i++) {
		if (head[i].length > 2)
			head[i] = [head[i][0], head[i].slice(1).join(': ')];
		else if (head[i].length === 1)
			head[i][1] = ''
	}
	const dataLineno = head.length + 2;
	head = Object.fromEntries(head);
	data = data.split('\n');
	this.title = head.title || '';
	this.audioUrl = head.audioUrl;
	this.musicAuthor = head.musicAuthor || '';
	this.beatmapAuthor = head.beatmapAuthor || '';
	this.difficulty = head.difficulty || 'unknown';
	this.title = this.title.trim();
	if (this.audioUrl)
		this.audioUrl = this.audioUrl.trim();
	this.musicAuthor = this.musicAuthor.trim();
	this.beatmapAuthor = this.beatmapAuthor.trim();
	this.difficulty = this.difficulty.trim();
	this.start = head.start ? parseFloat(head.start) : 0.0;
	this.end = head.end ? parseFloat(head.end) : this.audioUrl ? await TyphmUtils.getAudioDuration() || null : null;
	this.length = this.end && this.end - this.start;
	this.volume = head.volume ? parseFloat(head.volume) : 1.0;
	this.offset = head.offset ? parseFloat(head.offset) : 0.0;
	this.parse(data, dataLineno)
};

Beatmap.prototype.parse = function (data, dataLineno) {
	this.events = [];
	for (let lineno = 0, voices = []; lineno < data.length; lineno++) {
		let line = data[lineno];
		if (TyphmUtils.isCapitalized(line)) { // control sequence
			let [name, ...parameters] = line.split(' ');
			this.events.push({"event": name.toLowerCase(), "parameters": parameters});
		} else if (line === '') { // new line
			this.events.push({"event": "line", "voices": voices});
			voices = [];
		} else { // voice
			voices.push([]);
			let position = 0;
			while (position < line.length) {
				if (line[position] === '(') { // group start
					voices.push([]); // use voices as a stack... will pop!
					position++;
					continue;
				}
				if (line[position] === '|') { // barline
					voices.last().push({"event": "barline"});
					position++;
					continue;
				}
				if (line[position] === ' ') {
					position++;
					continue;
				}
				
				// start parsing a note here!
				const noteEvent = {"event": "note"};
				
				// note length
				if (TyphmUtils.isDigit(line[position])) {
					noteEvent.length = TyphmUtils.parseDigit(line[position]);
					position++;
				} else
					throw new BeatmapError(lineno + dataLineno, position + 1, "expected [0-9a-z], found " + line[position]);
				
				// dots
				let dots = 0;
				while (line[position] === '.') {
					dots++;
					position++;
				}
				noteEvent.dots = dots;
				
				// multiplicity
				if (TyphmUtils.isDigit(line[position])) {
					noteEvent.multiplicity = TyphmUtils.parseDigit(line[position]);
					position++;
				} else
					noteEvent.multiplicity = 1;
				
				// hold
				if (line[position] === '_') {
					noteEvent.hold = true;
					position++;
				} else
					noteEvent.hold = false;
				
				// tie
				if (line[position] === '~') {
					noteEvent.tie = true;
					position++;
				} else
					noteEvent.tie = false;
				
				// end parsing a note here!
				voices.last().push(noteEvent);
				
				while (line[position] === ')') { // group end
					position++
					const group = voices.pop();
					const groupEvent = {"event": "group", "notes": group};
					if (TyphmUtils.isDigit(line[position])) {
						groupEvent.ratio1 = TyphmUtils.parseDigit(line[position]);
						position++;
						if (TyphmUtils.isDigit(line[position])) {
							groupEvent.ratio2 = TyphmUtils.parseDigit(line[position]);
							groupEvent.ratio = groupEvent.ratio2 / groupEvent.ratio1;
							position++;
						} else { // default value of ratio2 is 2 ** floor(log2(ratio1))
							groupEvent.ratio2 = null;
							groupEvent.ratio = new Fraction(2).pow(Math.floor(Math.log2(groupEvent.ratio1))).div(groupEvent.ratio1);
						}
					} else {
						groupEvent.ratio1 = null;
						groupEvent.ratio2 = null;
						groupEvent.ratio = new Fraction(1);
					}
					voices.last().push(groupEvent);
				}
			}
		}
	}
}

Beatmap.prototype.drawLines = function () {
	this.lines = [new Bitmap(Graphics.width, TyphmConstants.LINES_HEIGHT)];
	this.notes = [];
	let lastLineNotes = [];
	let lastLineEndTime = this.offset;
	let lastLineMillisecondsPerWhole = TyphmConstants.DEFAULT_MILLISECONDS_PER_WHOLE;
	for (let i = 0; i < this.events.length; i++) {
		const event = this.events[i];
		const line = this.lines.last();
		if (event.event === "bpm") {
			let [note, bpm] = event.parameters;
			let dots = note.length - 1;
			note = TyphmUtils.parseDigit(note[0]);
			this.drawBPM(line, note, dots, bpm);
			line.millisecondsPerWhole = 60000/bpm / (0.5**note*(2-0.5**dots));
		} else if (event.event === "perfect") {
			line.perfect = parseFloat(event.parameters[0]);
		} else if (event.event === "good") {
			line.good = parseFloat(event.parameters[0]);
		} else if (event.event === "bad") {
			line.bad = parseFloat(event.parameters[0]);
		} else if (event.event === "line") {
			line.lineno = this.lines.length - 1;
			line.startTime = lastLineEndTime;
			line.millisecondsPerWhole ||= lastLineMillisecondsPerWhole;
			const voices = event.voices;
			line.totalLength = new Fraction(0);
			for (let i = 0; i < voices[0].length; i++) {
				line.totalLength = line.totalLength.add(this._calculateLengthRecursive(voices[0][i]));
			}
			const y0 = (TyphmConstants.LINES_HEIGHT - preferences.voicesHeight*(voices.length-1))/2;
			for (let i = 0; i < voices.length; i++) {
				if (i > 0)
					for (let j = 0; j < voices[i].length; j++)
						this._calculateLengthRecursive(voices[i][j]);
				const y = y0+preferences.voicesHeight*i;
				this.drawStaffLine(line, y);
				lastLineNotes[i] = this.drawVoiceAndGetLastNote(line, voices[i], y, lastLineNotes[i]);
			}
			line.endTime = line.startTime + line.totalLength.valueOf() * line.millisecondsPerWhole;
			lastLineEndTime = line.endTime;
			lastLineMillisecondsPerWhole = line.millisecondsPerWhole;
			this.lines.push(new Bitmap(Graphics.width, TyphmConstants.LINES_HEIGHT));
		}
	}
	this.notes.sort((n1, n2) => n1.time - n2.time);
};

Beatmap.prototype.drawStaffLine = function (bitmap, y) {
	bitmap.fillRect(0, y, Graphics.width, 1, preferences.auxiliariesColor);
}

Beatmap.prototype.drawVoiceAndGetLastNote = function (bitmap, voice, y, lastNote) {
	let timeLengthPassed = new Fraction(0);
	for (let i = 0; i < voice.length; i++) {
		const event = voice[i];
		event.x = timeLengthPassed.div(bitmap.totalLength).valueOf() * (Graphics.width - preferences.margin*2) + preferences.margin;
		event.xEnd = timeLengthPassed.add(event.trueLength).div(bitmap.totalLength).valueOf() * (Graphics.width - preferences.margin*2) + preferences.margin;
		event.time = bitmap.startTime + timeLengthPassed.valueOf() * bitmap.millisecondsPerWhole;
		event.timeEnd = bitmap.startTime + timeLengthPassed.add(event.trueLength).valueOf() * bitmap.millisecondsPerWhole;
		const lastTie = lastNote && lastNote.tie;
		if (event.event === "note") {
			if (lastTie) {
				event.tiedNote = lastNote;
				if (i === 0) {
					this.drawRightHalfTie(bitmap, event.x, y+(lastNote.multiplicity - 1) * 5);
				} else {
					this.drawTie(bitmap, lastNote.x, event.x, y+(lastNote.multiplicity - 1) * 5);
				}
			}
			if (event.tie && i === voice.length - 1) {
				this.drawLeftHalfTie(bitmap, event.x,y+(lastNote.multiplicity - 1) * 5);
			}
			this.drawIndividualNote(bitmap, event, y, !lastTie);
			lastNote = event;
		} else if (event.event === "group") {
			if (lastTie) {
				const firstNote = this.getFirstNoteRecursive(event);
				firstNote.tiedNote = lastNote;
				firstNote.multiplicity = lastNote.multiplicity;
			}
			lastNote = this.drawGroupAndGetLastNoteRecursive(bitmap, event, y, lastNote,
					i === 0, i === voice.length - 1, this.getGroupHeightRecursive(event), 1);
		} else if (event.event === 'barline') {
			this.drawBarline(bitmap, event.x);
		}
		timeLengthPassed = timeLengthPassed.add(event.trueLength);
	}
	return lastNote;
};

Beatmap.prototype.getGroupHeightRecursive = function (group) {
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

Beatmap.prototype.drawIndividualNote = function (bitmap, note, y, shouldHit) {
	if (!shouldHit) {
		note.multiplicity = note.tiedNote.multiplicity;
	}
	if (note.multiplicity === 0) {
		this.drawRest(bitmap, note, y);
		return;
	}
	this.recordHitEvent(bitmap.lineno, note, y, shouldHit);
	this.drawStemIfHas(bitmap, note, y);
	this.drawFlagIfHas(bitmap, note, y);
	this.drawNoteHeadsAndDots(bitmap, note, y, shouldHit);
	this.drawHoldBarIfHas(bitmap, note, y, shouldHit);
};

Beatmap.prototype.recordHitEvent = function (lineno, note, y, shouldHit) {
	y -= (note.multiplicity - 1) * preferences.headsRadius;
	if (shouldHit) {
		note.hitEvents = [];
		for (let i = 0; i < note.multiplicity; i++) {
			const hitEvent = {"x": note.x, "y": y+i*preferences.headsRadius*2, "xEnd": note.xEnd, "time": note.time, "timeEnd": note.timeEnd,
				"hold": note.hold, "solid": note.length > 1, "lineno": lineno};
			note.hitEvents.push(hitEvent);
			this.notes.push(hitEvent);
		}
	} else {
		let tiedNote = note.tiedNote;
		while (tiedNote.tiedNote) {
			tiedNote = tiedNote.tiedNote;
		}
		for (let i = 0; i < note.multiplicity; i++) {
			tiedNote.hitEvents[i].ySwitches ||= [];
			tiedNote.hitEvents[i].timeEnd = note.timeEnd;
			tiedNote.hitEvents[i].xEnd = note.xEnd;
			tiedNote.hitEvents[i].ySwitches.push({"time": note.time, "y": y + i*preferences.headsRadius*2, "lineno": lineno});
		}
		note.hold = tiedNote.hold;
	}
};

Beatmap.prototype.drawStemIfHas = function (bitmap, note, y, height) {
	const y0 = y - (note.multiplicity - 1) * preferences.headsRadius;
	const context = bitmap._context;
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
	bitmap._setDirty();
};

Beatmap.prototype.drawFlagIfHas = function (bitmap, note, y) {
	y -= (note.multiplicity - 1) * preferences.headsRadius;
	const context = bitmap._context;
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
	bitmap._setDirty();
};

Beatmap.prototype.drawNoteHeadsAndDots = function (bitmap, note, y, shouldHit) {
	y -= (note.multiplicity - 1) * preferences.headsRadius;
	const context = bitmap._context;
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
		this.drawNoteHead(bitmap, note.x, y + i*preferences.headsRadius*2, note.length > 1, shouldHit ? preferences.notesColor : preferences.auxiliariesColor);
	}
};

Beatmap.prototype.drawHoldBarIfHas = function (bitmap, note, y, shouldHit) {
	y -= (note.multiplicity - 1) * preferences.headsRadius;
	if (note.hold) {
		const context = bitmap._context;
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
		bitmap._setDirty();
	}
};

Beatmap.prototype.drawRightHalfTie = function (bitmap, x, y) {
	const context = bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	context.beginPath();
	context.moveTo(x, y + 10);
	context.bezierCurveTo(x*2/3, y+20, x/3, y+20, 0, y+20);
	context.lineTo(0, y+16);
	context.bezierCurveTo(x/3, y+16, x*2/3, y+16, x, y+10);
	context.fill();
	context.restore();
	bitmap._setDirty();
};

Beatmap.prototype.drawLeftHalfTie = function (bitmap, x, y) {
	const context = bitmap._context;
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
	bitmap._setDirty();
};

Beatmap.prototype.drawTie = function (bitmap, x1, x2, y) {
	const context = bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	context.beginPath();
	context.moveTo(x1, y+10);
	context.bezierCurveTo(x1*2/3+x2/3, y+24, x1/3+x2*2/3, y+24, x2, y+10);
	context.bezierCurveTo(x1/3+x2*2/3, y+20, x1*2/3+x2/3, y+20, x1, y+10);
	context.fill();
	context.restore();
	bitmap._setDirty();
};

Beatmap.prototype.drawGroupAndGetLastNoteRecursive = function (bitmap, group, y, lastNote, isFirst, isLast, height, layer) {
	const notes = group.notes;
	let timeLengthPassed = new Fraction(0);
	for (let i = 0; i < notes.length; i++) {
		const event = notes[i];
		event.x = timeLengthPassed.div(group.trueLength).valueOf() * (group.xEnd - group.x) + group.x;
		event.xEnd = timeLengthPassed.add(event.trueLength).div(group.trueLength).valueOf() * (group.xEnd - group.x) + group.x;
		event.time = group.time + timeLengthPassed.valueOf() * bitmap.millisecondsPerWhole;
		event.timeEnd = group.time + timeLengthPassed.add(event.trueLength).valueOf() * bitmap.millisecondsPerWhole;
		const lastTie = lastNote && lastNote.tie;
		if (event.event === "note") {
			if (lastTie) {
				event.tiedNote = lastNote;
				if (i === 0 && isFirst) {
					this.drawRightHalfTie(bitmap, event.x, y+(lastNote.multiplicity - 1) * preferences.headsRadius);
				} else {
					this.drawTie(bitmap, lastNote.x, event.x, y+(lastNote.multiplicity - 1) * preferences.headsRadius);
				}
			}
			if (event.tie && i === notes.length - 1 && isLast) {
				this.drawLeftHalfTie(bitmap, event.x, y + (lastNote.multiplicity - 1) * preferences.headsRadius);
			}
			let previousIndex = i - 1;
			while (notes[previousIndex] && notes[previousIndex].event === "barline") {
				previousIndex--;
			}
			let nextIndex = i + 1;
			while (notes[nextIndex] && notes[nextIndex].event === "barline") {
				nextIndex++;
			}
			this.drawBeamedNote(bitmap, event, y, notes[previousIndex], notes[nextIndex], !lastTie,
					height, timeLengthPassed);
			lastNote = event;
		} else if (event.event === "group") {
			if (lastTie) {
				const firstNote = this.getFirstNoteRecursive(event);
				firstNote.tiedNote = lastNote;
				firstNote.multiplicity = lastNote.multiplicity;
			}
			lastNote = this.drawGroupAndGetLastNoteRecursive(bitmap, event, y, lastNote,
				i === 0, i === notes.length - 1, height, layer + 1);
		} else if (event.event === 'barline') {
			this.drawBarline(bitmap, event.x);
		}
		timeLengthPassed = timeLengthPassed.add(event.trueLength);
	}
	if (group.ratio1) {
		const oldFontSize = bitmap.fontSize;
		const oldColor = bitmap.textColor;
		bitmap.fontSize = 16;
		bitmap.textColor = preferences.auxiliariesColor;
		const width = bitmap.measureTextWidth(group.ratio1);
		const x = (group.x + lastNote.x) / 2;
		if (!this.isGroupBeamedRecursive(group)) {
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

Beatmap.prototype.trackHoldTo = function (now, xNow, hitEvent, judge, lineno) {
	let y = hitEvent.y;
	let x = hitEvent.x + preferences.headsRadius;
	let eventLineno = hitEvent.lineno;
	let reachedEnd = true;
	if (hitEvent.ySwitches) {
		for (let i = 0; i < hitEvent.ySwitches.length; i++) {
			if (now >= hitEvent.ySwitches[i].time) {
				y = hitEvent.ySwitches[i].y;
				if (eventLineno !== hitEvent.ySwitches[i].lineno) {
					x = preferences.margin;
					eventLineno = hitEvent.ySwitches[i].lineno;
				}
			} else {
				reachedEnd = false;
				break;
			}
		}
	}
	if (eventLineno !== lineno)
		return;
	if (reachedEnd)
		xNow = Math.min(xNow, hitEvent.xEnd - preferences.headsRadius);
	const context = this.lines[lineno]._context;
	context.save();
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(xNow, y);
	context.lineWidth = preferences.holdWidth;
	let color;
	if (judge === 'perfect')
		color = preferences.perfectColor;
	else if (judge === 'good')
		color = preferences.goodColor;
	context.strokeStyle = color;
	context.stroke();
	context.restore();
	this.lines[lineno]._setDirty();
};

Beatmap.prototype.isGroupBeamedRecursive = function (group) {
	for (let i = 0; i < group.notes.length; i++) {
		const event = group.notes[i];
		const isBeamed = event.event === "group" ? this.isGroupBeamedRecursive(event) : this.getBeamsNumber(event) > 0;
		if (!isBeamed)
			return false;
	}
	return true;
}

Beatmap.prototype.getFirstNoteRecursive = function (event) {
	let result = event;
	while (result.event === "group") {
		result = result.notes[0];
	}
	return result;
};

Beatmap.prototype.getLastNoteRecursive = function (event) {
	let result = event;
	while (result.event === "group") {
		result = result.notes.last();
	}
	return result;
};

Beatmap.prototype.getBeamsNumber = function (note) {
	if (note.multiplicity > 0) {
		return Math.max(note.length - 2, 0);
	} else {
		return 0;
	}
};

Beatmap.prototype.drawBeams = function (bitmap, note, y, height, beginIndex, endIndex) {
	const context = bitmap._context;
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
	bitmap._setDirty();
};

Beatmap.prototype.drawUnconnectedBeams = function (bitmap, note, y, height, beginIndex, endIndex, leftOrRight) {
	const context = bitmap._context;
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
	bitmap._setDirty();
}

Beatmap.prototype.drawBeamedNote = function (bitmap, note, y, previous, next, shouldHit, height, timeLengthPassed) {
	if (!shouldHit) {
		note.multiplicity = note.tiedNote.multiplicity;
	}
	if (note.multiplicity === 0) {
		this.drawRest(bitmap, note, y);
		return;
	}
	this.recordHitEvent(bitmap.lineno, note, y, shouldHit);
	const beams = this.getBeamsNumber(note);
	const nextBeams = next && this.getBeamsNumber(this.getFirstNoteRecursive(next))
	const previousBeams = previous && this.getBeamsNumber(this.getLastNoteRecursive(previous));
	// 20220409: 屎山 if 语句, 下次动的时候重构
	// 20220510: 居然真的重构了
	if (beams === 0) {
		this.drawStemIfHas(bitmap, note, y);
		this.drawFlagIfHas(bitmap, note, y);
	} else if (next && nextBeams > 0) {
		this.drawStemIfHas(bitmap, note, y, height);
		if (nextBeams >= beams) {
			this.drawBeams(bitmap, note, y, height, 0, beams);
		} else {
			this.drawBeams(bitmap, note, y, height, 0, nextBeams);
			if (previous && previousBeams > 0) {
				if (previousBeams < nextBeams)
					this.drawBeams(bitmap, note, y, height, nextBeams, beams);
				else if (previousBeams < beams) {
					if (previousBeams > nextBeams) {
						this.drawUnconnectedBeams(bitmap, note, y, height, previousBeams, beams, true);
					} else {// previousBeams === nextBeams
						if (timeLengthPassed.add(note.trueLength).mod(note.trueLength).d < note.trueLength.d)
							this.drawUnconnectedBeams(bitmap, note, y, height, previousBeams, beams, true);
						else
							this.drawUnconnectedBeams(bitmap, note, y, height, nextBeams, beams, false);
					}
				}
			} else
				this.drawUnconnectedBeams(bitmap, note, y, height, nextBeams, beams, false);
		}
	} else if (previous && previousBeams > 0) {
		this.drawStemIfHas(bitmap, note, y, height);
		if (previousBeams < beams)
			this.drawUnconnectedBeams(bitmap, note, y, height, previousBeams, beams, true);
	} else {
		this.drawStemIfHas(bitmap, note, y);
		this.drawFlagIfHas(bitmap, note, y);
	}
	this.drawNoteHeadsAndDots(bitmap, note, y, shouldHit);
	this.drawHoldBarIfHas(bitmap, note, y, shouldHit);
};

Beatmap.prototype.drawBarline = function (bitmap, x) {
	const context = bitmap._context;
	context.globalCompositeOperation = 'destination-over';
	bitmap.fillRect(x, TyphmConstants.LINES_HEIGHT / 4, 1, TyphmConstants.LINES_HEIGHT/2, preferences.auxiliariesColor);
	context.globalCompositeOperation = 'source-over';
};

Beatmap.prototype.drawRest = function (bitmap, note, y) {
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

Beatmap.prototype.drawNoteHead = function (bitmap, x, y, solid, color) {
	const context = bitmap._context;
	context.save();
	context.fillStyle = color;
	context.strokeStyle = color;
	context.lineWidth = 2;
	context.beginPath();
	context.arc(x, y, preferences.headsRadius, -Math.PI/2, Math.PI*1.5);
	context.stroke();
	if (solid)
		context.fill();
	context.restore();
	bitmap._setDirty();
};

Beatmap.prototype._calculateLengthRecursive = function (event) {
	if (event.event === "note") {
		event.trueLength = new Fraction(1,2).pow(event.length).mul(new Fraction(2).sub(new Fraction(1,2).pow(event.dots)));
	} else if (event.event === "group") {
		event.trueLength = new Fraction(0);
		for (let i = 0; i < event.notes.length; i++) {
			this._calculateLengthRecursive(event.notes[i]);
			event.notes[i].trueLength = event.notes[i].trueLength.mul(event.ratio);
			event.trueLength = event.trueLength.add(event.notes[i].trueLength);
		}
	} else if (event.event === "barline") {
		event.trueLength = new Fraction(0);
	}
	return event.trueLength;
}

Beatmap.prototype.drawBPM = function (bitmap, beatNote, dots, bpm) {
	const context = bitmap._context;
	context.save();
	context.fillStyle = preferences.auxiliariesColor;
	context.strokeStyle = preferences.auxiliariesColor;
	const x = 32;
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
	bitmap.drawText(`= ${bpm}`, x+preferences.headsRadius+5*(dots+3), y-30, 200, TyphmConstants.TEXT_HEIGHT, 'left');
	bitmap.textColor = oldTextColor;
	bitmap._setDirty();
};

Beatmap.prototype.clearNote = function (event, judge) {
	let color;
	if (judge === 'perfect')
		color = preferences.perfectColor;
	else if (judge === 'good')
		color = preferences.goodColor;
	else if (judge === 'bad')
		color = preferences.badColor;
	else if (judge === 'miss')
		color = preferences.missColor;
	this.drawNoteHead(this.lines[event.lineno], event.x, event.y, event.solid, color);
};
