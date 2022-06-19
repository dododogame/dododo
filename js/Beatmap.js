function Beatmap () {
	this.initialize.apply(this, arguments);
}

Beatmap.TRUE_LENGTH_CALC = fracmath.parse('(1/2)^length*(2-(1/2)^dots)').compile();
Beatmap.TRUE_LENGTH_CALC = Beatmap.TRUE_LENGTH_CALC.evaluate.bind(Beatmap.TRUE_LENGTH_CALC);

Beatmap.DEFAULT_ALIASES = {
	beats_per_minute: 'bpm',
	milliseconds_per_whole: 'ms_per_whole',
	space_x: 'judgement_line_x',
	space_y: 'judgement_line_y',
	width: 'judgement_line_width',
	height: 'judgement_line_height',
	red: 'judgement_line_red',
	green: 'judgement_line_green',
	blue: 'judgement_line_blue',
	alpha: 'judgement_line_alpha',
	opacity: 'judgement_line_alpha',
	judgement_line_opacity: 'judgement_line_alpha',
	fake_judge_line: 'fake_judgement_line'
};

Beatmap.prototype.initialize = function (url) {
	this.url = url;
};

Beatmap.prototype.load = async function () {
	let [head, data] = eol.lf(await fetch(this.url).then(r => r.text())).split('---\n');
	head = head.split('\n').map(s => s.split(': '));
	for (let i = 0; i < head.length; i++) {
		if (head[i].length > 2)
			head[i] = [head[i][0], head[i].slice(1).join(': ')];
		else if (head[i].length === 1)
			head[i][1] = '';
	}
	const dataLineno = head.length + 1;
	head = Object.fromEntries(head);
	data = data.split('\n');
	this.title = head.title || '';
	this.audioUrl = head.audioUrl;
	this.musicAuthor = head.musicAuthor || '';
	this.beatmapAuthor = head.beatmapAuthor || '';
	this.difficulty = head.difficulty || Strings.defaultDifficulty;
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
		if (line[0] === '#') { // comments
		} else if (TyphmUtils.isCapitalized(line)) { // control sequence
			let [name, ...parameters] = line.split(' ');
			let i = 0;
			for (; i < parameters.length && parameters[i][0] !== '#'; i++);
			this.events.push({"event": name.toLowerCase(), "parameters": parameters.slice(0, i), "lineno": lineno + dataLineno});
		} else if (line === '') { // new row
			this.events.push({"event": "row", "voices": voices, "lineno": lineno + dataLineno});
			voices = [];
		} else { // voice
			voices.push([]);
			let stackLevel = 0;
			let position = 0;
			while (position < line.length) {
				if (line[position] === '#') {
					break;
				}
				if (line[position] === '(') { // group start
					voices.push([]); // use voices as a stack... will pop!
					position++;
					stackLevel++;
					continue;
				}
				if (line[position] === '|') { // barline
					voices.last().push({"event": "barline", "lineno": lineno + dataLineno, "column": position + 1});
					position++;
					continue;
				}
				if (line[position] === ' ') {
					position++;
					continue;
				}
				
				// start parsing a note here!
				const noteEvent = {"event": "note", "lineno": lineno + dataLineno, "column": position + 1};
				
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
				
				// big
				if (line[position] === '*') {
					noteEvent.big = true;
					position++;
				} else
					noteEvent.big = false;
				
				// tie
				if (line[position] === '~') {
					noteEvent.tie = true;
					position++;
				} else
					noteEvent.tie = false;
				
				// end parsing a note here!
				voices.last().push(noteEvent);
				
				while (line[position] === ')') { // group end
					position++;
					stackLevel--;
					if (stackLevel < 0) {
						throw new BeatmapError(lineno + dataLineno, position + 1, 'excess right parentheses');
					}
					const group = voices.pop();
					const groupEvent = {"event": "group", "notes": group, "lineno": lineno + dataLineno, "column": position + 1};
					if (TyphmUtils.isDigit(line[position])) {
						groupEvent.ratio1 = TyphmUtils.parseDigit(line[position]);
						position++;
						if (TyphmUtils.isDigit(line[position])) {
							groupEvent.ratio2 = TyphmUtils.parseDigit(line[position]);
							groupEvent.ratio = frac(groupEvent.ratio2, groupEvent.ratio1);
							position++;
						} else { // default value of ratio2 is 2 ** floor(log2(ratio1))
							groupEvent.ratio2 = null;
							let i = 0;
							for (let x = groupEvent.ratio1; x >>= 1; i++);
							groupEvent.ratio = frac(2).pow(i).div(groupEvent.ratio1);
						}
					} else {
						groupEvent.ratio1 = null;
						groupEvent.ratio2 = null;
						groupEvent.ratio = frac(1);
					}
					voices.last().push(groupEvent);
				}
			}
			if (stackLevel > 0) {
				throw new BeatmapError(lineno + dataLineno, position + 1, 'missed right parentheses');
			}
		}
	}
}

