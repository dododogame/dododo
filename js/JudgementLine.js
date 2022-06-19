function JudgementLine () {
	this.initialize.apply(this, arguments);
}

JudgementLine.prototype.initialize = function (row) {
	this._row = row;
	this.space_xFormula = x => Number(x);
	this.space_yFormula = x => 0;
	this.redFormula = x => 1;
	this.greenFormula = x => 1;
	this.blueFormula = x => 1;
	this.alphaFormula = x => 1;
	this.widthFormula = x => 1;
	this.heightFormula = x => this._row.voicesNumber * preferences.voicesHeight;
	this.blend_mode = 'NORMAL';
};

JudgementLine.prototype.applyToSprite = function (sprite, lengthPosition, rowY, mirror) {
	sprite.x = preferences.margin + this.space_xFormula(lengthPosition) * (Graphics.width - 2*preferences.margin);
	if (mirror)
		sprite.x = Graphics.width - sprite.x;
	sprite.y = rowY - this.space_yFormula(lengthPosition);
	sprite.scale.x = this.widthFormula(lengthPosition);
	sprite.scale.y = this.heightFormula(lengthPosition);
	sprite.bitmap.clear();
	sprite.bitmap.fillAll(TyphmUtils.fromRGBAToHex(
		this.redFormula(lengthPosition), this.greenFormula(lengthPosition),
		this.blueFormula(lengthPosition), this.alphaFormula(lengthPosition)));
	sprite.blendMode = PIXI.BLEND_MODES[this.blend_mode.toUpperCase()]
};
