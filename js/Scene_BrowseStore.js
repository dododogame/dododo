function Scene_BrowseStore() {
	this.initialize.apply(this, arguments);
}

Scene_BrowseStore.prototype = Object.create(Scene_Base.prototype);
Scene_BrowseStore.prototype.constructor = Scene_BrowseStore;

Scene_BrowseStore.prototype.start = function () {
	this._storeAddress = 'https://github.com/UlyssesZh/typhm_store/';

	this._prompt = new Button(new Bitmap(768, TyphmConstants.TEXT_HEIGHT),
			() => open(this._storeAddress));
	this._center(this._prompt, TyphmConstants.TEXT_HEIGHT*6);
	this._prompt.bitmap.drawText(`Find your beatmap on ${this._storeAddress}`, 0, 0,
			768, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._prompt);

	this._input = new TyphmInput();
	this._input.setType('text');
	this._input.setAttribute('placeholder', 'Filename without extension');
	this._input.y = TyphmConstants.TEXT_HEIGHT*7
	this._input.width = Graphics.width;
	this._input.setTextAlign('center');
	this._input.refresh();
	this._input.focus();

	this._ok = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldOk = true; });
	this._center(this._ok, TyphmConstants.TEXT_HEIGHT*9);
	this._ok.bitmap.drawText('OK (\\n)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._ok);

	this._back = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldBack = true; });
	this._center(this._back, TyphmConstants.TEXT_HEIGHT*10);
	this._back.bitmap.drawText('Back (Esc)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._back);

	this._shouldOk = false;
	this._shouldBack = false;

	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
};

Scene_BrowseStore.prototype.update = function () {
	if (this._shouldOk) {
		window.scene = new Scene_Game(null,
				`https://cdn.jsdelivr.net/gh/UlyssesZh/typhm_store@master/${this._input.value()}.typhm`);
	} else if (this._shouldBack) {
		window.scene = new Scene_Title();
	}
	Scene_Base.prototype.update.call(this);
};

Scene_BrowseStore.prototype.stop = function () {
	document.removeEventListener('keydown', this._keydownEventListener);
	this._input.destroy();
};

Scene_BrowseStore.prototype._onKeydown = function (event) {
	if (event.key === 'Enter') {
		this._shouldOk = true;
	} else if (event.key === 'Escape') {
		this._shouldBack = true;
	}
};
