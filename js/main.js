//=============================================================================
// main.js
//=============================================================================

window.musicInput = document.createElement('input');
musicInput.type = 'file';
musicInput.accept = 'audio/*';

window.beatmapInput = document.createElement('input');
beatmapInput.type = 'file';
beatmapInput.accept = '.ddd';

window.recordingInput = document.createElement('input');
recordingInput.type = 'file';
recordingInput.accept = 'application/json'

window.onload = () => {
	document.body.style.backgroundColor = preferences.backgroundColor;
	Graphics.initialize(preferences.graphicsWidth, preferences.graphicsHeight, preferences.useWebGL ? 'webgl' : 'canvas');
	Graphics.boxWidth = preferences.graphicsWidth;
	Graphics.boxHeight = preferences.graphicsHeight;
	WebAudio.initialize(false);
	Input.initialize();
	TouchInput.initialize();
	var deltaTime = 1000 / 60;
	var accumulator = 0.0;
	var currentTime;
	window.scene = new Scene_Title();
	window.scene.start();
	
	function performUpdate(newTime) {
		Graphics.tickStart();
		requestAnimationFrame(performUpdate);
		Graphics.render(window.scene);
		if (currentTime === undefined) currentTime = newTime;
		var fTime = (newTime - currentTime).clamp(0, 250);
		currentTime = newTime;
		accumulator += fTime;
		while (accumulator >= deltaTime) {
			Input.update();
			TouchInput.update();
			window.scene.update();
			accumulator -= deltaTime;
		}
		window.scene.onrender();
		Graphics.tickEnd();
	}
	
	performUpdate(performance.now());
};
