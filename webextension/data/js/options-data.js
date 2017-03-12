'use strict';

var optionsData = {};
optionsData.options = {
	/*			Check delay			*/
	"check_delay": {
		"title": "Streams status delay",
		"description": "Delay between checks, in minute",
		"type": "integer",
		"value": 5,
		"minValue": 1,
		"prefLevel": "advanced"
	},
	"timeout_delay": {
		"title": "Streams timeout delay",
		"description": "Timeout delay of requests, in sec (between 10 and 30)",
		"type": "integer",
		"value": 30,
		"minValue": 10,
		"maxValue": 30,
		"rangeInput": true,
		"prefLevel": "experimented"
	},
	/*			Notifications			*/
	"global_notify": {
		"title": "Show a global notification for all websites",
		"description": "Global notification when checked",
		"type": "bool",
		"value": true,
		"group": "notifications",
		"prefLevel": "basic"
	},
	"notify_all_viewed": {
		"title": "Show a notification when all view in website(s)",
		"description": "Notification when checked",
		"type": "bool",
		"value": false,
		"group": "notifications",
		"prefLevel": "advanced"
	},
	"notify": {
		"title": "Show a notification on new notications",
		"description": "Notification when checked",
		"type": "bool",
		"value": true,
		"group": "notifications",
		"prefLevel": "basic"
	},
	"notify_vocal": {
		"title": "Read a vocal notification on new notications",
		"description": "Notification when checked",
		"type": "bool",
		"value": false,
		"group": "notifications",
		"prefLevel": "basic"
	},
	"vocal_volume": {
		"title": "Volume of vocal notifiations",
		"description": "In percent",
		"type": "integer",
		"value": 70,
		"minValue": 0,
		"maxValue": 100,
		"rangeInput": true,
		"prefLevel": "basic"
	},
	/*			Theme			*/
	"panel_theme": {
		"title": "Panel theme",
		"description": "Choose the panel of the panel",
		"type": "menulist",
		"value": "dark",
		"options": [
				{
					"value": "dark",
					"label": "Dark"
				},
				{
					"value": "light",
					"label": "Light"
				}
			],
		"group": "theme",
		"prefLevel": "basic"
	},
	"background_color": {
		"title": "Panel background color",
		"description": "Choose background color",
		"type": "color",
		"value": "#000000",
		"group": "theme",
		"prefLevel": "basic"
	},
	/*			Import/Export Prefs			*/
	"export_preferences": {
		"title": "Export preferences from a file",
		"label": "Export preferences",
		"type": "control",
		"group": "importexport_prefs",
		"prefLevel": "basic"
	},
	"import_preferences": {
		"title": "Import preferences from a file",
		"label": "Import preferences",
		"type": "control",
		"group": "importexport_prefs",
		"prefLevel": "basic"
	},
	/*			Settings level			*/
	"showAdvanced": {
		"title": "Show advanced settings",
		"description": "Enabled when checked",
		"type": "bool",
		"value": false,
		"group": "settingsLevel",
		"prefLevel": "basic"
	},
	"showExperimented": {
		"title": "Show setting for experimented users",
		"description": "Enabled when checked",
		"type": "bool",
		"value": false,
		"group": "settingsLevel",
		"showPrefInPanel": false,
		"prefLevel": "advanced"
	},
	/*			Internal				*/
	"zNotifier_version": {
		"type": "string",
		"hidden": true,
		"sync": false,
		"value": "0.0.0"
	}}

optionsData.options_default = {};
optionsData.options_default_sync = {};

for(var id in optionsData.options){
	var option = optionsData.options[id];
	if(typeof option.value != "undefined"){
		optionsData.options_default[id] = option.value;
		
		if(!(typeof option.sync == "boolean" && option.sync == false)){
			optionsData.options_default_sync[id] = option.value;
		}
	}
}
