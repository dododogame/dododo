window.preferences = {
	offset: 0.0,
	playRate: 1.0,
	autoPlay: false,
	countdown: true,
	margin: 16,
	auxiliariesBrightness: 0.3,
	voicesHeight: 64,
	stemsLength: 25,
	headsRadius: 5,
	holdWidth: 5,
	beamsWidth: 6,
	beamsSpacing: 4,
	unconnectedBeamsLength: 20
};

function Scene_Preferences() {
	this.initialize.apply(this, arguments);
}

Scene_Preferences.PREFERENCES_LIST = [
	{
		name: 'offset',
		text: 'Offset (in ms)',
		type: 'number',
		args: {
		}
	},
	{
		name: 'playRate',
		text: 'Play rate',
		type: 'number',
		args: {
			min: 0,
			step: 0.1
		}
	},
	{
		name: 'autoPlay',
		text: 'Auto-play',
		type: 'switch',
		args: {
		}
	},
	{
		name: 'countdown',
		text: 'Countdown',
		type: 'switch',
		args: {
		}
	},
	{
		name: 'margin',
		text: 'Margins',
		type: 'number',
		args: {
			min: 0
		}
	},
	{
		name: 'auxiliariesBrightness',
		text: 'Brightnesses of auxiliaries',
		type: 'number',
		args: {
			min: 0,
			max: 1,
			step: 0.1
		}
	},
	{
		name: 'voicesHeight',
		text: 'Height of voices',
		type: 'number',
		args: {
			min: 0
		}
	},
	{
		name: 'stemsLength',
		text: 'Lengths of note stems',
		type: 'number',
		args: {
			min: 0
		}
	},
	{
		name: 'headsRadius',
		text: 'Radii of note heads',
		type: 'number',
		args: {
			min: 0
		}
	},
	{
		name: 'holdWidth',
		text: 'Thicknesses of hold notes\' tail',
		type: 'number',
		args: {
			min: 0
		}
	},
	{
		name: 'beamsWidth',
		text: 'Thicknesses of note beams',
		type: 'number',
		args: {
			min: 0,
		}
	},
	{
		name: 'beamsSpacing',
		text: 'Spacings between note beams',
		type: 'number',
		args: {
			min: 0
		}
	},
	{
		name: 'unconnectedBeamsLength',
		text: 'Lengths of unconnected note beams',
		type: 'number',
		args: {
			min: 0
		}
	}
];

Scene_Preferences.prototype = Object.create(Scene_Base.prototype);
Scene_Preferences.prototype.constructor = Scene_Preferences;

Scene_Preferences.prototype.start = function () {
	this._textSprites = {};
	this._inputs = {};
	for (let i = 0; i < Scene_Preferences.PREFERENCES_LIST.length; i++) {
		const {name, text, type, args} = Scene_Preferences.PREFERENCES_LIST[i];
		const sprite = this._textSprites[name] = new Sprite(new Bitmap(512, TyphmConstants.TEXT_HEIGHT));
		sprite.x = TyphmConstants.PREFERENCES_MARGIN;
		sprite.y = TyphmConstants.TEXT_HEIGHT * i;
		sprite.bitmap.drawText(text, 0, 0, 512, TyphmConstants.TEXT_HEIGHT, 'left');
		this.addChild(sprite);
		if (type === 'number') {
			const input = this._inputs[name] = new TyphmInput();
			input.setType('number');
			input.anchor.x = 1;
			input.width = 128;
			input.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
			input.y = TyphmConstants.TEXT_HEIGHT * i;
			input.setValue(preferences[name]);
			input.setTextAlign('right');
			for (const [argName, argValue] of Object.entries(args)) {
				input.setAttribute(argName, argValue);
			}
			input.refresh();
		} else if (type === 'switch') {
			const input = this._inputs[name] = new Switch(preferences[name]);
			input.anchor.x = 1;
			input.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
			input.y = TyphmConstants.TEXT_HEIGHT * i;
			this.addChild(input);
		}
	}
	
	this._offsetWizard = new Button(new Bitmap(512, TyphmConstants.TEXT_HEIGHT),
		() => { this._shouldGotoOffsetWizard = true; });
	this._offsetWizard.anchor.x = 0.5;
	this._offsetWizard.x = Graphics.width / 2;
	this._offsetWizard.y = TyphmConstants.TEXT_HEIGHT * (Scene_Preferences.PREFERENCES_LIST.length + 1);
	this._offsetWizard.bitmap.drawText('Offset wizard', 0, 0, 512, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._offsetWizard);
	
	this._ok = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT * (Scene_Preferences.PREFERENCES_LIST.length + 2)),
			() => { this._shouldOk = true; });
	this._center(this._ok, TyphmConstants.TEXT_HEIGHT * (Scene_Preferences.PREFERENCES_LIST.length + 3));
	this._ok.bitmap.drawText('OK (\\n)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._ok);

	this._back = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldBack = true; });
	this._center(this._back, TyphmConstants.TEXT_HEIGHT * (Scene_Preferences.PREFERENCES_LIST.length + 4));
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
		for (let i = 0; i < Scene_Preferences.PREFERENCES_LIST.length; i++) {
			const {name, text, type, args} = Scene_Preferences.PREFERENCES_LIST[i];
			if (type === 'number') {
				preferences[name] = parseFloat(this._inputs[name].value());
			} else if (type === 'switch') {
				preferences[name] = this._inputs[name].value;
			}
		}
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
	for (let i = 0; i < Scene_Preferences.PREFERENCES_LIST.length; i++) {
		const {name, text, type, args} = Scene_Preferences.PREFERENCES_LIST[i];
		if (type === 'number') {
			this._inputs[name].destroy();
		}
	}
};

Scene_Preferences.prototype._onKeydown = function (event) {
	if (event.key === 'Enter') {
		this._shouldOk = true;
	} else if (event.key === 'Escape') {
		this._shouldBack = true;
	}
};
