function BeatmapRuntimeError() {
	this.initialize.apply(this, arguments);
}

BeatmapRuntimeError.prototype = Object.create(Error.prototype);
BeatmapRuntimeError.prototype.constructor = BeatmapRuntimeError;

BeatmapRuntimeError.prototype.initialize = function (message, backtrace) {
	Error.call(this, message);
	this.message = message;
	this.backtrace = backtrace;
};
