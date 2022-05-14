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
				name: 'offsetWizard',
				text: 'Offset Wizard',
				type: 'button',
				args: {
					onclick: () => { scene._shouldGotoOffsetWizard = true; }
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
				name: 'FCAPIndicator',
				text: 'Full combo / all perfect indicator',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'autoRestartGood',
				text: 'Automatically restart when failing to AP',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'autoRestartMiss',
				text: 'Automatically restart when failing to FC',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'F7Pause',
				text: 'Press F7 to pause',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'backtickRestart',
				text: 'Press backtick to restart',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'autoPause',
				text: 'Automatically pause when losing focus',
				type: 'boolean',
				args: {
				}
			}
		]
	},
	{
		title: 'Geometry',
		list: [
			{
				name: 'fontSize',
				text: 'Font size',
				type: 'number',
				args: {
					min: 1
				}
			},
			{
				name: 'textHeight',
				text: 'Height of text lines',
				type: 'number',
				args: {
					min: 1
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
			},
			{
				name: 'textColor',
				text: 'Color of foreground (texts etc)',
				type: 'color',
				args: {
				}
			},
			{
				name: 'backgroundColor',
				text: 'Color of background',
				type: 'color',
				args: {
				}
			}
		]
	},
	{
		title: 'Graphics',
		list: [
			{
				name: 'graphicsWidth',
				text: 'Resolution (width)',
				type: 'number',
				args: {
					min: 1,
					step: 1
				}
			},
			{
				name: 'graphicsHeight',
				text: 'Resolution (height)',
				type: 'number',
				args: {
					min: 1,
					step: 1
				}
			},
			{
				name: 'showFPS',
				text: 'Switch view of FPS (F2)',
				type: 'button',
				args: {
					onclick: () => { Graphics._switchFPSMeter(); }
				}
			},
			{
				name: 'stretchGraphics',
				text: 'Stretch to fit the window (F3)',
				type: 'button',
				args: {
					onclick: () => { Graphics._switchStretchMode(); }
				}
			},
			{
				name: 'fullscreen',
				text: 'Toggle fullscreen (F4, F11)',
				type: 'button',
				args: {
					onclick: () => { Graphics._switchFullScreen(); }
				}
			}
		]
	},
	{
		title: 'Audio',
		list: [
			{
				name: 'enableHitSound',
				text: 'Enable hit sound',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'hitSound',
				text: 'Hit sound',
				type: 'select',
				args: {
					selectItems: [
						['agogo_bells.ogg', 'Agogo bells'],
						['bass_drum.ogg', 'Bass drum'],
						['bell_tree.ogg', 'Bell tree'],
						['cabasa.ogg', 'Cabasa'],
						['castanets.ogg', 'Castanets'],
						['chinese_cymbal.ogg', 'Chinese cymbal'],
						['chinese_hand_cymbals_1.ogg', 'Chinese hand cymbals 1'],
						['chinese_hand_cymbals_2.ogg', 'Chinese hand cymbals 2'],
						['clash_cymbals.ogg', 'Clash cymbals'],
						['cowbell_1.ogg', 'Cowbell 1'],
						['cowbell_2.ogg', 'Cowbell 2'],
						['djembe.ogg', 'Djembe'],
						['djundjun.ogg', 'Djundjun'],
						['sheeps_toenails.ogg', 'Sheep\'s toenails'],
						['sleigh_bells.ogg', 'Sleigh bells'],
						['snare_drum_1.ogg', 'Snare drum 1'],
						['snare_drum_2.ogg', 'Snare drum 2'],
						['spring_coil.ogg', 'Spring coil'],
						['surdo_1.ogg', 'Surdo 1'],
						['surdo_2.ogg', 'Surdo 2'],
						['tambourine_1.ogg', 'Tambourine 1'],
						['tambourine_2.ogg', 'Tambourine 2'],
						['whip.ogg', 'Whip'],
						['woodblock.ogg', 'Woodblock']
					],
					oninput: event => {
						const player = new WebAudio('/assets/audios/hit_sounds/' + event.target.value);
						player.volume = preferences.hitSoundVolume * preferences.masterVolume;
						player.addLoadListener(() => player.play());
					}
				}
			},
			{
				name: 'hitSoundWithMusic',
				text: 'Hit sound with music instead of input',
				type: 'boolean',
				args: {
				}
			},
			{
				name: 'musicVolume',
				text: 'Volume of music',
				type: 'number',
				args: {
					min: 0,
					step: 0.01
				}
			},
			{
				name: 'hitSoundVolume',
				text: 'Volume of hit sound',
				type: 'number',
				args: {
					min: 0,
					step: 0.01
				}
			},
			{
				name: 'masterVolume',
				text: 'Master volume',
				type: 'number',
				args: {
					min: 0,
					step: 0.01
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
	FCAPIndicator: true,
	autoRestartGood: false,
	autoRestartMiss: false,
	F7Pause: true,
	backtickRestart: true,
	autoPause: true,
	fontSize: 28,
	textHeight: 40,
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
	textColor: '#ffffff',
	backgroundColor: '#000000',
	graphicsWidth: 1024,
	graphicsHeight: 768,
	enableHitSound: true,
	hitSound: 'snare_drum_1.ogg',
	hitSoundWithMusic: false,
	musicVolume: 1,
	hitSoundVolume: 1,
	masterVolume: 1,
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
	this._titleSprite.bitmap.drawText(page.title, 0, 0, this._titleSprite.bitmap.width, preferences.textHeight, 'center');
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
				new Bitmap(Graphics.width - 2 * TyphmConstants.PREFERENCES_MARGIN, preferences.textHeight));
			sprite.x = TyphmConstants.PREFERENCES_MARGIN;
			sprite.y = preferences.textHeight * (i+1);
			sprite.bitmap.drawText(`${text} (${String.fromCharCode(97+i)})`,
					0, 0, sprite.bitmap.width, preferences.textHeight, 'left');
			this.addChild(sprite);
			const input = this._inputs[name] = new TyphmInput(args.selectItems);
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
				input.setOpacity(0);
			} else if (type === 'file') {
				input.setType('file');
				input.width = Graphics.width - 2*TyphmConstants.PREFERENCES_MARGIN;
				input.value = '';
				input.setOpacity(0);
				input.setTextAlign('right');
			} else if (type === 'select') {
				input.width = 384;
				input.value = preferences[name];
				input.setTextAlign('right');
			}
			input.anchor.x = 1;
			input.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
			input.y = preferences.textHeight * (i+1);
			for (const [argName, argValue] of Object.entries(args)) {
				input.setAttribute(argName, argValue);
			}
			input.refresh();
		}
		this._pagesCached[this._currentPage] = true;
	}
};

