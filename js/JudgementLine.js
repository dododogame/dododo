function JudgementLine () {
	this.initialize.apply(this, arguments);
}

JudgementLine.prototype.initialize = function (row) {
	this._row = row;
	this.xFormula = x => Number(x);
	this.yFormula = x => 0;
	this.redFormula = x => 1;
	this.greenFormula = x => 1;
	this.blueFormula = x => 1;
	this.alphaFormula = x => 1;
	this.widthFormula = x => 1;
	this.heightFormula = x => this._row.voicesNumber * preferences.voicesHeight;
	this.blendMode = 'NORMAL';
};

JudgementLine.prototype.applyToSprite = function (sprite, lengthPosition, rowY, mirror) {
	sprite.x = preferences.margin + this.xFormula(lengthPosition) * (Graphics.width - 2*preferences.margin);
	if (mirror)
		sprite.x = Graphics.width - sprite.x;
	sprite.y = rowY - this.yFormula(lengthPosition);
	sprite.scale.x = this.widthFormula(lengthPosition);
	sprite.scale.y = this.heightFormula(lengthPosition);
	sprite.bitmap.clear();
	sprite.bitmap.fillAll(TyphmUtils.fromRGBAToHex(
		this.redFormula(lengthPosition), this.greenFormula(lengthPosition),
		this.blueFormula(lengthPosition), this.alphaFormula(lengthPosition)));
	sprite.blendMode = PIXI.BLEND_MODES[this.blendMode]
};

JudgementLine.prototype.setAttribute = function (attribute, parameters) {
	switch (attribute) {
		case 'x':
		case 'y':
		case 'width':
		case 'height':
		case 'red':
		case 'green':
		case 'blue':
		case 'alpha':
			this[attribute.fromSnakeToCamel() + 'Formula'] = ControlSentence.generateFunction(parameters, this._row._beatmap);
			break;
		case 'blend_mode':
			this.blendMode = parameters[0].toUpperCase();
	}
};
