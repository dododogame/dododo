function ControlSentence () {
	this.initialize.apply(this, arguments);
}

ControlSentence.DEFAULT_ALIASES = {
	BEATS_PER_MINUTE: 'BPM',
	MILLISECONDS_PER_WHOLE: 'MS_PER_WHOLE',
	JUDGEMENT_LINE_OPACITY: 'JUDGEMENT_LINE_ALPHA',
	VARIABLE: 'VAR',
	DEFINE: 'DEF',
	FUNCTION: 'FUN',
	// FOLLOWING ARE OBSOLETE
	SPACE_X: 'JUDGEMENT_LINE_X',
	SPACE_Y: 'JUDGEMENT_LINE_Y',
	WIDTH: 'JUDGEMENT_LINE_WIDTH',
	HEIGHT: 'JUDGEMENT_LINE_HEIGHT',
	RED: 'JUDGEMENT_LINE_RED',
	GREEN: 'JUDGEMENT_LINE_GREEN',
	BLUE: 'JUDGEMENT_LINE_BLUE',
	ALPHA: 'JUDGEMENT_LINE_ALPHA',
	OPACITY: 'JUDGEMENT_LINE_ALPHA',
	BLEND_MODE: 'JUDGEMENT_LINE_BLEND_MODE',
	FAKE_JUDGE_LINE: 'FAKE_JUDGEMENT_LINE'
};

ControlSentence.KEYWORDS_REQUIRING_LAST_ENV = [
	'BPM'
];

ControlSentence.BLOCK_SEPARATORS = {
	IF: ['ELSE', 'ELSE_IF'],
	WHILE: [],
	FOR: [],
	//TRY: ['RESCUE'],
	PROCEDURE: [],
	//SCHEDULE: []
};

ControlSentence.prototype.initialize = function (keyword, parameters, lineno, beatmap) {
	this.parameters = parameters;
	this.lineno = lineno;
	this._beatmap = beatmap;
	this.keyword = keyword;
	const blockSeparators = ControlSentence.BLOCK_SEPARATORS[keyword];
	if (blockSeparators) {
		this.blockSeparators = blockSeparators;
		this.currentBlock = {main: true, beginning: this, contents: []};
		this.blocks = [this.currentBlock];
		this.hasOpenBlock = true;
	} else {
		this.hasOpenBlock = false;
	}
	this.requiresLastEnv = ControlSentence.KEYWORDS_REQUIRING_LAST_ENV.includes(keyword);
};

ControlSentence.prototype.addToBlock = function (controlSentence) {
	if (this.blockSeparators.includes(controlSentence.keyword)) {
		this.currentBlock = {main: false, beginning: controlSentence, contents: []};
		this.blocks.push(this.currentBlock);
	} else if (controlSentence.keyword === 'end') {
		this.hasOpenBlock = false;
	} else {
		this.currentBlock.contents.push(controlSentence);
	}
};

ControlSentence.prototype.applyTo = function (row, callers) {
	this._beatmap.controlSentenceApplications[this.keyword].call(this, row, callers);
};

ControlSentence.DEFAULT_APPLICATIONS = {};