Scene_Preferences.prototype.start = function () {
	Scene_Base.prototype.start.call(this);

	this._textSprites = {};
	this._inputs = {};
	this._pagesCached = [];
	
	this._titleSprite = new Sprite(new Bitmap(
		Graphics.width - 2*TyphmConstants.PREFERENCES_MARGIN, preferences.textHeight));
	this._titleSprite.x = TyphmConstants.PREFERENCES_MARGIN;
	this.addChild(this._titleSprite);
	
	this._previous = new Button(new Bitmap(256, preferences.textHeight),
		() => { this._previousPage(); });
	this._previous.x = TyphmConstants.PREFERENCES_MARGIN;
	this._previous.bitmap.drawText('<-', 0, 0, 256, preferences.textHeight, 'left');
	this.addChild(this._previous);
	
	this._next = new Button(new Bitmap(256, preferences.textHeight),
		() => { this._nextPage(); });
	this._next.anchor.x = 1;
	this._next.x = Graphics.width - TyphmConstants.PREFERENCES_MARGIN;
	this._next.bitmap.drawText('->', 0, 0, 256, preferences.textHeight, 'right');
	this.addChild(this._next);

	/*this._apply = new Button(new Bitmap(256, preferences.textHeight),
		() => { this._applySettings(); });
	this._apply.bitmap.drawText('Apply (\\s)', 0, 0,
		256, preferences.textHeight, 'center');
	this.addChild(this._apply);
	this._center(this._apply, Graphics.height - preferences.textHeight * 3);*/
	
	this._ok = new Button(new Bitmap(256, preferences.textHeight),
			() => { this._shouldOk = true; });
	this._ok.bitmap.drawText('OK (\\n)', 0, 0,
			256, preferences.textHeight, 'center');
	this.addChild(this._ok);
	this._center(this._ok, Graphics.height - preferences.textHeight * 2);
	
	this._back = new Button(new Bitmap(256, preferences.textHeight),
			() => { this._shouldBack = true; });
	this._back.bitmap.drawText('Back (Esc)', 0, 0,
			256, preferences.textHeight, 'center');
	this.addChild(this._back);
	this._center(this._back, Graphics.height - preferences.textHeight);
	
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
			} else if (type === 'select') {
				preferences[name] = this._inputs[name].value;
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
			} else if (item.type === 'select') {
				// Currently no means to open the dropdown using JS
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
