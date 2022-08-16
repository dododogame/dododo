function SoftWrapText() {
	this.initialize.apply(this, arguments);
}

SoftWrapText.prototype.initialize = function (text, x, y, width, height, align) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.text = text;
	this.align = align;
	this.anchor = new Point(0, 0);
	this.visible = true;
	this._div = document.createElement('div');
	this._div.style = `
		position: absolute;
		z-index: 10;
		font-family: GameFont;
		color: ${preferences.textColor};
	`;
	document.body.appendChild(this._div);
	this._resizeEventListener = this.refresh.bind(this);
	window.addEventListener('resize', this._resizeEventListener);
	this._fullscreenChangeListener = this.refresh.bind(this);
	document.addEventListener('fullscreenchange', this._fullscreenChangeListener);
	this._switchStretchModeListener = this.refresh.bind(this);
	Graphics.addSwitchStretchModeListener(this._switchStretchModeListener);
	this.refresh();
};

SoftWrapText.prototype.refresh = function () {
	this._div.style.visibility = this.visible ? 'visible' : 'hidden';
	this._div.style.top = `${Graphics._canvas.offsetTop + (this.y - this.anchor.y * this.height) * Graphics._realScale}px`;
	this._div.style.left = `${Graphics._canvas.offsetLeft + (this.x - this.anchor.x * this.width) * Graphics._realScale}px`;
	this._div.style.width = `${this.width * Graphics._realScale}px`;
	this._div.style.height = `${this.height * Graphics._realScale}px`;
	this._div.style.textAlign = this.align || 'left';
	this._div.style.fontSize = `${preferences.fontSize * Graphics._realScale}px`;
	this._div.style.lineHeight = `${preferences.textHeight * Graphics._realScale}px`;
	this._div.innerText = this.text;
};

SoftWrapText.prototype.destroy = function () {
	window.removeEventListener('resize', this._resizeEventListener);
	document.removeEventListener('fullscreenchange', this._fullscreenChangeListener);
	Graphics.removeSwitchStretchModeListener(this._switchStretchModeListener);
	document.body.removeChild(this._div);
};
