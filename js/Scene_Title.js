function Scene_Title() {
	this.initialize.apply(this, arguments);
}

Scene_Title.prototype = Object.create(Scene_Base.prototype);
Scene_Title.prototype.constructor = Scene_Title;

Scene_Title.prototype.start = function () {
	this._loadPreferences();
	
	this._title = new Sprite(new Bitmap(150, 60));
	this._center(this._title, 200);
	this._title.bitmap.fontSize = 50;
	this._title.bitmap.drawText('Dododo', 0, 0, 150, 60, 'center');
	this.addChild(this._title);

	this._files = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldGotoFiles = true; });
	this._center(this._files, 400);
	this._files.bitmap.drawText('Browse files (f)', 0, 0, 256,
			TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._files);

	this._store = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldGotoStore = true; });
	this._center(this._store, 400+TyphmConstants.TEXT_HEIGHT);
	this._store.bitmap.drawText('Browse store (s)', 0, 0, 256,
			TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._store);

	this._history = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldGotoHistory = true; });
	this._center(this._history, 400+TyphmConstants.TEXT_HEIGHT*2);
	this._history.bitmap.drawText('Browse history (h)', 0, 0, 256,
			TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._history);

	this._preferences = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldGotoPreferences = true; });
	this._center(this._preferences, 400+TyphmConstants.TEXT_HEIGHT*4);
	this._preferences.bitmap.drawText('Preferences (p)', 0, 0, 256,
			TyphmConstants.TEXT_HEIGHT, 'center')
	this.addChild(this._preferences)

	this._shouldGotoFiles = false;
	this._shouldGotoStore = false;
	this._shouldGotoHistory = false;
	this._shouldGotoPreferences = false;

	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
};

Scene_Title.prototype._loadPreferences = function () {
	const string = localStorage.getItem('preferences');
	if (string)
		Object.assign(preferences, JSON.parse(LZString.decompressFromBase64(string)));
};

Scene_Title.prototype._onKeydown = function (event) {
	if (event.key === 'f') {
		this._shouldGotoFiles = true;
	} else if (event.key === 's') {
		this._shouldGotoStore = true;
	} else if (event.key === 'h') {
		this._shouldGotoHistory = true;
	} else if (event.key === 'p') {
		this._shouldGotoPreferences = true;
	}
};

Scene_Title.prototype.update = function () {
	if (this._shouldGotoFiles) {
		window.scene = new Scene_BrowseFiles();
	} else if (this._shouldGotoStore) {
		//window.scene = new Scene_BrowseStore();
	} else if (this._shouldGotoHistory) {
		// TODO
	} else if (this._shouldGotoPreferences) {
		window.scene = new Scene_Preferences();
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Title.prototype.stop = function () {
	document.removeEventListener('keydown', this._keydownEventListener);
};
