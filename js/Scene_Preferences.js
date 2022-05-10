function Scene_Preferences() {
	this.initialize.apply(this, arguments);
}

Scene_Preferences.PREFERENCES_PAGES = [
	{
		title: 'Gameplay',
		list: [
			{
				name: 'offset',
				text: 'Offset (in ms)',
				type: 'number',
				args: {
				}
			},
			{
				name: 'playRate',
				text: 'Play rate (speed of music)',
				type: 'number',
				args: {
					min: 0,
					step: 0.1
				}
			},
			{
				name: 'autoPlay',
				text: 'Auto-play',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'countdown',
				text: 'Show countdown before resuming',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'offsetWizard',
				text: 'Offset Wizard',
				type: 'button',
				args: {
					onclick: () => { scene._shouldGotoOffsetWizard = true; }
				}
			}
		]
	},
	{
		title: 'Geometry',
		list: [
			{
				name: 'margin',
				text: 'Margins',
				type: 'number',
				args: {
					min: 0
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
				text: 'Radius of note heads',
				type: 'number',
				args: {
					min: 0
				}
			},
			{
				name: 'holdWidth',
				text: 'Thickness of hold notes\' tails (hold bar)',
				type: 'number',
				args: {
					min: 0
				}
			},
			{
				name: 'beamsWidth',
				text: 'Thickness of note beams',
				type: 'number',
				args: {
					min: 0,
				}
			},
			{
				name: 'beamsSpacing',
				text: 'Spacing between note beams',
				type: 'number',
				args: {
					min: 0
				}
			},
			{
				name: 'unconnectedBeamsLength',
				text: 'Length of unconnected note beams',
				type: 'number',
				args: {
					min: 0
				}
			}
		]
	},
	{
		title: 'Colors',
		list: [
			{
				name: 'notesColor',
				text: 'Color of notes',
				type: 'color',
				args: {
				}
			},
			{
				name: 'auxiliariesColor',
				text: 'Color of auxiliaries (barlines etc)',
				type: 'color',
				args: {
				}
			},
			{
				name: 'perfectColor',
				text: 'Color of perfect hits',
				type: 'color',
				args: {
				}
			},
			{
				name: 'goodColor',
				text: 'Color of good hits',
				type: 'color',
				args: {
				}
			},
			{
				name: 'badColor',
				text: 'Color of bad hits',
				type: 'color',
				args: {
				}
			},
			{
				name: 'missColor',
				text: 'Color of missed hits',
				type: 'color',
				args: {
				}
			},
			{
				name: 'excessColor',
				text: 'Color of excess hits',
				type: 'color',
				args: {
				}
			}
		]
	},
	{
		title: 'System',
		list: [
			{
				name: 'save',
				text: 'Save preferences in the web storage',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'reset',
				text: 'Reset all preferences to default',
				type: 'button',
				args: {
					onclick: () => { if (confirm('Reset all preferences to default?')) scene._resetAll(); }
				}
			},
			{
				name: 'export',
				text: 'Export preferences as JSON file',
				type: 'button',
				args: {
					onclick: () => { scene._exportJSON(); }
				}
			},
			{
				name: 'import',
				text: 'Import JSON file as preferences',
				type: 'file',
				args: {
					accept: 'application/json',
					onchange: event => { scene._importJSON(event.target.files[0]); }
				}
			},
			{
				name: 'github',
				text: 'Go to the GitHub repo of Dododo',
				type: 'button',
				args: {
					onclick: () => { open('https://github.com/UlyssesZh/dododo'); }
				}
			}
		]
	}
];

Scene_Preferences.DEFAULT_PREFERENCES = {
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
	unconnectedBeamsLength: 20,
	notesColor: '#ffffff',
	auxiliariesColor: '#4c4c4c',
	perfectColor: '#ffff00',
	goodColor: '#0000ff',
	badColor: '#008000',
	missColor: '#ff0000',
	excessColor: '#ff0000',
	save: false
};

Scene_Preferences.prototype = Object.create(Scene_Base.prototype);
Scene_Preferences.prototype.constructor = Scene_Preferences;

Scene_Preferences.prototype._switchPage = function (pageIndex) {
	if (this._currentPage !== undefined) {
		const list = Scene_Preferences.PREFERENCES_PAGES[this._currentPage].list;
		for (let i = 0; i < list.length; i++) {
			const name = list[i].name;
			this._textSprites[name].visible = false;
			this._inputs[name].visible = false;
		}
	}
	this._currentPage = pageIndex;
	const page = Scene_Preferences.PREFERENCES_PAGES[this._currentPage];
	this._titleSprite.bitmap.clear();
	this._titleSprite.bitmap.drawText(page.title, 0, 0, this._titleSprite.bitmap.width, TyphmConstants.TEXT_HEIGHT, 'center');
	if (this._pagesCached[this._currentPage]) {
		for (let i = 0; i < page.list.length; i++) {
			const name = page.list[i].name;
			this._textSprites[name].visible = true;
			this._inputs[name].visible = true;
		}
	} else {
		for (let i = 0; i < page.list.length; i++) {
			const {name, text, type, args} = page.list[i];
			const sprite = this._textSprites[name] = new Sprite(
				new Bitmap(Graphics.width - 2 * TyphmConstants.PREFERENCES_MARGIN, TyphmConstants.TEXT_HEIGHT));
			sprite.x = TyphmConstants.PREFERENCES_MARGIN;
			sprite.y = TyphmConstants.TEXT_HEIGHT * (i+1);
			sprite.bitmap.drawText(`${text} (${String.fromCharCode(97+i)})`,
					0, 0, sprite.bitmap.width, TyphmConstants.TEXT_HEIGHT, 'left');
			this.addChild(sprite);
			const input = this._inputs[name] = new TyphmInput();
			if (type === 'number') {
				input.setType('number');
				input.width = 128;
				input.value = preferences[name];
				input.setTextAlign('right');
			} else if (type === 'color') {
				input.setType('color');
				input.width = 128;
				input.value = preferences[name];
			} else if (type === 'boolean') {
				input.setType('checkbox');
				input.setAttribute('checked', preferences[name]);
				input.width = 24;
			} else if (type === 'button') {
				input.setType('button');
				input.width = Graphics.width - 2*TyphmConstants.PREFERENCES_MARGIN;
				input.value = '';
			} else if (type === 'file') {
				input.setType('file');
				input.width = Graphics.width - 2*TyphmConstants.PREFERENCES_MARGIN;
				input.value = '';
				input.setOpacity(0);
				input.setTextAlign('right');
			}
			input.anchor.x = 1;
			input.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
			input.y = TyphmConstants.TEXT_HEIGHT * (i+1);
			for (const [argName, argValue] of Object.entries(args)) {
				input.setAttribute(argName, argValue);
			}
			input.refresh();
		}
		this._pagesCached[this._currentPage] = true;
	}
};

Scene_Preferences.prototype.start = function () {
	this._textSprites = {};
	this._inputs = {};
	this._pagesCached = [];
	
	this._titleSprite = new Sprite(new Bitmap(
		Graphics.width - 2*TyphmConstants.PREFERENCES_MARGIN, TyphmConstants.TEXT_HEIGHT));
	this._titleSprite.x = TyphmConstants.PREFERENCES_MARGIN;
	this.addChild(this._titleSprite);
	
	this._previous = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
		() => { this._previousPage(); });
	this._previous.x = TyphmConstants.PREFERENCES_MARGIN;
	this._previous.bitmap.drawText('<-', 0, 0, 256, TyphmConstants.TEXT_HEIGHT, 'left');
	this.addChild(this._previous);
	
	this._next = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
		() => { this._nextPage(); });
	this._next.anchor.x = 1;
	this._next.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
	this._next.bitmap.drawText('->', 0, 0, 256, TyphmConstants.TEXT_HEIGHT, 'right');
	this.addChild(this._next);

	/*this._apply = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
		() => { this._applySettings(); });
	this._apply.bitmap.drawText('Apply (\\s)', 0, 0,
		256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._apply);
	this._center(this._apply, Graphics.height - TyphmConstants.TEXT_HEIGHT * 3);*/
	
	this._ok = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldOk = true; });
	this._ok.bitmap.drawText('OK (\\n)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._ok);
	this._center(this._ok, Graphics.height - TyphmConstants.TEXT_HEIGHT * 2);
	
	this._back = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldBack = true; });
	this._back.bitmap.drawText('Back (Esc)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._back);
	this._center(this._back, Graphics.height - TyphmConstants.TEXT_HEIGHT);
	
	this._switchPage(0);
	
	this._shouldOk = false;
	this._shouldBack = false;
	this._shouldGotoOffsetWizard = false;
	
	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
};

