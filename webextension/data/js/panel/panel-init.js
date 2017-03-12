'use strict';

var backgroundPage = chrome.extension.getBackgroundPage();
var getPreference = backgroundPage.getPreference;

var theme_cache_update = backgroundPage.backgroundTheme.theme_cache_update;
var optionColorStylesheet = theme_cache_update(document.querySelector("#generated-color-stylesheet"));

let body = document.querySelector("body");
let onDomContentLoad = function(event){
	if(typeof optionColorStylesheet == "object" && optionColorStylesheet !== null){
		console.info("Theme update");
		
		let currentThemeNode = document.querySelector("#generated-color-stylesheet");
		currentThemeNode.parentNode.removeChild(currentThemeNode);
		
		document.querySelector("head").appendChild(optionColorStylesheet);
	}
	body.removeEventListener("domcontentloaded",onDomContentLoad);
}
body.addEventListener("domcontentloaded",onDomContentLoad);

let loadJS = chrome.extension.getBackgroundPage().loadJS;
window.onload = function () {
	window.onload = null;
	loadJS(document, "/data/js/", ["lib/jquery-3.1.0.min.js", "lib/perfect-scrollbar.jquery.min.js", "lib/bootstrap.min.js", "options-api.js", "lib/underscore-min.js", "panel/panel.js"]);
}
