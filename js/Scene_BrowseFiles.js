function Scene_BrowseFiles() {
	this.initialize.apply(this, arguments);
}

Scene_BrowseFiles.prototype = Object.create(Scene_Base.prototype);
Scene_BrowseFiles.prototype.constructor = Scene_BrowseFiles;

Scene_BrowseFiles.prototype.start = function () {
	this._musicPrompt = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldUploadAudio = true; });
	this._musicPrompt.bitmap.drawText('Upload audio (a)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this._center(this._musicPrompt, TyphmConstants.TEXT_HEIGHT);
	this.addChild(this._musicPrompt);

	this._musicResult = new Sprite(new Bitmap(1024, 32));
	this._musicResult.bitmap.textColor = 'gray';
	this._center(this._musicResult, TyphmConstants.TEXT_HEIGHT*2);
	this.addChild(this._musicResult);

	this._beatmapPrompt = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldUploadBeatmap = true; });
	this._beatmapPrompt.bitmap.drawText('Upload beatmap (b)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this._center(this._beatmapPrompt, TyphmConstants.TEXT_HEIGHT*4);
	this.addChild(this._beatmapPrompt);

	this._beatmapResult = new Sprite(new Bitmap(1024, TyphmConstants.TEXT_HEIGHT));
	this._beatmapResult.bitmap.textColor = 'gray';
	this._center(this._beatmapResult, TyphmConstants.TEXT_HEIGHT*5);
	this.addChild(this._beatmapResult);

	this._ok = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldOk = true; });
	this._center(this._ok, TyphmConstants.TEXT_HEIGHT*7);
	this._ok.bitmap.drawText('OK (\\n)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._ok);

	this._back = new Button(new Bitmap(256, TyphmConstants.TEXT_HEIGHT),
			() => { this._shouldBack = true; });
	this._center(this._back, TyphmConstants.TEXT_HEIGHT*8);
	this._back.bitmap.drawText('Back (Esc)', 0, 0,
			256, TyphmConstants.TEXT_HEIGHT, 'center');
	this.addChild(this._back);

	this._beatmapAlert = new Sprite(new Bitmap(300, TyphmConstants.TEXT_HEIGHT));
	this._beatmapAlert.bitmap.textColor = 'red';
	this._beatmapAlert.bitmap.drawText('Upload a beatmap first.', 0, 0,
			300, TyphmConstants.TEXT_HEIGHT, 'center');
	this._center(this._beatmapAlert, TyphmConstants.TEXT_HEIGHT*10);
	this._beatmapAlert.visible = false;
	this.addChild(this._beatmapAlert);

	this._preview = new Sprite(new Bitmap(Graphics.width, 256));
	this._preview.anchor.y = 1;
	this._preview.y = Graphics.height;
	this.addChild(this._preview);

	musicInput.oninput = (event) => {
		this._musicResult.bitmap.clear();
		const file = musicInput.files[0];
		if (file)
			this._musicResult.bitmap.drawText(file.name, 0, 0, 1024, 32, 'center');
		this._refreshPreview();
	};
	beatmapInput.oninput = (event) => {
		this._beatmapResult.bitmap.clear();
		const file = beatmapInput.files[0];
		if (file)
			this._beatmapResult.bitmap.drawText(file.name, 0, 0, 1024, 32, 'center');
		this._refreshPreview();
	};

	musicInput.oninput();
	beatmapInput.oninput();

	this._shouldUploadAudio = false;
	this._shouldUploadBeatmap = false;
	this._shouldOk = false;
	this._shouldBack = false;

	this._keydownEventListener = this._onKeydown.bind(this);
	document.addEventListener('keydown', this._keydownEventListener);
};

Scene_BrowseFiles.prototype.update = function () {
	if (this._shouldUploadAudio) {
		musicInput.click();
		this._shouldUploadAudio = false;
	} else if (this._shouldUploadBeatmap) {
		beatmapInput.click();
		this._shouldUploadBeatmap = false;
	} else if (this._shouldOk) {
		const beatmapFile = beatmapInput.files[0];
		if (beatmapFile) {
			const scoreUrl = URL.createObjectURL(beatmapFile);
			const audioFile = musicInput.files[0];
			const musicUrl = audioFile ? URL.createObjectURL(audioFile) : '';
			window.scene = new Scene_Game(musicUrl, scoreUrl);
		} else {
			this._beatmapAlert.visible = true;
		}
	} else if (this._shouldBack) {
		window.scene = new Scene_Title();
	}
	Scene_Base.prototype.update.call(this);
};

Scene_BrowseFiles.prototype.stop = function () {
	document.removeEventListener('keydown', this._keydownEventListener);
};

Scene_BrowseFiles.prototype._onKeydown = function (event) {
	if (event.key === 'a') {
		this._shouldUploadAudio = true;
	} else if (event.key === 'b') {
		this._shouldUploadBeatmap = true;
	} else if (event.key === 'Enter') {
		this._shouldOk = true;
	} else if (event.key === 'Escape') {
		this._shouldBack = true;
	}
};

Scene_BrowseFiles.prototype._refreshPreview = async function () {
	const beatmapFile = beatmapInput.files[0];
	if (beatmapFile) {
		const beatmap = new Beatmap(URL.createObjectURL(beatmapFile));
		await beatmap.load().then(async r => {
			let length;
			if (beatmap.length) {
				length = beatmap.length;
			} else {
				const audioFile = musicInput.files[0];
				if (audioFile) {
					length = await TyphmUtils.getAudioDuration(URL.createObjectURL(audioFile)) - beatmap.start;
				} else {
					length = beatmap.events[beatmap.events.length - 1].time - beatmap.start;
				}
			}
			this._preview.bitmap.clear();
			this._preview.bitmap.drawText(`Title: ${beatmap.title}`, 0, 0, Graphics.width, 40);
			this._preview.bitmap.drawText(`Music author: ${beatmap.musicAuthor}`, 0, 40, Graphics.width, 40);
			this._preview.bitmap.drawText(`Beatmap author: ${beatmap.beatmapAuthor}`, 0, 80, Graphics.width, 40);
			this._preview.bitmap.drawText(`Difficulty: ${beatmap.difficulty}`, 0, 120, Graphics.width, 40);
			this._preview.bitmap.drawText(`Length: ${length}ms`, 0, 160, Graphics.width, 40);
		});
	} else {
		this._preview.bitmap.clear();
	}
}