Scene_Preferences.prototype._applySettings = function () {
	for (let j = 0; j < Scene_Preferences.PREFERENCES_PAGES.length; j++) {
		if (!this._pagesCached[j])
			continue;
		const page = Scene_Preferences.PREFERENCES_PAGES[j];
		for (let i = 0; i < page.list.length; i++) {
			const {name, text, type, args} = page.list[i];
			if (type === 'number') {
				preferences[name] = parseFloat(this._inputs[name].value);
			} else if (type === 'color') {
				preferences[name] = this._inputs[name].value;
			} else if (type === 'boolean') {
				preferences[name] = this._inputs[name].getAttribute('checked');
			}
		}
	}
	if (preferences.save) {
		localStorage.setItem('preferences', LZString.compressToBase64(this._getPreferencesJSON()));
	} else if (localStorage.getItem('preferences')) {
		localStorage.removeItem('preferences');
	}
};

Scene_Preferences.prototype._previousPage = function () {
	this._switchPage(this._currentPage === 0 ? Scene_Preferences.PREFERENCES_PAGES.length - 1 : this._currentPage - 1);
};

Scene_Preferences.prototype._nextPage = function () {
	this._switchPage(this._currentPage === Scene_Preferences.PREFERENCES_PAGES.length - 1 ? 0 : this._currentPage + 1);
};