ControlSentence.DEFAULT_APPLICATIONS.BPM = function (row, callers) {
	let normalizationDenominator = 0;
	const positions = [frac(0)];
	const durations = [0];
	row.BPMMarkers = [];
	const BPMData = this.parameters;
	
	for (let i = 0; i < BPMData.length; i += 3) {
		// beat note
		const beatNote = BPMData[i];
		if (!/[\da-z]\.*/.test(beatNote))
			throw new BeatmapRuntimeError(`BPM: invalid beat note: ${beatNote}`, callers);
		const length = TyphmUtils.parseDigit(beatNote[0]);
		const dots = beatNote.length - 1;
		
		// BPM
		const BPMString = BPMData[i + 1];
		const bpm = Number(BPMString);
		if (!bpm) {
			throw new BeatmapRuntimeError(`BPM: invalid BPM: ${BPMString}`);
		} else if (bpm <= 0)
			throw new BeatmapRuntimeError(`BPM: BPM is zero or negative: ${BPMString}`, callers);
		
		// position
		const positionString = BPMData[i + 2];
		let position
		try {
			position = frac(positionString || 0);
		} catch (e) {
			if (e.message === 'Invalid argument') {
				throw new BeatmapRuntimeError(`BPM: invalid position of BPM indicator: ${positionString}`, callers);
			} else
				throw e;
		}
		if (position.compare(1) > 0 || position.compare(0) < 0)
			throw new BeatmapRuntimeError(`BPM: position of BPM indicator is out of range [0,1]: ${positionString}`, callers)
		
		row.BPMMarkers.push({'length': length, 'dots': dots, 'bpm': bpm, 'position': position});
		if (i === 0 && position.compare(0) <= 0) {
			this.lastEnv.BPM = bpm;
			this.lastEnv.beatLength = length;
			this.lastEnv.beatDots = dots;
			continue;
		}
		const beatTrueLength = Beatmap.TRUE_LENGTH_CALC({'length': this.lastEnv.beatLength, 'dots': this.lastEnv.beatDots});
		const duration = numre('bignumber((position-lastPosition)/trueLength)/lastBPM',
			{'lastBPM':this.lastEnv.BPM,'trueLength':beatTrueLength,'position':position,'lastPosition':positions.last()||0});
		durations.push(normalizationDenominator = normalizationDenominator + duration);
		positions.push(position);
		this.lastEnv.BPM = bpm;
		this.lastEnv.beatLength = length;
		this.lastEnv.beatDots = dots;
	}
	const beatTrueLength = Beatmap.TRUE_LENGTH_CALC({'length': this.lastEnv.beatLength, 'dots': this.lastEnv.beatDots});
	const duration = numre('bignumber((position-lastPosition)/trueLength)/lastBPM',
		{'lastBPM':this.lastEnv.BPM,'trueLength':beatTrueLength,'position':frac(1),'lastPosition':positions.last()||0});
	durations.push(normalizationDenominator = normalizationDenominator + duration);
	positions.push(frac(1));
	row.millisecondsPerWhole = 60000*Number(normalizationDenominator);
	
	row.timeFormula = x => {
		let i = 0;
		for (; i < positions.length-1; i++) {
			if (Number(x) <= Number(positions[i+1]))
				break;
		}
		return numre('((d2 - d1)*(x - p1)/(p2 - p1) + d1)/d',
			{'x':Number(x),p1:Number(positions[i]),p2:Number(positions[i+1]),d1:durations[i],d2:durations[i+1],d:normalizationDenominator});
	};
};

ControlSentence.DEFAULT_APPLICATIONS.MS_PER_WHOLE = function (row, callers) {
	const input = this.parameters[0];
	row.millisecondsPerWhole = parseFloat(input);
	if (!row.millisecondsPerWhole) {
		throw new BeatmapRuntimeError(`MS_PER_WHOLE: invalid number: ${input}`, callers);
	} else if (row.millisecondsPerWhole <= 0) {
		throw new BeatmapRuntimeError(`MS_PER_WHOLE: cannot be zero or negative: ${input}`, callers);
	}
};

for (const judge of ['perfect', 'good', 'bad']) {
	const keyword = judge.toUpperCase();
	ControlSentence.DEFAULT_APPLICATIONS[keyword] = function (row, callers) {
		const judgementWindowRadiusString = this.parameters[0];
		row[judge] = parseFloat(judgementWindowRadiusString);
		if (!row[judge]) {
			throw new BeatmapRuntimeError(`${keyword}: invalid number: ${judgementWindowRadiusString}`, callers);
		} else if (row[judge] < 0) {
			throw new BeatmapRuntimeError(`${keyword}: judgement window radius is negative: ${judgementWindowRadiusString}`, callers);
		}
	};
}

ControlSentence.DEFAULT_APPLICATIONS.FAKE_JUDGEMENT_LINE = function (row, callers) {
	row.fakeJudgementLines ||= [];
	row.fakeJudgementLines.push(new JudgementLine(row));
};

