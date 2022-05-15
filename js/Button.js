function Button() {
	this.initialize.apply(this, arguments);
}

Button.prototype = Object.create(Sprite.prototype);
Button.prototype.constructor = Button;

Button.prototype.initialize = function (bitmap, onclick) {
	Sprite.prototype.initialize.call(this, bitmap);
	this.onclick = onclick;
};

Button.prototype.update = function () {
	if (this.visible & TouchInput.isTriggered() && this.isInside(TouchInput.x, TouchInput.y))
		this.onclick();
};

Button.prototype.isInside = function (x, y) {
	const xMin = this.x - this.width * this.anchor.x;
	const xMax = xMin + this.width;
	const yMin = this.y - this.height * this.anchor.y;
	const yMax = yMin + this.height;
	return x >= xMin && x < xMax && y >= yMin && y < yMax;
}

Button.prototype.onclick = function () {
};