Scene_Preferences.prototype.update = function () {
	if (this._shouldOk) {
		this._applySettings();
		window.scene = new Scene_Title();
	} else if (this._shouldBack) {
		window.scene = new Scene_Title();
	} else if (this._shouldGotoOffsetWizard) {
		this._applySettings();
		const scoreUrl = 'offset_wizard.ddd';
		const musicUrl = '../offset_wizard.ogg';
		window.scene = new Scene_Game(musicUrl, scoreUrl);
	}
	Scene_Base.prototype.update.call(this);
};

Scene_Preferences.prototype.stop = function () {
	document.removeEventListener('keydown', this._keydownEventListener);
	for (let j = 0; j < Scene_Preferences.PREFERENCES_PAGES.length; j++) {
		if (!this._pagesCached[j])
			continue;
		const page = Scene_Preferences.PREFERENCES_PAGES[j];
		for (let i = 0; i < page.list.length; i++) {
			this._inputs[page.list[i].name].destroy();
		}
	}
};

Scene_Preferences.prototype._onKeydown = function (event) {
	if (event.key === 'Enter') {
		this._shouldOk = true;
	} /*else if (event.key === 'Space') {
		this._applySettings();
	}*/ else if (event.key === 'Escape') {
		this._shouldBack = true;
	} else if (event.key === 'PageUp') {
		this._previousPage();
	} else if (event.key === 'PageDown') {
		this._nextPage();
	} else if (this._currentPage !== undefined && event.key >= 'a' && event.key <= 'z') {
		const item = Scene_Preferences.PREFERENCES_PAGES[this._currentPage].list[event.key.charCodeAt(0) - 97];
		if (item) {
			const input = this._inputs[item.name];
			input.focus();
			if (item.type === 'number') {
				input.select();
			} else if (item.type === 'boolean') {
				input.setAttribute('checked', !input.getAttribute('checked'));
			} else if (item.type === 'color') {
				input.click();
			} else if (item.type === 'button') {
				input.click();
			} else if (item.type === 'file') {
				input.click();
			}
		}
	}
};

Scene_Preferences.prototype._resetAll = function () {
	Object.assign(preferences, Scene_Preferences.DEFAULT_PREFERENCES);
	this._loadPreferences();
};

Scene_Preferences.prototype._getPreferencesJSON = function () {
	return JSON.stringify(preferences);
};

Scene_Preferences.prototype._exportJSON = function () {
	this._applySettings();
	const link = document.createElement("a");
	link.href = URL.createObjectURL(new Blob([this._getPreferencesJSON()], {type: 'text/plain'}));
	link.download = 'dododo_preferences.json';
	link.click();
};

Scene_Preferences.prototype._importJSON = function (file) {
	if (file) {
		file.text().then(text => {
			Object.assign(preferences, JSON.parse(text));
			this._loadPreferences();
		}, reason => {
			alert(`Failed to import due to ${reason}.`);
		});
	}
};

Scene_Preferences.prototype._loadPreferences = function () {
	for (let j = 0; j < Scene_Preferences.PREFERENCES_PAGES.length; j++) {
		if (!this._pagesCached[j])
			continue;
		const page = Scene_Preferences.PREFERENCES_PAGES[j];
		for (let i = 0; i < page.list.length; i++) {
			const {name, text, type, args} = page.list[i];
			if (type === 'number') {
				this._inputs[name].value = preferences[name];
			} else if (type === 'color') {
				this._inputs[name].value = preferences[name];
			} else if (type === 'boolean') {
				this._inputs[name].setAttribute('checked', preferences[name]);
			}
		}
	}
}

window.preferences = {};
Object.assign(preferences, Scene_Preferences.DEFAULT_PREFERENCES);
