function TyphmInput() {
	this.initialize.apply(this, arguments);
}

TyphmInput.prototype.initialize = function (selectItems) {
	if (selectItems){
		this._input = document.createElement('select');
		this._input.innerHTML = selectItems.map(
			([value, text]) => `<option value="${value}">${text}</option>`).join('');
		for (const option of this._input.querySelectorAll('option')) {
			option.style.backgroundColor = preferences.backgroundColor;
		}
	} else {
		this._input = document.createElement('input');
	}
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = preferences.textHeight;
	this.anchor = new Point(0, 0);
	this._input.style = `
		background-color: ${preferences.backgroundColor};
		border: none;
		outline: 0;
		box-shadow: none;
		font-size: ${preferences.fontSize}px;
		position: absolute;
		font-family: GameFont;
		color: ${preferences.textColor};
		z-index: 10;
	`;
	document.body.appendChild(this._input);
	this.visible = true;
	this._value = this._input.value;
	this._resizeEventListener = this.refresh.bind(this);
	window.addEventListener('resize', this._resizeEventListener);
	this._input.addEventListener('change', () => { this._value = this._input.value; });
};

TyphmInput.prototype.focus = function () {
	this._input.focus();
};

TyphmInput.prototype.blur = function () {
	this._input.blur();
};

TyphmInput.prototype.select = function () {
	this._input.select();
};

TyphmInput.prototype.setType = function (type) {
	this._input.type = type;
};

TyphmInput.prototype.setAttribute = function (attribute, value) {
	this._input[attribute] = value;
};

TyphmInput.prototype.getAttribute = function (attribute, value) {
	return this._input[attribute];
};

TyphmInput.prototype.setTextAlign = function (textAlign) {
	this._input.style.textAlign = textAlign;
};

TyphmInput.prototype.click = function () {
	this._input.click();
};

TyphmInput.prototype.setOpacity = function (opacity) {
	this._input.style.opacity = opacity;
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

Object.defineProperty(TyphmInput.prototype, 'value', {
	get: function () {
		return this._value;
	},
	set: function (value) {
		this._value = value;
		this._input.value = value;
	}
});

Object.defineProperty(TyphmInput.prototype, 'visible', {
	get: function () {
		return this._visible;
	},
	set: function (visibility) {
		this._visible = visibility;
		if (visibility) {
			this._input.style.visibility = 'visible';
		} else {
			this._input.style.visibility = 'hidden';
		}
	}
});
