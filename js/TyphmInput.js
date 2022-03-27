function TyphmInput() {
	this.initialize.apply(this, arguments);
}

TyphmInput.prototype.initialize = function () {
	this._input = document.createElement('input');
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = TyphmConstants.TEXT_HEIGHT;
	this.anchor = new Point(0, 0);
	this._input.style = `
		background-color: rgba(0,0,0,0);
		border: none;
		outline: 0;
		box-shadow: none;
		font-size: 28px;
		position: absolute;
		font-family: GameFont;
		color: rgba(255,255,255,1);
		z-index: 10;
	`;
	document.body.appendChild(this._input);
	this._resizeEventListener = this.refresh.bind(this);
	window.addEventListener('resize', this._resizeEventListener);
};

TyphmInput.prototype.focus = function () {
	this._input.focus();
};

TyphmInput.prototype.blur = function () {
	this._input.blur();
};

TyphmInput.prototype.setType = function (type) {
	this._input.type = type;
};

TyphmInput.prototype.setPlaceholder = function (placeholder) {
	this._input.placeholder = placeholder;
};

TyphmInput.prototype.setValue = function (value) {
	this._input.value = value;
};

TyphmInput.prototype.setAttribute = function (attribute, value) {
	this._input[attribute] = value;
};

TyphmInput.prototype.setTextAlign = function (textAlign) {
	this._input.style.textAlign = textAlign;
};

TyphmInput.prototype.destroy = function () {
	window.removeEventListener('resize', this._resizeEventListener);
	document.body.removeChild(this._input);
};

TyphmInput.prototype.refresh = function () {
	this._input.style.top = `${Graphics._canvas.offsetTop + this.y - this.anchor.y * this.height}px`;
	this._input.style.left = `${Graphics._canvas.offsetLeft + this.x - this.anchor.x * this.width}px`;
	this._input.style.width = `${this.width - 4}px`;
	this._input.style.height = `${this.height - 4}px`;
};

TyphmInput.prototype.value = function () {
	return this._input.value;
};