Beatmap.prototype.drawRows = function (reverseVoices) {
	Row.prepare();
	this.rows = [new Row(this)];
	this.notes = [];
	this.barLines = [];
	let lastRowNotes = [];
	let lastRowEndTime = this.offset;
	let lastBPM = undefined;
	let lastBeatLength = 2;
	let lastBeatDots = 0;
	let lastMillisecondsPerWhole = 2000;
	for (let i = 0; i < this.events.length; i++) {
		const event = this.events[i];
		const row = this.rows.last();
		event.event = Beatmap.DEFAULT_ALIASES[event.event] || event.event;
		if (event.event === 'bpm') {
			[lastBPM, lastBeatLength, lastBeatDots] = row.setUpBPM(event.parameters, lastBPM, lastBeatLength, lastBeatDots);
		} else if (event.event === 'ms_per_whole') {
			row.millisecondsPerWhole = parseFloat(event.parameters[0]);
		} else if (event.event === 'perfect' || event.event === 'good' || event.event === 'bad') {
			row[event.event] = parseFloat(event.parameters[0]);
		} else if (event.event === 'fake_judgement_line') {
			row.fakeJudgementLines ||= [];
			row.fakeJudgementLines.push(new JudgementLine(row));
		} else if (event.event.startsWith('judgement_line_')) {
			row.setJudgementLineAttribute(event.event.slice('judgement_line_'.length), event.parameters);
		} else if (event.event === 'note_x') {
			row.noteXFormula = TyphmUtils.generateFunctionFromFormula(event.parameters.join(' '));
		} else if (event.event === 'hit_x') {
			row.hitXFormula = TyphmUtils.generateFunctionFromFormula(event.parameters.join(' '));
		} else if (event.event === 'blend_mode') {
			(row.fakeJudgementLines ? row.fakeJudgementLines.last() : row.judgementLine).blend_mode = event.parameters[0];
		} else if (event.event === 'row') {
			row.index = this.rows.length - 1;
			row.startTime = lastRowEndTime;
			row.voices = event.voices;
			row.voicesNumber = event.voices.length;
			lastMillisecondsPerWhole = row.setMillisecondsPerWholeIfHasnt(lastBPM, lastBeatLength, lastBeatDots, lastMillisecondsPerWhole);
			row.setXFormulasIfHasnt();
			row.drawBPMIfHas();
			row.setTotalLength();
			lastRowNotes = row.drawVoicesAndGetLastNotes(reverseVoices, lastRowNotes);
			lastRowEndTime = row.setEndTime();
			this.rows.push(new Row(this));
		}
	}
	this.notes.sort((n1, n2) => n1.time - n2.time);
};

Beatmap.prototype.recordHitEvent = function (rowIndex, note, y, shouldHit) {
	y -= (note.multiplicity - 1) * preferences.headsRadius;
	if (shouldHit) {
		note.hitEvents = [];
		for (let i = 0; i < note.multiplicity; i++) {
			const hitEvent = {"x": note.x, "hitX": note.hitX, "y": y+i*preferences.headsRadius*2, "xEnd": note.xEnd, "time": note.time, "timeEnd": note.timeEnd,
				"big": note.big, "hold": note.hold, "solid": note.length > 1, "rowIndex": rowIndex};
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
			tiedNote.hitEvents[i].ySwitches.push({"time": note.time, "y": y + i*preferences.headsRadius*2, "rowIndex": rowIndex});
		}
		note.hold = tiedNote.hold;
	}
};

Beatmap.prototype.trackHoldTo = function (now, xNow, hitEvent, judge, row) {
	let y = hitEvent.y;
	let x = hitEvent.x + preferences.headsRadius;
	let eventRowIndex = hitEvent.rowIndex;
	//let reachedEnd = true;
	if (hitEvent.ySwitches) {
		for (let i = 0; i < hitEvent.ySwitches.length; i++) {
			if (now >= hitEvent.ySwitches[i].time) {
				y = hitEvent.ySwitches[i].y;
				if (eventRowIndex !== hitEvent.ySwitches[i].rowIndex) {
					x = preferences.margin;
					eventRowIndex = hitEvent.ySwitches[i].rowIndex;
				}
			} else {
				//reachedEnd = false;
				break;
			}
		}
	}
	if (eventRowIndex !== row.index)
		return;
	//if (reachedEnd)
	//	xNow = Math.min(xNow, hitEvent.xEnd - preferences.headsRadius);
	row.trackHold(x, xNow, y, judge);
};

Beatmap.prototype.clearNote = function (event, judge) {
	this.rows[event.rowIndex].drawNoteHead(event.x, event.y, event.solid, false, Scene_Game.getColorFromJudge(judge));
};
