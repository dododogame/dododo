function ControlSentence () {
	this.initialize.apply(this, arguments);
}

ControlSentence.DEFAULT_ALIASES = {
	beats_per_minute: 'bpm',
	milliseconds_per_whole: 'ms_per_whole',
	judgement_line_opacity: 'judgement_line_alpha',
	variable: 'var',
	define: 'def',
	function: 'fun',
	// following are obsolete
	space_x: 'judgement_line_x',
	space_y: 'judgement_line_y',
	width: 'judgement_line_width',
	height: 'judgement_line_height',
	red: 'judgement_line_red',
	green: 'judgement_line_green',
	blue: 'judgement_line_blue',
	alpha: 'judgement_line_alpha',
	opacity: 'judgement_line_alpha',
	blend_mode: 'judgement_line_blend_mode',
	fake_judge_line: 'fake_judgement_line'
};

ControlSentence.PREDEFINED_KEYWORDS = [
	'comment',
	'bpm',
	'ms_per_whole',
	'judgement_line_x',
	'judgement_line_y',
	'judgement_line_width',
	'judgement_line_height',
	'judgement_line_red',
	'judgement_line_green',
	'judgement_line_blue',
	'judgement_line_alpha',
	'judgement_line_blend_mode',
	'fake_judgement_line',
	'let',
	'def',
	'var',
	'fun',
	'delete',
	'unprecedure',
	'alias',
	'if',
	'while',
	'for',
	//'try', TODO
	'procedure',
	//'schedule', TODO
	'break'
];

ControlSentence.KEYWORDS_REQUIRING_LAST_ENV = [
	'bpm'
];

ControlSentence.BLOCK_SEPARATORS = {
	if: ['else', 'else_if'],
	while: [],
	for: [],
	//try: ['rescue'],
	procedure: [],
	//schedule: []
};

ControlSentence.prototype.initialize = function (keyword, parameters, beatmap) {
	this.parameters = parameters;
	this._beatmap = beatmap;
	while (this._beatmap.aliases[keyword])
		keyword = this._beatmap.aliases[keyword];
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
	this['apply' + this.keyword.fromSnakeToCamel().capitalizeFirstLetter()](row, callers);
};

ControlSentence.prototype.applyBpm = function (row, callers) {
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

ControlSentence.prototype.applyMsPerWhole = function (row, callers) {
	const input = this.parameters[0];
	row.millisecondsPerWhole = parseFloat(input);
	if (!row.millisecondsPerWhole) {
		throw new BeatmapRuntimeError(`MS_PER_WHOLE: invalid number: ${input}`, callers);
	} else if (row.millisecondsPerWhole <= 0) {
		throw new BeatmapRuntimeError(`MS_PER_WHOLE: cannot be zero or negative: ${input}`, callers);
	}
};

for (const judge of ['perfect', 'good', 'bad']) {
	ControlSentence.prototype['apply' + judge.capitalizeFirstLetter()] = function (row, callers) {
		const judgementWindowRadiusString = this.parameters[0];
		row[judge] = parseFloat(judgementWindowRadiusString);
		if (!row[judge]) {
			throw new BeatmapRuntimeError(`${judge.toUpperCase()}: invalid number: ${judgementWindowRadiusString}`, callers);
		} else if (row[judge] < 0) {
			throw new BeatmapRuntimeError(`${judge.toUpperCase()}: judgement window radius is negative: ${judgementWindowRadiusString}`, callers);
		}
	};
}

ControlSentence.prototype.applyFakeJudgementLine = function (row, callers) {
	row.fakeJudgementLines ||= [];
	row.fakeJudgementLines.push(new JudgementLine(row));
};

for (const attr of ['x', 'y', 'width', 'height', 'red', 'green', 'blue', 'alpha', 'blend_mode']) {
	ControlSentence.prototype['applyJudgementLine' + attr.fromSnakeToCamel().capitalizeFirstLetter()] = function (row, callers) {
		(row.fakeJudgementLines ? row.fakeJudgementLines.last() : row.judgementLine).setAttribute(attr, this.parameters);
	};
}

for (const attr of ['note_x', 'hit_x', 'bar_line_x', 'time']) {
	ControlSentence.prototype['apply' + attr.fromSnakeToCamel().capitalizeFirstLetter()] = function (row, callers) {
		row[this.keyword.fromSnakeToCamel() + 'Formula'] = ControlSentence.generateFunction(this.parameters, this._beatmap);
	};
}

ControlSentence.prototype.applyLet = function (row, callers) {
	const name = this.parameters[0];
	if (ControlSentence.checkVariableName(name))
		this._beatmap.letExpression(name, this.parameters.slice(1).join(' '));
	else
		throw new BeatmapRuntimeError(`LET: invalid variable name: ${name}`, callers);
};

ControlSentence.prototype.applyDef = function (row, callers) {
	const name = this.parameters[0];
	if (ControlSentence.checkVariableName(name))
		this._beatmap.defExpression(name, this.parameters[1].split(','), this.parameters.slice(2).join(' '));
	else
		throw new BeatmapRuntimeError(`DEF: invalid variable name: ${name}`, callers);
};

ControlSentence.prototype.applyVar = function (row, callers) {
	const name = this.parameters[0];
	if (ControlSentence.checkVariableName(name))
		this._beatmap.varExpression(name, this.parameters.slice(1).join(' '));
	else
		throw new BeatmapRuntimeError(`VAR: invalid variable name: ${name}`, callers);
};

ControlSentence.prototype.applyFun = function (row, callers) {
	const name = this.parameters[0];
	if (ControlSentence.checkVariableName(name))
		this._beatmap.funExpression(name, this.parameters[1].split(','), this.parameters.slice(2).join(' '));
	else
		throw new BeatmapRuntimeError(`VAR: invalid variable name: ${name}`, callers);
};

ControlSentence.checkVariableName = function (name) {
	return /[a-zA-Z_][a-zA-Z\d]*/.test(name);
};

ControlSentence.generateFunction = function (formulaParts, beatmap) {
	return TyphmUtils.generateFunctionFromFormula(formulaParts.join(' '), beatmap.getEnvironments(), beatmap);
};
