function Scene_BrowseFiles() {
	this.initialize.apply(this, arguments);
}

Scene_BrowseFiles.prototype = Object.create(Scene_Base.prototype);
Scene_BrowseFiles.prototype.constructor = Scene_BrowseFiles;

Scene_BrowseFiles.prototype.start = function () {
	Scene_Base.prototype.start.call(this);

	this._musicPrompt = new Button(new Bitmap(Graphics.width, preferences.textHeight),
			() => { this._shouldUploadAudio = true; });
	this._musicPrompt.bitmap.drawText(`${Strings.uploadAudio} (a)`, 0, 0,
			this._musicPrompt.width, preferences.textHeight, 'center');
	this._center(this._musicPrompt, preferences.textHeight);
	this.addChild(this._musicPrompt);

	this._musicResult = new Sprite(new Bitmap(Graphics.width, preferences.textHeight));
	this._musicResult.opacity = 128;
	this._center(this._musicResult, preferences.textHeight*2);
	this.addChild(this._musicResult);

	this._beatmapPrompt = new Button(new Bitmap(Graphics.width, preferences.textHeight),
			() => { this._shouldUploadBeatmap = true; });
	this._beatmapPrompt.bitmap.drawText(`${Strings.uploadBeatmap} (b)`, 0, 0,
			this._beatmapPrompt.width, preferences.textHeight, 'center');
	this._center(this._beatmapPrompt, preferences.textHeight*4);
	this.addChild(this._beatmapPrompt);

	this._beatmapResult = new Sprite(new Bitmap(Graphics.width, preferences.textHeight));
	this._beatmapResult.opacity = 128;
	this._center(this._beatmapResult, preferences.textHeight*5);
	this.addChild(this._beatmapResult);
	
	this._recordingPrompt = new Button(new Bitmap(Graphics.width, preferences.textHeight),
		() => this._shouldUploadRecording = true);
	this._recordingPrompt.bitmap.drawText(`${Strings.uploadRecording} (r)`, 0, 0,
		this._recordingPrompt.width, preferences.textHeight, 'right');
	this._recordingPrompt.anchor.x = 1;
	this._recordingPrompt.x = Graphics.width;
	this._recordingPrompt.y = Graphics.height - preferences.textHeight*2;
	this.addChild(this._recordingPrompt);
	
	this._recordingResult = new Sprite(new Bitmap(1024, preferences.textHeight));
	this._recordingResult.anchor.x = 1;
	this._recordingResult.x = Graphics.width;
	this._recordingResult.y = Graphics.height - preferences.textHeight;
	this._recordingResult.opacity = 128;
	this.addChild(this._recordingResult);

	this._ok = new Button(new Bitmap(256, preferences.textHeight),
			() => { this._shouldOk = true; });
	this._center(this._ok, preferences.textHeight*7);
	this._ok.bitmap.drawText(`${Strings.ok} (Enter)`, 0, 0,
			256, preferences.textHeight, 'center');
	this.addChild(this._ok);

	this._back = new Button(new Bitmap(256, preferences.textHeight),
			() => { this._shouldBack = true; });
	this._center(this._back, preferences.textHeight*8);
	this._back.bitmap.drawText(`${Strings.back} (Escape)`, 0, 0,
			256, preferences.textHeight, 'center');
	this.addChild(this._back);

	this._beatmapAlert = new Sprite(new Bitmap(300, preferences.textHeight));
	this._beatmapAlert.bitmap.drawText(Strings.noBeatmapWarning, 0, 0,
			300, preferences.textHeight, 'center');
	this._center(this._beatmapAlert, preferences.textHeight*10);
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
			this._musicResult.bitmap.drawText(file.name, 0, 0, 1024, preferences.textHeight, 'center');
		this._refreshPreview();
	};
	beatmapInput.oninput = (event) => {
		this._beatmapResult.bitmap.clear();
		const file = beatmapInput.files[0];
		if (file)
			this._beatmapResult.bitmap.drawText(file.name, 0, 0, 1024, preferences.textHeight, 'center');
		if (this._beatmapUploaded) {
			recordingInput.value = '';
			recordingInput.oninput();
		}
		this._refreshPreview();
	};
	recordingInput.oninput = (event) => {
		this._recordingResult.bitmap.clear();
		const file = recordingInput.files[0];
		if (file)
			this._recordingResult.bitmap.drawText(file.name, 0, 0, 1024, preferences.textHeight, 'right');
		this._loadRecording();
	};

	musicInput.oninput();
	beatmapInput.oninput();
	
	this._beatmapUploaded = false;
	this._shouldUploadAudio = false;
	this._shouldUploadBeatmap = false;
	this._shouldUploadRecording = false;
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
	} else if (this._shouldUploadRecording) {
		recordingInput.click();
		this._shouldUploadRecording = false;
	} else if (this._shouldOk) {
		const beatmapFile = beatmapInput.files[0];
		if (beatmapFile) {
			const scoreUrl = URL.createObjectURL(beatmapFile);
			const audioFile = musicInput.files[0];
			const musicUrl = audioFile ? URL.createObjectURL(audioFile) : '';
			const recording = this._recording && JSON.parse(this._recording);
			const sceneClass = preferences.pseWarning && this._pseWarning && (recording && preferences.recordVisual ?
				recording.visuals.judgementLinePerformances : preferences.judgementLinePerformances) ? Scene_Warning : Scene_Game;
			window.scene = new sceneClass(musicUrl, scoreUrl, recording, 0);
		} else {
			this._beatmapAlert.visible = true;
			this._shouldOk = false;
		}
	} else if (this._shouldBack) {
		window.scene = new Scene_Title();
	}
	Scene_Base.prototype.update.call(this);
};

