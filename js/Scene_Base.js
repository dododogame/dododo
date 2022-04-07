function Scene_Base() {
	this.initialize.apply(this, arguments);
}

Scene_Base.prototype = Object.create(Stage.prototype);
Scene_Base.prototype.constructor = Scene_Base;

Scene_Base.prototype.initialize = function () {
	Stage.prototype.initialize.call(this);
};

Scene_Base.prototype.start = function () {
};

Scene_Base.prototype.update = function() {
	this.updateChildren();
	if (window.scene !== this) {
		this.stop();
		window.scene.start();
	}
};

Scene_Base.prototype.stop = function () {
};

Scene_Base.prototype.updateChildren = function () {
	this.children.forEach(child => {
		if (child.update) child.update();
	});
};

Scene_Base.prototype._center = function (sprite, y) {
	sprite.anchor.x = 0.5;
	sprite.x = Graphics.width / 2;
	sprite.y = y;
};

Scene_Base.prototype.onrender = function () {
};
