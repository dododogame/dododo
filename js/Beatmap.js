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
				
				if (line[position] === ')') { // group end
					position++
				} else
					continue;
				
				// parse group end
				const group = voices.pop();
				const groupEvent = {"event": "group", "notes": group};
				if (TyphmUtils.isDigit(line[position])) {
					groupEvent.ratio1 = TyphmUtils.parseDigit(line[position]);
					position++;
					if (TyphmUtils.isDigit(line[position])) {
						groupEvent.ratio2 = TyphmUtils.parseDigit(line[position]);
						groupEvent.ratio = groupEvent.ratio2 / groupEvent.ratio1;
						position++;
					}  else { // default value of ratio2 is 2 ** floor(log2(ratio1))
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
			const y0 = (TyphmConstants.LINES_HEIGHT - TyphmConstants.VOICES_HEIGHT*(voices.length-1))/2;
			for (let i = 0; i < voices.length; i++) {
				if (i > 0)
					for (let j = 0; j < voices[i].length; j++)
						this._calculateLengthRecursive(voices[i][j]);
				const y = y0+TyphmConstants.VOICES_HEIGHT*i;
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
	bitmap.fillRect(0, y, Graphics.width, 1, 'dimgray');
}

Beatmap.prototype.drawVoiceAndGetLastNote = function (bitmap, voice, y, lastNote) {
	let timeLengthPassed = new Fraction(0);
	for (let i = 0; i < voice.length; i++) {
		const event = voice[i];
		event.x = timeLengthPassed.div(bitmap.totalLength).valueOf() * (Graphics.width - TyphmConstants.MARGIN*2) + TyphmConstants.MARGIN;
		event.xEnd = timeLengthPassed.add(event.trueLength).div(bitmap.totalLength).valueOf() * (Graphics.width - TyphmConstants.MARGIN*2) + TyphmConstants.MARGIN;
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
	let result = 30;
	for (let i = 0; i < group.notes.length; i++) {
		let height = 0;
		const event = group.notes[i];
		if (event.event === "group") {
			height = this.getGroupHeightRecursive(event);
		} else if (event.event === "note") {
			height = 30 + (event.multiplicity - 1) * 5;
			if (event.length > 3) {
				height += (event.length - 3)*10;
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
	y -= (note.multiplicity - 1) * 5;
	if (shouldHit) {
		note.hitEvents = [];
		for (let i = 0; i < note.multiplicity; i++) {
			const hitEvent = {"x": note.x, "y": y+i*10, "xEnd": note.xEnd, "time": note.time, "timeEnd": note.timeEnd,
					"hold": note.hold, "solid": note.length > 1, "lineno": bitmap.lineno};
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
			tiedNote.hitEvents[i].ySwitches.push({"time": note.time, "y": y + i*10, "lineno": bitmap.lineno});
		}
		note.hold = tiedNote.hold;
	}
	const context = bitmap._context;
	context.save();
	context.fillStyle = 'dimgray';
	context.strokeStyle = 'dimgray';
	context.lineWidth = 2;
	for (let i = 0; i < note.dots; i++) {
		for (let j = 0; j < note.multiplicity; j++) {
			context.beginPath();
			context.arc(note.x + 10 + 5 * i, y + 10 * j - 5, 2, 0, 2 * Math.PI);
			context.fill();
		}
	}
	context.beginPath();
	context.moveTo(note.x, y - 5);
	if (note.length > 0)
		context.lineTo(note.x, y - 30);
	if (note.length > 3)
		context.lineTo(note.x, y - 30 - 10*(note.length - 3))
	context.stroke();
	if (note.length > 2) {
		for (let i = 0; i < note.length - 2; i++) {
			context.beginPath();
			context.moveTo(note.x, y - 30 - 10*i);
			context.bezierCurveTo(note.x+6, y-30-10*i, note.x+16, y-24-10*i, note.x+12, y-8-10*i);
			context.bezierCurveTo(note.x+12, y-20-10*i, note.x+6, y-24-10*i, note.x, y-24-10*i);
			context.fill();
		}
	}
	context.restore();
	for (let i = 0; i < note.multiplicity; i++) {
		this.drawNoteHead(bitmap, note.x, y + i*10, note.length > 1, shouldHit ? 'white' : 'dimgray');
	}
	if (note.hold) {
		context.strokeStyle = 'white';
		context.lineWidth = 5;
		for (let i = 0; i < note.multiplicity; i++) {
			context.beginPath();
			context.moveTo(shouldHit ? note.x + 5 : note.x - 6, y + i*10);
			context.lineTo(note.xEnd - 5, y+i*10);
			context.stroke();
		}
	}
	bitmap._setDirty();
};

Beatmap.prototype.drawRightHalfTie = function (bitmap, x, y) {
	const context = bitmap._context;
	context.save();
	context.fillStyle = 'dimgray';
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
	context.fillStyle = 'dimgray';
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
	context.fillStyle = 'dimgray';
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
					this.drawRightHalfTie(bitmap, event.x, y+(lastNote.multiplicity - 1) * 5);
				} else {
					this.drawTie(bitmap, lastNote.x, event.x, y+(lastNote.multiplicity - 1) * 5);
				}
			}
			if (event.tie && i === notes.length - 1 && isLast) {
				this.drawLeftHalfTie(bitmap, event.x, y + (lastNote.multiplicity - 1) * 5);
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
					height, isLast && i === notes.length-1, timeLengthPassed);
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
		bitmap.textColor = 'dimgray';
		const width = bitmap.measureTextWidth(group.ratio1);
		const x = (group.x + lastNote.x) / 2;
		if (!this.isGroupBeamedRecursive(group)) {
			const context = bitmap._context;
			context.save();
			context.strokeStyle = 'dimgray';
			context.beginPath();
			context.moveTo(group.x - 5, y - height);
			context.lineTo(group.x - 5, y - height - 12);
			context.lineTo(x - width / 2 - 5, y - height - 12);
			context.moveTo(lastNote.x + 5, y - height);
			context.lineTo(lastNote.x + 5, y - height - 12);
			context.lineTo(x + width / 2 + 5, y - height - 12);
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
	let x = hitEvent.x + 5;
	let eventLineno = hitEvent.lineno;
	let reachedEnd = true;
	if (hitEvent.ySwitches) {
		for (let i = 0; i < hitEvent.ySwitches.length; i++) {
			if (now >= hitEvent.ySwitches[i].time) {
				y = hitEvent.ySwitches[i].y;
				if (eventLineno !== hitEvent.ySwitches[i].lineno) {
					x = TyphmConstants.MARGIN;
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
		xNow = Math.min(xNow, hitEvent.xEnd - 5);
	const context = this.lines[lineno]._context;
	context.save();
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(xNow, y);
	context.lineWidth = 5;
	let color;
	if (judge === 'perfect')
		color = 'yellow';
	else if (judge === 'good')
		color = 'blue';
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

Beatmap.prototype.drawBeamedNote = function (bitmap, note, y, previous, next, shouldHit, height, isLast, timeLengthPassed) {
	if (!shouldHit) {
		note.multiplicity = note.tiedNote.multiplicity;
	}
	if (note.multiplicity === 0) {
		this.drawRest(bitmap, note, y);
		return;
	}
	const y0 = y - (note.multiplicity - 1) * 5;
	if (shouldHit) {
		note.hitEvents = [];
		for (let i = 0; i < note.multiplicity; i++) {
			const hitEvent = {"x": note.x, "y": y0+i*10, "xEnd": note.xEnd, "time": note.time, "timeEnd": note.timeEnd,
					"hold": note.hold, "solid": note.length > 1, "lineno": bitmap.lineno};
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
			tiedNote.hitEvents[i].xEnd = note.xEnd;
			tiedNote.hitEvents[i].timeEnd = note.timeEnd;
			tiedNote.hitEvents[i].ySwitches.push({"time": note.time, "y": y0 + i*10, "lineno": bitmap.lineno});
		}
		note.hold = tiedNote.hold;
	}
	const context = bitmap._context;
	context.save();
	context.fillStyle = 'dimgray';
	for (let i = 0; i < note.dots; i++) {
		for (let j = 0; j < note.multiplicity; j++) {
			context.beginPath();
			context.arc(note.x + 10 + 5 * i, y0 + 10 * j - 5, 2, 0, 2 * Math.PI);
			context.fill();
		}
	}
	context.strokeStyle = 'dimgray';
	const beams = this.getBeamsNumber(note);
	if (next) {
		const nextBeams = this.getBeamsNumber(this.getFirstNoteRecursive(next))
		if (beams > 0 && nextBeams > 0) {
			context.lineWidth = 2;
			context.beginPath();
			context.moveTo(note.x, y - 5);
			context.lineTo(note.x, y - height)
			context.stroke();
			if (nextBeams >= beams) {
				for (let i = 0; i < beams; i++) {
					context.beginPath();
					context.rect(note.x, y - height + 10*i, note.xEnd - note.x, 6);
					context.fill();
				}
			} else {
				for (let i = 0; i < nextBeams; i++) {
					context.beginPath();
					context.rect(note.x, y - height + 10*i, note.xEnd - note.x, 6);
					context.fill();
				}
				if (previous) {
					const previousBeams = this.getBeamsNumber(this.getLastNoteRecursive(previous));
					if (previousBeams > 0) {
						if (previousBeams < nextBeams) {
							for (let i = nextBeams; i < beams; i++) {
								context.beginPath();
								context.rect(note.x, y - height + 10 * i, note.xEnd - note.x, 6);
								context.fill();
							}
						} else if (previousBeams < beams) {
							if (previousBeams > nextBeams) {
								for (let i = previousBeams; i < beams; i++) {
									context.beginPath();
									context.rect(note.x - 20, y - height + 10 * i, 20, 6);
									context.fill();
								}
							} else { // previousBeams === nextBeams
								if (timeLengthPassed.add(note.trueLength).mod(note.trueLength).d < note.trueLength.d) {
									for (let i = previousBeams; i < beams; i++) {
										context.beginPath();
										context.rect(note.x - 20, y - height + 10 * i, 20, 6);
										context.fill();
									}
								} else {
									for (let i = nextBeams; i < beams; i++) {
										context.beginPath();
										context.rect(note.x, y - height + 10 * i, 20, 6);
										context.fill();
									}
								}
							}
						}
					} else {
						for (let i = nextBeams; i < beams; i++) {
							context.beginPath();
							context.rect(note.x, y - height + 10*i, 20, 6);
							context.fill();
						}
					}
				} else {
					for (let i = nextBeams; i < beams; i++) {
						context.beginPath();
						context.rect(note.x, y - height + 10*i, 20, 6);
						context.fill();
					}
				}
			}
		} else {
			context.lineWidth = 2;
			context.beginPath();
			context.moveTo(note.x, y0 - 5);
			if (note.length > 0)
				context.lineTo(note.x, y0 - 30);
			if (note.length > 3)
				context.lineTo(note.x, y0 - 30 - 10*(note.length - 3))
			context.stroke();
			if (note.length > 2) {
				for (let i = 0; i < note.length - 2; i++) {
					context.beginPath();
					context.moveTo(note.x, y0 - 30 - 10*i);
					context.bezierCurveTo(note.x+6, y0-30-10*i, note.x+16, y0-24-10*i, note.x+12, y0-8-10*i);
					context.bezierCurveTo(note.x+12, y0-20-10*i, note.x+6, y0-24-10*i, note.x, y0-24-10*i);
					context.fill();
				}
			}
		}
	} else if (previous) {
		if (beams > 0) {
			const previousBeams = this.getBeamsNumber(this.getLastNoteRecursive(previous));
			if (previousBeams > 0) {
				context.lineWidth = 2;
				context.beginPath();
				context.moveTo(note.x, y - 5);
				context.lineTo(note.x, y - height)
				context.stroke();
				if (previousBeams < beams) {
					for (let i = previousBeams; i < beams; i++) {
						context.beginPath();
						context.rect(note.x - 20, y - height + 10 * i, 20, 6);
						context.fill();
					}
				}
			} else {
				context.lineWidth = 2;
				context.beginPath();
				context.moveTo(note.x, y0 - 5);
				if (note.length > 0)
					context.lineTo(note.x, y0 - 30);
				if (note.length > 3)
					context.lineTo(note.x, y0 - 30 - 10*(note.length - 3))
				context.stroke();
				if (note.length > 2) {
					for (let i = 0; i < note.length - 2; i++) {
						context.beginPath();
						context.moveTo(note.x, y0 - 30 - 10*i);
						context.bezierCurveTo(note.x+6, y0-30-10*i, note.x+16, y0-24-10*i, note.x+12, y0-8-10*i);
						context.bezierCurveTo(note.x+12, y0-20-10*i, note.x+6, y0-24-10*i, note.x, y0-24-10*i);
						context.fill();
					}
				}
			}
		} else {
			context.lineWidth = 2;
			context.beginPath();
			context.moveTo(note.x, y0 - 5);
			if (note.length > 0)
				context.lineTo(note.x, y0 - 30);
			if (note.length > 3)
				context.lineTo(note.x, y0 - 30 - 10*(note.length - 3))
			context.stroke();
			if (note.length > 2) {
				for (let i = 0; i < note.length - 2; i++) {
					context.beginPath();
					context.moveTo(note.x, y0 - 30 - 10*i);
					context.bezierCurveTo(note.x+6, y0-30-10*i, note.x+16, y0-24-10*i, note.x+12, y0-8-10*i);
					context.bezierCurveTo(note.x+12, y0-20-10*i, note.x+6, y0-24-10*i, note.x, y0-24-10*i);
					context.fill();
				}
			}
		}
	} else {
		context.lineWidth = 2;
		context.beginPath();
		context.moveTo(note.x, y0 - 5);
		if (note.length > 0)
			context.lineTo(note.x, y0 - 30);
		if (note.length > 3)
			context.lineTo(note.x, y0 - 30 - 10*(note.length - 3))
		context.stroke();
		if (note.length > 2) {
			for (let i = 0; i < note.length - 2; i++) {
				context.beginPath();
				context.moveTo(note.x, y0 - 30 - 10*i);
				context.bezierCurveTo(note.x+6, y0-30-10*i, note.x+16, y0-24-10*i, note.x+12, y0-8-10*i);
				context.bezierCurveTo(note.x+12, y0-20-10*i, note.x+6, y0-24-10*i, note.x, y0-24-10*i);
				context.fill();
			}
		}
	}
	context.restore();
	for (let i = 0; i < note.multiplicity; i++) {
		this.drawNoteHead(bitmap, note.x, y0 + i*10, note.length > 1, shouldHit ? 'white' : 'dimgray');
	}
	if (note.hold) {
		context.save();
		context.lineWidth = 5;
		context.strokeStyle = 'white';
		for (let i = 0; i < note.multiplicity; i++) {
			context.beginPath();
			context.moveTo(shouldHit ? note.x + 5 : note.x - 6, y0 + 10*i);
			context.lineTo(note.xEnd - 5, y0+10*i)
			context.stroke();
		}
		context.restore();
	}
	bitmap._setDirty();
};

Beatmap.prototype.drawBarline = function (bitmap, x) {
	const context = bitmap._context;
	context.globalCompositeOperation = 'destination-over';
	bitmap.fillRect(x, TyphmConstants.LINES_HEIGHT / 4, 1, TyphmConstants.LINES_HEIGHT/2, 'dimgray');
	context.globalCompositeOperation = 'source-over';
};

Beatmap.prototype.drawRest = function (bitmap, note, y) {
	if (note.length === 0) {
		bitmap.fillRect(note.x - 6, y, 12, 6, 'dimgray');
	} else if (note.length === 1) {
		bitmap.fillRect(note.x - 6, y - 6, 12, 6, 'dimgray');
	} else if (note.length === 2) {
		const context = bitmap._context;
		context.save();
		context.strokeStyle = 'dimgray';
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
		const y0 = y - Math.ceil(heads/2)*10 + 5;
		for (let i = 0; i < heads; i++) {
			bitmap.drawCircle(note.x - 5, y0 + i*10, 3, 'dimgray');
		}
		const context = bitmap._context;
		context.save();
		context.strokeStyle = 'dimgray';
		context.lineWidth = 2;
		context.beginPath();
		for (let i = 0; i < heads; i++) {
			context.moveTo(note.x - 5, y0 + i*10 + 3);
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
	context.fillStyle = "dimgray";
	for (let i = 0; i < note.dots; i++) {
		context.beginPath();
		context.arc(note.x+10+5*i, y, 2, 0, 2*Math.PI);
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
	context.arc(x, y, 5, -Math.PI/2, Math.PI*1.5);
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
	context.fillStyle = 'white';
	context.strokeStyle = 'white';
	const x = 32;
	const y = 160 + (beatNote - 3)*10;
	for (let i = 0; i < dots; i++) {
		context.beginPath();
		context.arc(x+10+5*i, y, 2, 0, 2*Math.PI);
		context.fill();
	}
	context.beginPath();
	context.arc(x, y, 5, -Math.PI/2, Math.PI*1.5);
	if (beatNote > 1)
		context.fill();
	if (beatNote > 0)
		context.lineTo(x, y - 30);
	if (beatNote > 3)
		context.lineTo(x, y - 30 - 10*(beatNote - 3))
	context.stroke();
	if (beatNote > 2) {
		for (let i = 0; i < beatNote - 2; i++) {
			context.beginPath();
			context.moveTo(x, y - 30 - 10*i);
			context.bezierCurveTo(x+6, y-30-10*i, x+16, y-24-10*i, x+12, y-8-10*i);
			context.bezierCurveTo(x+12, y-20-10*i, x+6, y-24-10*i, x, y-24-10*i);
			context.fill();
		}
	}
	context.restore();
	bitmap.drawText(`= ${bpm}`, x+20+5*dots, y-30, 200, 40, 'left')
	bitmap._setDirty();
};

Beatmap.prototype.clearNote = function (event, judge) {
	let color;
	if (judge === 'perfect')
		color = 'yellow';
	else if (judge === 'good')
		color = 'blue';
	else if (judge === 'bad')
		color = 'green';
	else if (judge === 'miss')
		color = 'red';
	this.drawNoteHead(this.lines[event.lineno], event.x, event.y, event.solid, color);
};
