function Strings() {
	throw new Error("This is a static class");
}

Strings.LANGUAGES = {
	"en-US": "English (United States)",
	"zh-CN": "中文 (中国)",
	"zh-TW": "中文 (臺灣)"
};

Strings["en-US"] = {
	// miscellaneous
	"gameTitle": "Dododo",
	"ok": "OK",
	"back": "Back",
	"loading": "Loading...",
	
	// title page
	"browseFiles": "Browse files",
	"browseStore": "Browse store",
	"browseHistory": "Browse history",
	"preferences": "Preferences",
	
	// browse files
	"uploadAudio": "Upload audio",
	"uploadBeatmap": "Upload beatmap",
	"noBeatmapWarning": "Upload a beatmap first",
	"title": "Music",
	"musicAuthor": "Artist",
	"beatmapAuthor": "Beatmapper",
	"difficulty": "Difficulty",
	"defaultDifficulty": "unknown",
	"length": "Length",
	
	// browse store
	
	// browse history
	
	// in-game
	"quitGame": "Back",
	"restartGame": "Restart",
	"autoPlaying": "Auto-playing",
	"perfect": "Perfect",
	"good": "Good",
	"bad": "Bad",
	"miss": "Miss",
	"excess": "Excess",
	"maxCombo": "Max combo",
	"markP": "P",
	"markS": "S",
	"markA": "A",
	"markB": "B",
	"markC": "C",
	"markD": "D",
	"markE": "E",
	"markF": "F",
	"fullCombo": "FC",
	"viewRecording": "Watch replay",
	"saveRecording": "Save replay",
	"uploadRecording": "Upload replay",
	
	// preferences: modifiers
	"modifiers": "Modifiers",
	"playRate": "Play rate (speed of music)",
	"autoPlay": "Auto-play",
	"noBad": "No-bad mode",
	"noExcess": "No-excess mode",
	"judgeWindow": "Judge window (smaller is stricter)",
	"autoCompleteHolds": "Automatically hold for hold notes",
	
	// preferences: gameplay
	"gameplay": "Gameplay",
	"offset": "Offset (in ms)",
	"offsetWizard": "Offset wizard",
	"countdown": "Show countdown before resuming",
	"autoRestartGood": "Automatically restart when failing to AP",
	"autoRestartMiss": "Automatically restart when failing to FC",
	"F7Pause": "Press F7 to pause",
	"backtickRestart": "Press backtick to restart",
	"autoPause": "Automatically pause when losing focus",
	"recordVisual": "Record visual preferences to replay",
	
	// preferences: visual
	"visual": "Visual",
	"FCAPIndicator": "Full combo / all perfect indicator",
	"TPSIndicator": "Taps per second indicator",
	"judgeLinePerformances": "Enable ornamental judge line effects",
	"flashWarningGood": "Warn by flash the screen at good hits",
	"flashWarningMiss": "Warn by flash the screen at combo breaks",
	"showInaccuracyData": "Show inaccuracy data",
	"comboPopupInterval": "Interval of combo popups (set 0 to disable)",
	"fadeIn": "Fade-in distance (0 to disable)",
	"fadeOut": "Fade-out distance (0 to disable)",
	"reverseVoices": "Reverse voices",
	"mirror": "Mirror (flip horizontally)",
	
	// preferences: geometry
	"geometry": "Geometry",
	"fontSize": "Font size",
	"textHeight": "Height of text lines",
	"margin": "Margins",
	"voicesHeight": "Height of voices",
	"stemsLength": "Length of note stems",
	"headsRadius": "Radius of note heads",
	"holdWidth": "Thickness of hold notes' tails (hold bar)",
	"beamsWidth": "Thickness of note beams",
	"beamsSpacing": "Spacing between note beams",
	"unconnectedBeamsLength": "Length of unconnected note beams",
	"barlinesHeight": "Height of barlines",
	"hitEffectRadius": "Radius of hit effects",
	"distanceBetweenLines": "Distance between beatmap rows",
	
	// preferences: colors
	"colors": "Colors",
	"notesColor": "Color of notes",
	"auxiliariesColor": "Color of auxiliaries (barlines etc)",
	"perfectColor": "Color of perfect hits",
	"goodColor": "Color of good hits",
	"badColor": "Color of bad hits",
	"missColor": "Color of missed hits",
	"excessColor": "Color of excess hits",
	"textColor": "Color of foreground (texts etc)",
	"backgroundColor": "Color of background",
	
	// preferences: graphics
	"graphics": "Graphics",
	"graphicsWidth": "Resolution (width)",
	"graphicsHeight": "Resolution (height)",
	"showFPS": "Switch view of FPS (F2)",
	"stretchGraphics": "Stretch to fit the window (F3)",
	"fullscreen": "Toggle fullscreen (F4, F11)",
	
	// preferences: audio
	"audio": "Audio",
	"enableHitSound": "Enable hit sound",
	"hitSound": "Hit sound",
	"hitSoundWithMusic": "Hit sound with music instead of input",
	"musicVolume": "Volume of music",
	"hitSoundVolume": "Volume of hit sound",
	"masterVolume": "Master volume",
	
	// preferences: system
	"system": "System",
	"language": "Language",
	"save": "Save preferences in the web storage",
	"reset": "Reset all preferences to default",
	"confirmReset": "Reset all preferences to default?",
	"export": "Export preferences as JSON file",
	"import": "Import JSON file as preferences",
	"importFailure": "Failed to import due to %s",
	"wiki": "Go to the wiki of Dododo",
	"github": "Go to the GitHub repo of Dododo",
	"discord": "Join the Discord server of Dododo",
	
	// hit sounds
	"agogoBells": 'Agogo bells',
	"bassDrum": 'Bass drum',
	"bellTree": 'Bell tree',
	"cabasa": "Cabasa",
	"castanets": "Castanets",
	"chineseCymbal": "Chinese cymbal",
	"chineseHandCymbals1": "Chinese hand cymbals 1",
	"chineseHandCymbals2": "Chinese hand cymbals 2",
	"clashCymbals": "Clash cymbals",
	"cowbell1": "Cowbell 1",
	"cowbell2": "Cowbell 2",
	"djembe": "Djembe",
	"djundjun": "Dunun",
	"sheepsToenails": "Sheep's toenails",
	"sleighBells": "Sleigh bells",
	"snareDrum1": "Snare drum 1",
	"snareDrum2": "Snare drum 2",
	"springCoil": "Spring coil",
	"surdo1": "Surdo 1",
	"surdo2": "Surdo 2",
	"tambourine1": "Tambourine 1",
	"tambourine2": "Tambourine 2",
	"whip": "Whip",
	"woodblock": "Woodblock"
};

