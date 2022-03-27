function BeatmapError() {
	this.initialize.apply(this, arguments);
}

BeatmapError.prototype = Object.create(Error.prototype);
BeatmapError.prototype.constructor = Error;

BeatmapError.prototype.initialize = function (lineno, column, message) {
	Error.call(this, message);
	this.lineno = lineno;
	this.column = column;
}