for (const attr of ['x', 'y', 'width', 'height', 'red', 'green', 'blue', 'alpha', 'blend_mode']) {
	ControlSentence.DEFAULT_APPLICATIONS['JUDGEMENT_LINE_' + attr.toUpperCase()] = function (row, callers) {
		(row.fakeJudgementLines ? row.fakeJudgementLines.last() : row.judgementLine).setAttribute(attr, this.parameters);
	};
}

for (const attr of ['note_x', 'hit_x', 'bar_line_x', 'time']) {
	ControlSentence.DEFAULT_APPLICATIONS[attr.toUpperCase()] = function (row, callers) {
		row[attr.fromSnakeToCamel() + 'Formula'] = ControlSentence.generateFunction(this.parameters, this._beatmap);
	};
}

ControlSentence.DEFAULT_APPLICATIONS.LET = function (row, callers) {
	const name = this.parameters[0];
	if (ControlSentence.checkVariableName(name))
		this._beatmap.letExpression(name, this.parameters.slice(1).join(' '));
	else
		throw new BeatmapRuntimeError(`LET: invalid variable name: ${name}`, callers);
};

ControlSentence.DEFAULT_APPLICATIONS.DEF = function (row, callers) {
	const name = this.parameters[0];
	if (ControlSentence.checkVariableName(name))
		this._beatmap.defExpression(name, this.parameters[1].split(','), this.parameters.slice(2).join(' '));
	else
		throw new BeatmapRuntimeError(`DEF: invalid variable name: ${name}`, callers);
};

ControlSentence.DEFAULT_APPLICATIONS.VAR = function (row, callers) {
	const name = this.parameters[0];
	if (ControlSentence.checkVariableName(name))
		this._beatmap.varExpression(name, this.parameters.slice(1).join(' '));
	else
		throw new BeatmapRuntimeError(`VAR: invalid variable name: ${name}`, callers);
};

ControlSentence.DEFAULT_APPLICATIONS.FUN = function (row, callers) {
	const name = this.parameters[0];
	if (ControlSentence.checkVariableName(name))
		this._beatmap.funExpression(name, this.parameters[1].split(','), this.parameters.slice(2).join(' '));
	else
		throw new BeatmapRuntimeError(`VAR: invalid variable name: ${name}`, callers);
};

ControlSentence.DEFAULT_APPLICATIONS.ALIAS = function (row, callers) {
	const originalName = this.parameters.last();
	if (!this._beatmap.hasKeyword(originalName))
		throw new BeatmapRuntimeError(`ALIAS: keyword not found: ${originalName}`, callers);
	for (const newName of this.parameters.slice(0, this.parameters.length - 1)) {
		if (!ControlSentence.checkKeyword(newName))
			throw new BeatmapRuntimeError(`ALIAS: invalid keyword: ${newName}`, callers);
		if (newName === originalName)
			throw new BeatmapRuntimeError(`ALIAS: alias is the same as the original: ${newName}`);
		this._beatmap.defineKeywordAlias(newName, originalName);
	}
};

ControlSentence.DEFAULT_APPLICATIONS.UNPRECEDURE = function (row, callers) {
	for (const keyword of this.parameters) {
		if (!this._beatmap.hasKeyword(keyword))
			throw new BeatmapRuntimeError(`UNPRECEDURE: keyword not found: ${keyword}`, callers);
		this._beatmap.deleteKeyword(keyword);
	}
};

ControlSentence.DEFAULT_APPLICATIONS.COMMENT = function (row, callers) {
};

ControlSentence.checkVariableName = function (name) {
	return /[a-zA-Z_]\w*/y.test(name);
};

ControlSentence.checkKeyword = function (keyword) {
	return /[A-Z_]\w*/y.test(keyword);
};

ControlSentence.generateFunction = function (formulaParts, beatmap) {
	return TyphmUtils.generateFunctionFromFormula(formulaParts.join(' '), beatmap.getEnvironments(), beatmap);
};