Strings["zh-CN"] = {
	// miscellaneous
	"gameTitle": "Dododo",
	"ok": "确定",
	"back": "返回",
	"loading": "加载中...",
	
	// title page
	"browseFiles": "浏览文件",
	"browseStore": "浏览商店",
	"browseHistory": "浏览历史",
	"preferences": "设置",
	
	// browse files
	"uploadAudio": "上传音频文件",
	"uploadBeatmap": "上传谱面文件",
	"uploadRecording": "上传回放",
	"noBeatmapWarning": "请先上传谱面文件",
	"title": "曲目",
	"musicAuthor": "曲师",
	"beatmapAuthor": "谱师",
	"difficulty": "难度",
	"defaultDifficulty": "未知",
	"length": "长度",
	
	// browse store
	
	// browse history
	
	// in-game
	"quitGame": "返回",
	"restartGame": "重开",
	"autoPlaying": "自动",
	"perfect": "完美",
	"good": "好",
	"bad": "坏",
	"miss": "小姐",
	"excess": "多余",
	"maxCombo": "最大连击数",
	"markP": "触",
	"markS": "优",
	"markA": "甲",
	"markB": "乙",
	"markC": "丙",
	"markD": "丁",
	"markE": "戊",
	"markF": "拉",
	"fullCombo": "全连",
	"viewRecording": "看回放",
	"saveRecording": "保存回放",
	
	// preferences: modifiers
	"modifiers": "模式",
	"playRate": "倍速",
	"autoPlay": "自动",
	"noBad": "无坏模式",
	"noExcess": "无多余模式",
	"judgeWindow": "判定区间 (越小越严格)",
	"autoCompleteHolds": "自动长押",
	
	// preferences: gameplay
	"gameplay": "游戏",
	"offset": "音频延迟 (毫秒)",
	"offsetWizard": "调延迟工具",
	"countdown": "继续前倒计时",
	"autoRestartGood": "全完美失败时自动重开",
	"autoRestartMiss": "全连失败时自动重开",
	"F7Pause": "按 F7 暂停",
	"backtickRestart": "按反引号重开",
	"autoPause": "失焦时自动暂停",
	"recordVisual": "在回放中记录视觉设置",
	
	// preferences: visual
	"visual": "视觉",
	"FCAPIndicator": "全连/全完美指示器",
	"TPSIndicator": "每秒点击数指示器",
	"judgeLinePerformances": "启用装饰性判定线演出",
	"flashWarningGood": "爆好时闪屏警告",
	"flashWarningMiss": "断连时闪屏警告",
	"showInaccuracyData": "显示误差数据",
	"comboPopupInterval": "连击数弹出间隔 (0 为不弹出)",
	"fadeIn": "上隐距离 (0 为不上隐)",
	"fadeOut": "下隐距离 (0 为不下隐)",
	"reverseVoices": "声部反转",
	"mirror": "镜像 (左右反转)",
	
	// preferences: geometry
	"geometry": "几何",
	"fontSize": "字体大小",
	"textHeight": "行高",
	"margin": "页边距",
	"voicesHeight": "声部的高度",
	"stemsLength": "符杆的长度",
	"headsRadius": "符头的半径",
	"holdWidth": "面条的粗细度",
	"beamsWidth": "符杠的粗细度",
	"beamsSpacing": "符杠的间距",
	"unconnectedBeamsLength": "孤符杠的长度",
	"barlinesHeight": "小节线的长度",
	"hitEffectRadius": "打击效果的半径",
	"distanceBetweenLines": "谱面行间距",
	
	// preferences: colors
	"colors": "颜色",
	"notesColor": "符头的颜色",
	"auxiliariesColor": "辅助物件 (小节线等) 的颜色",
	"perfectColor": "完美的颜色",
	"goodColor": "好的颜色",
	"badColor": "坏的颜色",
	"missColor": "漏失的颜色",
	"excessColor": "多余的颜色",
	"textColor": "前景色 (应用于文字等)",
	"backgroundColor": "背景色",
	
	// preferences: graphics
	"graphics": "图像",
	"graphicsWidth": "分辨率 (宽)",
	"graphicsHeight": "分辨率 (高)",
	"showFPS": "切换 FPS 显示 (F2)",
	"stretchGraphics": "缩放以适配窗口 (F3)",
	"fullscreen": "切换全屏 (F4, F11)",
	
	// preferences: audio
	"audio": "音频",
	"enableHitSound": "启用打击音",
	"hitSound": "打击音",
	"hitSoundWithMusic": "打击音跟随音乐而非输入",
	"musicVolume": "音乐的音量",
	"hitSoundVolume": "打击音的音量",
	"masterVolume": "音量总控",
	
	// preferences: system
	"system": "系统",
	"language": "语言",
	"save": "在网页存储中存储设置",
	"reset": "将所有设置项重设为默认状态",
	"confirmReset": "将所有设置项重设为默认状态?",
	"export": "导出设置为文件",
	"import": "导入设置",
	"importFailure": "导入失败, 由于 %s",
	"wiki": "打开 Dododo 的 wiki (英文网页)",
	"github": "打开 Dododo 的 GitHub 仓库",
	"discord": "加入 Dododo 的 Discord 服务器",
	
	// hit sounds
	"agogoBells": '阿哥哥铃',
	"bassDrum": '低音鼓',
	"bellTree": '树铃',
	"cabasa": "铁沙铃",
	"castanets": "响板",
	"chineseCymbal": "中国钹",
	"chineseHandCymbals1": "中国手钹 1",
	"chineseHandCymbals2": "中国手钹 2",
	"clashCymbals": "手钹",
	"cowbell1": "牛铃 1",
	"cowbell2": "牛铃 2",
	"djembe": "非洲鼓 1",
	"djundjun": "非洲鼓 2",
	"sheepsToenails": "羊脚趾",
	"sleighBells": "马铃",
	"snareDrum1": "小鼓 1",
	"snareDrum2": "小鼓 2",
	"springCoil": "弹簧线圈",
	"surdo1": "巴西低音鼓 1",
	"surdo2": "巴西低音鼓 2",
	"tambourine1": "铃鼓 1",
	"tambourine2": "铃鼓 2",
	"whip": "鞭",
	"woodblock": "木块"
};

