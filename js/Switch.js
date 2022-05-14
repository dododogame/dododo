function Switch() {
	this.initialize.apply(this, arguments);
}

Switch.prototype = Object.create(Button.prototype);
Switch.prototype.constructor = Switch;

Switch.prototype.initialize = function (value) {
	Button.prototype.initialize.call(this, new Bitmap(64, preferences.textHeight), this.toggle);
	this.value = value;
	this.refresh();
};

Switch.prototype.toggle = function () {
	this.value = !this.value;
	this.refresh();
};

Switch.prototype.refresh = function () {
	this.bitmap.clear();
	this.bitmap.drawText(this.value ? 'ON' : 'OFF', 0, 0, 64, preferences.textHeight, 'right');
};