Scene_BrowseFiles.prototype.stop = function () {
	Scene_Base.prototype.stop.call(this);
	document.removeEventListener('keydown', this._keydownEventListener);
};

Scene_BrowseFiles.prototype._onKeydown = function (event) {
	if (event.key === 'a') {
		this._shouldUploadAudio = true;
	} else if (event.key === 'b') {
		this._shouldUploadBeatmap = true;
	} else if (event.key === 'r') {
		this._shouldUploadRecording = true;
	} else if (event.key === 'Enter') {
		this._shouldOk = true;
	} else if (event.key === 'Escape') {
		this._shouldBack = true;
	}
};

Scene_BrowseFiles.prototype._refreshPreview = async function () {
	const beatmapFile = beatmapInput.files[0];
	if (beatmapFile) {
		this._beatmapUploaded = true;
		const beatmap = new Beatmap(URL.createObjectURL(beatmapFile));
		try {
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
				this._preview.bitmap.drawText(`${Strings.title}: ${beatmap.title}`, 0, 0, Graphics.width, 40);
				this._preview.bitmap.drawText(`${Strings.musicAuthor}: ${beatmap.musicAuthor}`, 0, 40, Graphics.width, 40);
				this._preview.bitmap.drawText(`${Strings.beatmapAuthor}: ${beatmap.beatmapAuthor}`, 0, 80, Graphics.width, 40);
				this._preview.bitmap.drawText(`${Strings.difficulty}: ${beatmap.difficulty}`, 0, 120, Graphics.width, 40);
				this._preview.bitmap.drawText(`${Strings.length}: ${length}ms`, 0, 160, Graphics.width, 40);
				this._pseWarning = beatmap.pseWarning;
			});
		} catch (e) {
			if (e instanceof TypeError) {
				beatmapInput.value = '';
				beatmapInput.oninput();
			} else {
				throw e;
			}
		}
	} else {
		this._beatmapUploaded = false;
		this._preview.bitmap.clear();
	}
};

Scene_BrowseFiles.prototype._loadRecording = async function () {
	const recordingFile = recordingInput.files[0];
	if (recordingFile) {
		this._recording = (await fetch(URL.createObjectURL(recordingFile)).then(r => r.text()));
	} else
		this._recording = undefined;
};
