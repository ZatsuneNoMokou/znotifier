'use strict';

//var backgroundPage = chrome.extension.getBackgroundPage();
//var getPreference = backgroundPage.getPreference;

function color(hexColorCode) {
	let getCodes =  /^#([\da-fA-F]{2,2})([\da-fA-F]{2,2})([\da-fA-F]{2,2})$/;
	if(getCodes.test(hexColorCode)){
		let result = getCodes.exec(hexColorCode);
		this.R= parseInt(result[1],16);
		this.G= parseInt(result[2],16);
		this.B= parseInt(result[3],16);
	}
	this.rgbCode = function(){
		return "rgb(" + this.R + ", " + this.G + ", " + this.B + ")";
	}
	/* RGB to HSL function from https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion/9493060#9493060 */
	this.getHSL = function(){
		let r = this.R;let g = this.G;let b = this.B;
		
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if(max == min){
			h = s = 0; // achromatic
		}else{
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		return {"H": h * 360, "S": s * 100 + "%", "L": l * 100 + "%"};
	}
}

let backgroundPage_theme_cache = null;
function theme_cache_update(colorStylesheetNode){
	let currentTheme = getPreference("panel_theme");
	let background_color = getPreference("background_color");
	
	if(backgroundPage_theme_cache != null && colorStylesheetNode != null && currentTheme == backgroundPage_theme_cache.dataset.theme && background_color == backgroundPage_theme_cache.dataset.background_color){
		if(colorStylesheetNode != null && currentTheme == colorStylesheetNode.dataset.theme && background_color == colorStylesheetNode.dataset.background_color){
			console.info("Loaded theme is already good");
			return null;
		} else {
			console.info("Using background page theme cache");
			return backgroundPage_theme_cache.cloneNode(true);
		}
	} else {
		let baseColor = new color(background_color);
		if(typeof baseColor != "object"){return null;}
		backgroundPage_theme_cache = document.createElement("style");
		backgroundPage_theme_cache.id = "generated-color-stylesheet";
		let baseColor_hsl = baseColor.getHSL();
		let baseColor_L = JSON.parse(baseColor_hsl.L.replace("%",""))/100;
		let values;
		if(currentTheme == "dark"){
			var textColor_stylesheet = "@import url(css/panel-text-color-white.css);";
			if(baseColor_L > 0.5 || baseColor_L < 0.1){
				values = ["19%","13%","26%","13%"];
			} else {
				values = [(baseColor_L + 0.06) * 100 + "%", baseColor_L * 100 + "%", (baseColor_L + 0.13) * 100 + "%", baseColor_L * 100 + "%"];
			}
		} else if(currentTheme == "light"){
			var textColor_stylesheet = "@import url(css/panel-text-color-black.css);";
			if(baseColor_L < 0.5 /*|| baseColor_L > 0.9*/){
				values = ["87%","74%","81%","87%"];
			} else {
				values = [baseColor_L * 100 + "%", (baseColor_L - 0.13) * 100 + "%", (baseColor_L - 0.06) * 100 + "%", baseColor_L * 100 + "%"];
			}
		}
		backgroundPage_theme_cache.textContent = `
${textColor_stylesheet}
body {background-color: hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${values[0]});}
header, footer {background-color: hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${values[1]});}
header button, button, input[type=number], select, .websiteItem {background-color: hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${values[2]});}

input[type=range]::-webkit-slider-thumb{background-color: hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${values[2]});}
input[type=range]::-moz-range-thumb{background-color: hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${values[2]});}

input[type=range]::-webkit-slider-runnable-track{background-color:hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${values[1]});}
input[type=range]::-moz-range-track{background-color:hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${values[1]});}

header, .websiteItem, footer{box-shadow: 0px 0px 5px 0px hsl(${baseColor_hsl.H}, ${baseColor_hsl.S}, ${values[3]});}
`
		backgroundPage_theme_cache.dataset.theme = currentTheme;
		backgroundPage_theme_cache.dataset.background_color = background_color;
		//console.log(baseColor.rgbCode());
		//console.log("hsl(" + baseColor_hsl.H + ", " + baseColor_hsl.S + ", " + baseColor_hsl.L + ")");
		
		return backgroundPage_theme_cache.cloneNode(true);
	}
}

// Build theme cache on addon load
theme_cache_update(null);

var backgroundTheme = {"color": color, "theme_cache_update": theme_cache_update};