Strings["zh-TW"] = {
	// miscellaneous
	"gameTitle": "Dododo",
	"ok": "確認",
	"back": "返回",
	"loading": "載入中...",
	
	// title page
	"browseFiles": "瀏覽文件",
	"browseStore": "瀏覽商店",
	"browseHistory": "瀏覽歷史",
	"preferences": "設定",
	
	// browse files
	"uploadAudio": "上載音頻文件",
	"uploadBeatmap": "上載譜面文件",
	"uploadRecording": "上載回放",
	"noBeatmapWarning": "請先上載譜面文件",
	"title": "曲目",
	"musicAuthor": "曲師",
	"beatmapAuthor": "譜師",
	"difficulty": "難度",
	"defaultDifficulty": "未知",
	"length": "長度",
	
	// browse store
	
	// browse history
	
	// in-game
	"quitGame": "返回",
	"restartGame": "重開",
	"autoPlaying": "自動",
	"perfect": "完美",
	"good": "好",
	"bad": "壞",
	"miss": "小姐",
	"excess": "多餘",
	"maxCombo": "最大連擊數",
	"markP": "觸",
	"markS": "優",
	"markA": "甲",
	"markB": "乙",
	"markC": "丙",
	"markD": "丁",
	"markE": "戊",
	"markF": "拉",
	"fullCombo": "全連",
	"viewRecording": "看回放",
	"saveRecording": "保存回放",
	
	// preferences: modifiers
	"modifiers": "模式",
	"playRate": "倍速",
	"autoPlay": "自動",
	"noBad": "無壞模式",
	"noExcess": "無多餘模式",
	"judgeWindow": "判定區間 (越小越嚴格)",
	"autoCompleteHolds": "自動長押",
	
	// preferences: gameplay
	"gameplay": "遊戲",
	"offset": "音頻延遲 (毫秒)",
	"offsetWizard": "調延遲工具",
	"countdown": "繼續前倒計時",
	"autoRestartGood": "全完美失敗時自動重開",
	"autoRestartMiss": "全連失敗時自動重開",
	"F7Pause": "按 F7 暫停",
	"backtickRestart": "按反引號重開",
	"autoPause": "失焦時自動暫停",
	"recordVisual": "在回放中記錄視覺設定",
	
	// preferences: visual
	"visual": "視覺",
	"FCAPIndicator": "全連/全完美指示器",
	"TPSIndicator": "每秒點擊數指示器",
	"judgeLinePerformances": "啟用裝飾性判定線演出",
	"flashWarningGood": "爆好時閃屏警告",
	"flashWarningMiss": "斷連時閃屏警告",
	"showInaccuracyData": "顯示誤差數據",
	"comboPopupInterval": "連擊數彈出間隔 (0 為不彈出)",
	"fadeIn": "上隱距離 (0 爲不上隱)",
	"fadeOut": "下隱距離 (0 爲不下隱)",
	"reverseVoices": "聲部反轉",
	"mirror": "鏡像 (左右反轉)",
	
	// preferences: geometry
	"geometry": "幾何",
	"fontSize": "字體大小",
	"textHeight": "行高",
	"margin": "頁邊距",
	"voicesHeight": "聲部的高度",
	"stemsLength": "符桿的長度",
	"headsRadius": "符頭的半徑",
	"holdWidth": "麵條的粗細度",
	"beamsWidth": "符槓的粗細度",
	"beamsSpacing": "符槓的間距",
	"unconnectedBeamsLength": "孤符槓的長度",
	"barlinesHeight": "小節線的長度",
	"hitEffectRadius": "打擊效果的半徑",
	"distanceBetweenLines": "譜面行間距",
	
	// preferences: colors
	"colors": "顏色",
	"notesColor": "符頭的顏色",
	"auxiliariesColor": "輔助物件 (小節線等) 的顏色",
	"perfectColor": "完美的顏色",
	"goodColor": "好的顏色",
	"badColor": "壞的顏色",
	"missColor": "漏失的顏色",
	"excessColor": "多餘的顏色",
	"textColor": "前景色 (應用於文字等)",
	"backgroundColor": "背景色",
	
	// preferences: graphics
	"graphics": "圖像",
	"graphicsWidth": "分辨率 (寬)",
	"graphicsHeight": "分辨率 (高)",
	"showFPS": "切換 FPS 顯示 (F2)",
	"stretchGraphics": "縮放以適配窗口 (F3)",
	"fullscreen": "切換全屏 (F4, F11)",
	
	// preferences: audio
	"audio": "音頻",
	"enableHitSound": "啟用打擊音",
	"hitSound": "打擊音",
	"hitSoundWithMusic": "打擊音跟隨音樂而非輸入",
	"musicVolume": "音樂的音量",
	"hitSoundVolume": "打擊音的音量",
	"masterVolume": "音量總控",
	
	// preferences: system
	"system": "系統",
	"language": "語言",
	"save": "在網頁存儲中存儲設定",
	"reset": "將所有設定項重設為默認狀態",
	"confirmReset": "將所有設定項重設為默認狀態?",
	"export": "導出設定為文件",
	"import": "導入設定",
	"importFailure": "導入失敗, 由於 %s",
	"wiki": "打開 Dododo 的 wiki (英文網頁)",
	"github": "打開 Dododo 的 GitHub 倉庫",
	"discord": "加入 Dododo 的 Discord 服務器",
	
	// hit sounds
	"agogoBells": '阿哥哥鈴',
	"bassDrum": '低音鼓',
	"bellTree": '樹鈴',
	"cabasa": "鐵沙鈴",
	"castanets": "響板",
	"chineseCymbal": "中國鈸",
	"chineseHandCymbals1": "中國手鈸 1",
	"chineseHandCymbals2": "中國手鈸 2",
	"clashCymbals": "手鈸",
	"cowbell1": "牛鈴 1",
	"cowbell2": "牛鈴 2",
	"djembe": "非洲鼓 1",
	"djundjun": "非洲鼓 2",
	"sheepsToenails": "羊腳趾",
	"sleighBells": "馬鈴",
	"snareDrum1": "小鼓 1",
	"snareDrum2": "小鼓 2",
	"springCoil": "彈簧線圈",
	"surdo1": "巴西低音鼓 1",
	"surdo2": "巴西低音鼓 2",
	"tambourine1": "鈴鼓 1",
	"tambourine2": "鈴鼓 2",
	"whip": "鞭",
	"woodblock": "木塊"
};

for (const key of Object.keys(Strings["en-US"])) {
	Object.defineProperty(Strings, key, {get: () => Strings[preferences.language][key] || Strings["en-US"][key]})
}
