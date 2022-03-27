window.preferences = {offset: 0.0, playRate: 1.0, autoPlay: false, countdown: true};

function Scene_Preferences() {
	this.initialize.apply(this, arguments);
}

Scene_Preferences.prototype = Object.create(Scene_Base.prototype);
Scene_Preferences.prototype.constructor = Scene_Preferences;

Scene_Preferences.prototype.start = function () {
	this._offset = new Sprite(new Bitmap(192, TyphmConstants.TEXT_HEIGHT));
	this._offset.x = TyphmConstants.PREFERENCES_MARGIN;
	this._offset.y = TyphmConstants.TEXT_HEIGHT * 2;
	this._offset.bitmap.drawText('Offset (in ms)', 0, 0, 192, TyphmConstants.TEXT_HEIGHT, 'left');
	this.addChild(this._offset);

	this._offsetInput = new TyphmInput();
	this._offsetInput.setType('number');
	this._offsetInput.anchor.x = 1;
	this._offsetInput.width = 128;
	this._offsetInput.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
	this._offsetInput.y = TyphmConstants.TEXT_HEIGHT * 2;
	this._offsetInput.setValue(preferences.offset);
	this._offsetInput.setTextAlign('right');
	this._offsetInput.refresh();

	this._playRate = new Sprite(new Bitmap(128, TyphmConstants.TEXT_HEIGHT));
	this._playRate.x = TyphmConstants.PREFERENCES_MARGIN;
	this._playRate.y = TyphmConstants.TEXT_HEIGHT * 3;
	this._playRate.bitmap.drawText('Play rate', 0, 0, 128, TyphmConstants.TEXT_HEIGHT, 'left');
	this.addChild(this._playRate);

	this._playRateInput = new TyphmInput();
	this._playRateInput.setType('number');
	this._playRateInput.anchor.x = 1;
	this._playRateInput.width = 128;
	this._playRateInput.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
	this._playRateInput.y = TyphmConstants.TEXT_HEIGHT * 3;
	this._playRateInput.setValue(preferences.playRate);
	this._playRateInput.setAttribute('min', 0);
	this._playRateInput.setAttribute('step', 0.1);
	this._playRateInput.setTextAlign('right');
	this._playRateInput.refresh();

	this._autoPlay = new Sprite(new Bitmap(128, TyphmConstants.TEXT_HEIGHT));
	this._autoPlay.x = TyphmConstants.PREFERENCES_MARGIN;
	this._autoPlay.y = TyphmConstants.TEXT_HEIGHT * 4;
	this._autoPlay.bitmap.drawText('Auto-play', 0, 0, 128, TyphmConstants.TEXT_HEIGHT);
	this.addChild(this._autoPlay);

	this._autoPlayInput = new Switch(preferences.autoPlay);
	this._autoPlayInput.anchor.x = 1;
	this._autoPlayInput.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
	this._autoPlayInput.y = TyphmConstants.TEXT_HEIGHT * 4;
	this.addChild(this._autoPlayInput);

	this._countdown = new Sprite(new Bitmap(192, TyphmConstants.TEXT_HEIGHT));
	this._countdown.x = TyphmConstants.PREFERENCES_MARGIN;
	this._countdown.y = TyphmConstants.TEXT_HEIGHT * 5;
	this._countdown.bitmap.drawText('Countdown', 0, 0, 192, TyphmConstants.TEXT_HEIGHT);
	this.addChild(this._countdown);

	this._countdownInput = new Switch(preferences.countdown);
	this._countdownInput.anchor.x = 1;
	this._countdownInput.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
	this._countdownInput.y = TyphmConstants.TEXT_HEIGHT * 5;
	this.addChild(this._countdownInput);
	
	this._offsetWizard = new Button(new Bitmap(512, TyphmConstants.TEXT_HEIGHT),
		() => { this._shouldGotoOffsetWizard = true; })
	this._offsetWizard.anchor.x = 0.5;
	this._offsetWizard.x = Graphics.width / 2;
	this._offsetWizard.y = TyphmConstants.TEXT_HEIGHT*7;
	this._offsetWizard.bitmap.drawText('Offset wizard', 0, 0, 512, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._offsetWizard);
	
	this._ok = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldOk = true; });
	this._center(this._ok, TyphmConstants.TEXT_HEIGHT*10);
	this._ok.bitmap.drawText('OK (\\n)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._ok);

	this._back = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldBack = true; });
	this._center(this._back, TyphmConstants.TEXT_HEIGHT*11);
	this._back.bitmap.drawText('Back (Esc)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._back);

	this._shouldOk = false;
	this._shouldBack = false;
	this._shouldGotoOffsetWizard = false;

	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
};

Scene_Preferences.prototype.update = function () {
	if (this._shouldOk) {
		preferences.offset = parseFloat(this._offsetInput.value());
		preferences.playRate = parseFloat(this._playRateInput.value());
		preferences.autoPlay = this._autoPlayInput.value;
		preferences.countdown = this._countdownInput.value;
		window.scene = new Scene_Title();
	} else if (this._shouldBack) {
		window.scene = new Scene_Title();
	} else if (this._shouldGotoOffsetWizard) {
		const scoreUrl = 'offset_wizard.ddd';
		const musicUrl = '../offset_wizard.ogg';
		window.scene = new Scene_Game(musicUrl, scoreUrl);
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Preferences.prototype.stop = function () {
	document.removeEventListener('keydown', this._keydownEventListener);
	this._offsetInput.destroy();
	this._playRateInput.destroy();
};

Scene_Preferences.prototype._onKeydown = function (event) {
	if (event.key === 'Enter') {
		this._shouldOk = true;
	} else if (event.key === 'Escape') {
		this._shouldBack = true;
	}
};
