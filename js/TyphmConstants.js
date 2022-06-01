function TyphmConstants() {
	throw new Error('This is a static class');
}

TyphmConstants.LINES_HEIGHT = 512;
TyphmConstants.PREFERENCES_MARGIN = 128;
TyphmConstants.DEFAULT_PERFECT = 0.02;
TyphmConstants.DEFAULT_GOOD = 0.04;
TyphmConstants.DEFAULT_BAD = 0.06;
TyphmConstants.DEFAULT_BPM = 120.0;
TyphmConstants.DEFAULT_BEAT_NOTE = 2;
TyphmConstants.HIT_SOUND_ADVANCE = 100;
TyphmConstants.HITTABLE_KEYS = ['Spacebar', 'Enter', 'Tab', 'CapsLock', 'NumLock', 'Shift', 'Backspace',
	'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', 'Insert', 'Delete', 'Clear',
	...Array.from('`1234567890-=\\qwertyuiop[]asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+|QWERTYUIOP{}ASDFGHJKL:"ZXCVBNM<>?')];
TyphmConstants.INACCURACIES_DISTRIBUTION_PIECES = 400;
TyphmConstants.INACCURACIES_DISTRIBUTION_BLUR = 3;
