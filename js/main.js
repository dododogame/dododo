//=============================================================================
// main.js
//=============================================================================

window.musicInput = document.createElement('input');
musicInput.type = 'file';
musicInput.accept = 'audio/*';
window.beatmapInput = document.createElement('input');
beatmapInput.type = 'file';
beatmapInput.accept = '.ddd';

window.onload = () => {
	Graphics.initialize(1024, 768, 'webgl');
	Graphics.boxWidth = 1024;
	Graphics.boxHeight = 768;
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
		Graphics.render(window.scene);
		window.scene.onrender();
		Graphics.tickEnd();
	}
	
	performUpdate(performance.now());
};
