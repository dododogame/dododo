function BeatmapExpressionError() {
	this.initialize.apply(this, arguments);
}

BeatmapExpressionError.prototype = Object.create(Error.prototype);
BeatmapExpressionError.prototype.constructor = BeatmapExpressionError;

BeatmapExpressionError.prototype.initialize = function (expressionHolder, formula, error, backtrace, currentX) {
	const xIndicator = currentX === undefined ? '' : ` at x = ${currentX}`;
	const message = `${expressionHolder}: error occurs while evaluating ${formula}${xIndicator}: ${error.message}`;
	Error.call(this, message);
	this.message = message;
	this.expressionHolder = expressionHolder;
	this.formula = formula;
	this.error = error;
	this.currentX = currentX;
	this.backtrace = backtrace;
};
