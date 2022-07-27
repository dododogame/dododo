function InGameText () {
	this.initialize.apply(this, arguments);
}

InGameText.prepare = function () {
	this.sizeSource = new Bitmap(1, 1);
};

InGameText.prototype.initialize = function (row) {
	this._row = row;
	this.xFormula = x => 0.5;
	this.yFormula = x => 0;
	this.zFormula = x => 0;
	this.anchorXFormula = x => 0.5;
	this.anchorYFormula = y => 0.5;
	this.scaleXFormula = x => 1;
	this.scaleYFormula = x => 1;
	this.rotationFormula = x => 0;
	this.redFormula = x => 1;
	this.greenFormula = x => 1;
	this.blueFormula = x => 1;
	this.alphaFormula = x => 1;
	this.textFormula = x => '';
	this.blendMode = 'NORMAL';
};

InGameText.prototype.applyToSprite = function (sprite, lengthPosition, rowY, mirror) {
	sprite.x = preferences.margin + this.xFormula(lengthPosition) * (Graphics.width - 2*preferences.margin);
	sprite.y = rowY - this.yFormula(lengthPosition);
	sprite.zIndex = this.zFormula(lengthPosition);
	sprite.scale.x = this.scaleXFormula(lengthPosition);
	sprite.scale.y = this.scaleYFormula(lengthPosition);
	sprite.anchor.x = this.anchorXFormula(lengthPosition);
	sprite.anchor.y = this.anchorYFormula(lengthPosition);
	sprite.rotation = this.rotationFormula(lengthPosition);
	const text = this.textFormula(lengthPosition);
	sprite.bitmap = new Bitmap(InGameText.sizeSource.measureTextWidth(text), preferences.textHeight);
	sprite.bitmap.textColor = TyphmUtils.fromRGBAToHex(
		this.redFormula(lengthPosition), this.greenFormula(lengthPosition),
		this.blueFormula(lengthPosition), this.alphaFormula(lengthPosition));
	sprite.bitmap.drawText(text, 0, 0, sprite.bitmap.width, preferences.textHeight, 'left');
	sprite.blendMode = PIXI.BLEND_MODES[this.blendMode]
	if (mirror) {
		sprite.x = Graphics.width - sprite.x;
		sprite.anchor.x = 1 - sprite.anchor.x;
		sprite.rotation *= -1;
	}
};

InGameText.prototype.setAttribute = function (attribute, parameters) {
	switch (attribute) {
		case 'x':
		case 'y':
		case 'z':
		case 'anchor_x':
		case 'anchor_y':
		case 'rotation':
		case 'scale_x':
		case 'scale_y':
		case 'red':
		case 'green':
		case 'blue':
		case 'alpha':
			this[attribute.fromSnakeToCamel() + 'Formula'] = ControlSentence.generateFunction(parameters, this._row._beatmap);
			break;
		case 'text':
			this.textFormula = this._row._beatmap.generateFunctionFromFormula(parameters.join(' '));
			break;
		case 'blend_mode':
			this.blendMode = parameters[0].toUpperCase();
	}
};
