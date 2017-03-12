'use strict';

let _ = chrome.i18n.getMessage;

// appGlobal: Accessible with chrome.extension.getBackgroundPage();
var appGlobal = {
	loadJS: loadJS
}

let options = optionsData.options,
	options_default = optionsData.options_default,
	options_default_sync = optionsData.options_default_sync;


function consoleMsg(level,str){
	let msg = (typeof str.toString == "function")? str.toString() : str;
	if(getPreference("showAdvanced") && getPreference("showExperimented")){
		if(typeof console[level] == "function"){
			console[level](str)
		} else {
			consoleMsg("log", str);
		}
	}
}
function consoleDir(obj,str){
	if(getPreference("showAdvanced") && getPreference("showExperimented")){
		if(typeof str == "string" || (typeof str != "undefined" && typeof str.toString == "function")){
			console.group();
			console.info((typeof str == "string")? str : str.toString());
			console.dir(obj);
			console.groupEnd();
		} else {
			console.dir(obj);
		}
	}
}

function doNotif(title, message, imgurl) {
	doActionNotif(title, message, {}, imgurl);
}
appGlobal["doNotif"] = doNotif;
function doNotificationAction_Event(notificationId){
	if(typeof notificationId == "string" && notificationId != ""){
		let action = JSON.parse(notificationId);
		
		switch(action.type){
			case "notificationList":
				open_website(action.data.website);
				break;
			case "notLogged":
				open_website_login(action.data.website);
				break;
			case "openUrl":
				// Notification with openUrl action
				openTabIfNotExist(action.data);
				break;
			default:
				// Nothing - Unknown action
		}
	}
}
chrome.notifications.onClicked.addListener(function(notificationId){
	consoleMsg("info",`${notificationId} (onClicked)`);
	chrome.notifications.clear(notificationId);
	
	if(!chromeAPI_button_availability){
		doNotificationAction_Event(notificationId);
	}
})
chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex){
	consoleMsg("info",`${notificationId} (onButtonClicked) - Button index: ${buttonIndex}`);
	chrome.notifications.clear(notificationId);
	
	// 0 is the first button, used as button of action
	if(buttonIndex == 0){
		doNotificationAction_Event(notificationId);
	}
})

class notifAction{
	constructor(type, data){
		this.type = type;
		this.data = data;
	}
}
let chromeAPI_list_availability = true,
	chromeAPI_button_availability = true;
function doActionNotif(title, message, action, imgurl){
	let options = {
		type: "basic",
		title: title,
		message: message,
		contextMessage: chrome.runtime.getManifest().name,
		iconUrl: (typeof imgurl != "undefined")? imgurl : "/icon_128.png",
		isClickable: true
	}
	
	let openUrl = {title: _("Open_in_browser"), iconUrl: "/data/images/ic_open_in_browser_black_24px.svg"},
		close = {title: _("Close"), iconUrl: "/data/images/ic_close_black_24px.svg"},
		log_in = {title: _("LogIn"), iconUrl: "/data/images/ic_open_in_browser_black_24px.svg"};
	
	if(chromeAPI_list_availability == true && action.type == "notificationList"){
		options.type = "list";
		options.items = action.data.list;
	} else if(chromeAPI_button_availability == true){
		// 2 buttons max per notification
		// 2nd button is a cancel (no action) button
		switch(action.type){
			case "notLogged":
				options.buttons = [log_in, close]
				break;
			case "openUrl":
				// Notification with openUrl action
				options.buttons = [openUrl, close]
				break;
			default:
				options.buttons = [close];
		}
	}
	
	let notification_id = "";
	if(JSON.stringify(action) != "{}"){
		if(typeof action.data == "string"){
			consoleMsg("info",`Notification (${action.type}): "${message}" (${action.data})`);
		} else {
			consoleDir(action.data, `Notification (${action.type}): "${message}"`);
		}
		notification_id = JSON.stringify(action);
	} else {
		notification_id = JSON.stringify(new notifAction("none", {timestamp: Date.now()}));
	}
	
	new Promise((resolve, reject) => {
		chrome.notifications.create(notification_id, options, function(notificationId){
			if(typeof chrome.runtime.lastError == "object" && chrome.runtime.lastError != null && typeof chrome.runtime.lastError.message == "string" && chrome.runtime.lastError.message.length > 0){
				reject(chrome.runtime.lastError);
			}
		});
	}).catch((error)=> {
		if(typeof error == "object" && typeof error.message == "string" && error.message.length > 0){
			consoleDir(error,error.message);
			
			if(/*error.message == "Adding buttons to notifications is not supported." ||*/ error.message.indexOf("\"list\"") != -1){
				chromeAPI_list_availability = false;
				consoleMsg("log","List not supported, retrying notification without it.")
				doActionNotif(title, message, action, imgurl);
			} else if(error.message == "Adding buttons to notifications is not supported." || error.message.indexOf("\"buttons\"") != -1){
				chromeAPI_button_availability = false;
				consoleMsg("log","Buttons not supported, retrying notification without them.")
				doActionNotif(title, message, action, imgurl);
			}
		}
	})
}


function openTabIfNotExist(url){
	//consoleMsg("log",url);
	chrome.tabs.query({}, function(tabs) {
		let custom_url = url.toLowerCase().replace(/http(?:s)?\:\/\/(?:www\.)?/i,"");
		for(let tab of tabs){
			if(tab.url.toLowerCase().indexOf(custom_url) != -1){ // Mean the url was already opened in a tab
				chrome.tabs.highlight({tabs: tab.index}); // Show the already opened tab
				chrome.tabs.reload(tab.id); // Reload the already opened tab
				return true; // Return true to stop the function as the tab is already opened
			}
		}
		// If the function is still running, it mean that the url isn't detected to be opened, so, we can open it
		let action_url = url;
		chrome.tabs.create({ url: action_url });
		return false; // Return false because the url wasn't already in a tab
	});
}
function open_website(website){
	let websiteAPI = websites.get(website);
	let websiteData = websitesData.get(website);
	openTabIfNotExist(websiteAPI.getViewURL(websiteData));
}
function open_website_login(website){
	let websiteAPI = websites.get(website);
	let websiteData = websitesData.get(website);
	openTabIfNotExist(websiteAPI.getLoginURL(websiteData));
}

class ExtendedMap extends Map{
	addValue(id, newValue) {
		this.set(id, this.get(id) + newValue)
	}
	
	getBestIcon(){
		// Map must be a Map of items like ["64x64",<url>]
		let bestIconMinSize = 0;
		let bestUrl = "";
		this.forEach((value, index) => {
			let sizes = index.split("x");
			if(sizes.length == 2){
				let minSize = Math.min(sizes[0],sizes[1]);
				if(minSize > bestIconMinSize){
					bestIconMinSize = minSize;
					bestUrl = value;
				}
			}
		})
		return bestUrl;
	}
}

function doNotifyWebsite(website){
	let websiteData = websitesData.get(website);
	let label = chrome.runtime.getManifest().name;
	let notificationList = [],
		labelArray = [];
	
	if(websiteData.logged){
		if(websiteData.hasOwnProperty("folders")){
			websiteData.folders.forEach((folderData, name) => {
				let count = folderData.folderCount;
				if(typeof count == "number" && !isNaN(count) && count > 0){
					labelArray.push(`${name}: ${count}`);
					notificationList.push({"title": `${(typeof folderData.folderName == "string")? folderData.folderName : name}: `, "message": count.toString()});
				}
			})
			label = labelArray.join("\n");
		}
	}
	if(!websiteData.logged){
		label = _("website_not_logged", website);
		if(websiteData.notificationState.logged == null || websiteData.notificationState.logged == true){
			doActionNotif(_("website_notif", website), _("website_not_logged", website), new notifAction("notLogged", {"website": website}), websiteData.websiteIcon);
		}
		websiteData.notificationState.logged = websiteData.logged;
	} else if(typeof websiteData.count == "number" && !isNaN(websiteData.count) && (websiteData.notificationState.count == null || websiteData.count > websiteData.notificationState.count)){
		if(getPreference("notify")){
			doActionNotif(_("website_notif", website), _("count_new_notif", websiteData.count.toString()), new notifAction("notificationList", {"website": website, "list": notificationList}), websiteData.websiteIcon);
		}
		
		if(getPreference("notify_vocal")){
			voiceReadMessage("fr", _("count_new_notif", websiteData.count.toString()));
		}
	} else if(getPreference("notify_all_viewed") && (typeof websiteData.count == "number" && websiteData.count == 0) && (typeof websiteData.notificationState.count == "number" && websiteData.notificationState.count > 0)){
		doActionNotif(_("website_notif", website), _("all_viewed"), new notifAction("none", {"website": website}), websiteData.websiteIcon);
	}
	websiteData.notificationState.count = websiteData.count;
}

let globalCount = null;
function doNotifyWebsites(){
	let newGlobalCount = null,
		notificationList = [],
		labelArray = [];
	websitesData.forEach((websiteData, website)=>{
		let label = chrome.runtime.getManifest().name;
		
		
		if(websiteData.logged){
			let suffix = "";
			if(websiteData.notificationState.count != null && websiteData.count > websiteData.notificationState.count){
				suffix=`(${websiteData.count - websiteData.notificationState.count})`;
			}
			
			if(websiteData.notificationState.count == null || suffix != ""){
				notificationList.push(`${website}: ${websiteData.count} ${suffix}`);
			}
			newGlobalCount = ((newGlobalCount != null)? newGlobalCount : 0) + websiteData.count;
		} else {
			if(websiteData.notificationState.logged == null || websiteData.notificationState.logged == true){
				notificationList.push(website + ": " +  _("not_logged"));
			}
			websiteData.notificationState.logged = (websiteData.logged != null)? websiteData.logged : false;
		}
		websiteData.notificationState.count = websiteData.count;
	})
	
	if(newGlobalCount != null && notificationList.length > 0){
		if(getPreference("notify")){
			doActionNotif(_("count_new_notif", newGlobalCount.toString()), notificationList.join("\n"), new notifAction("none",{}));
		}
		if(getPreference("notify_vocal")){
			voiceReadMessage("fr", _("count_new_notif_noplural", newGlobalCount.toString()));
		}
	} else if(newGlobalCount != null && notificationList.length == 0 && newGlobalCount == 0 && (typeof globalCount == "number" && globalCount > 0) && getPreference("notify_all_viewed")){
		doActionNotif("z-Notifier", _("all_viewed"), new notifAction("none",{}));
	}
	globalCount = newGlobalCount;
}


class websiteDefaultData{
	constructor(){
		return {
			"notificationState": {
				"count": null,
				"logged": null
			},
			"count": 0,
			"folders": new ExtendedMap(),
			"websiteIcon": "",
			"logged": null,
			"loginId": ""
		}
	}
}
function PromiseWaitAll(promises){
	if(Array.isArray(promises) || isMap(promises)){
		let count = (isMap(promises))? promises.size : promises.length;
		let results = {};
		return new Promise(function(resolve, reject){
			promises.forEach((promise, index, array) => {
				let handler = data => {
					results[index] = data;
					if(--count == 0){
						resolve(results);
					}
				}
				
				if(promise instanceof Promise){
					promise.then(handler);
					promise.catch(handler);
				} else {
					handler(promise);
				}
			})
			if(count == 0){
				resolve(results);
			}
		});
	} else {
		throw "promises should be an Array or Map of Promise"
	}
}
function isMap(myMap){
	return (myMap instanceof Map || myMap.constructor.name == "Map");
}
function refreshWebsitesData(){
	return new Promise((resolve, reject) => {
		consoleMsg("info", "Refreshing websites data...");
		let promises = new Map();
		
		let onPromiseEnd = function(data){
			let count = null;
			let label = chrome.runtime.getManifest().name;
			
			
			websitesData.forEach((websiteData, website) => {
				if(websiteData.logged && websiteData.count != null){
					if(count == null){
						count = 0;
					}
					count += websiteData.count;
				}
			})
			
			if(getPreference("showAdvanced") && getPreference("showExperimented")){
				console.group();
				consoleMsg("info", "Websites check end");
				consoleDir(data, "xhrRequests:");
				consoleDir(mapToObj(websitesData), "Data:");
				console.groupEnd();
			}
			
			chrome.browserAction.setTitle({title: (count == null)? _("no_website_logged") : label});
			chrome.browserAction.setBadgeText({text: (count != null)? count.toString() : ""});
			chrome.browserAction.setBadgeBackgroundColor({color: (count != null && count > 0)? "#FF0000" : "#424242"});
			
			resolve(data);
			
			if(getPreference("global_notify")){
				doNotifyWebsites();
			}
		}
		
		websites.forEach((websiteAPI, website) =>{
			promises.set(website, refreshWebsite(website));
			promises.get(website)
				.then((data) => {
					if(!getPreference("global_notify")){
						doNotifyWebsite(website);
					}
				})
				.catch((data) => {consoleDir(data,"refreshWebsitesData");})
		})
		
		PromiseWaitAll(promises)
			.then(onPromiseEnd)
			.catch(onPromiseEnd)
		
		clearInterval(interval);
		interval = setInterval(refreshWebsitesData, getPreference('check_delay') * 60000);
	});
}
function refreshWebsite(website){
	return new Promise((resolve, reject) => {
		Request({
			url: websites.get(website).dataURL,
			overrideMimeType: "text/html; charset=utf-8",
			contentType: "document",
			Request_documentParseToJSON: websites.get(website).Request_documentParseToJSON,
			onComplete: function (xhrRequest) {
				if(/*(/^2\d*$/.test(xhrRequest.status) == true || xhrRequest.statusText == "OK") && */ xhrRequest.json != null){
					let data = xhrRequest.map;
					let websiteData = websitesData.get(website);
					
					websiteData.count = data.get("count");
					websiteData.logged = data.get("logged");
					websiteData.loginId = data.get("loginId");
					websiteData.websiteIcon = data.get("websiteIcon");
					if(data.has("folders")){
						websiteData.folders = data.get("folders");
					}
					resolve(xhrRequest);
				} else {
					consoleMsg("warn", `Error retrieving page for "${website}"`);
					//let websiteData = websitesData.get(website);
					//websiteData.logged  = false;
					resolve(xhrRequest);
				}
				
			}
		}).get();
	})
}


var interval,
	websites = new Map(),
	websitesData = new Map();

function initAddon(){
	websites.forEach((websiteAPI, website) => {
		websitesData.set(website, new websiteDefaultData());
	})
	
	refreshWebsitesData();
}

// Checking if updated
let previousVersion = "";
let current_version = appGlobal["version"] = chrome.runtime.getManifest().version;
function checkIfUpdated(details){
	let getVersionNumbers =  /^(\d*)\.(\d*)\.(\d*)$/;
	
	let installReason = details.reason;
	consoleMsg("info", `Runtime onInstalled reason: ${installReason}`);
	
	// Checking if updated
	if(installReason == "update" || installReason == "unknown"){
		previousVersion = details.previousVersion;
		let previousVersion_numbers = getVersionNumbers.exec(previousVersion);
		let current_version_numbers = getVersionNumbers.exec(current_version);
		
		if(previousVersion != current_version){
			if(current_version_numbers.length == 4 && previousVersion_numbers.length == 4){
				if(current_version_numbers[1] > previousVersion_numbers[1]){
					doNotif("z-Notifier", _("Addon_have_been_updated", current_version));
				} else if((current_version_numbers[1] == previousVersion_numbers[1]) && (current_version_numbers[2] > previousVersion_numbers[2])){
					doNotif("z-Notifier", _("Addon_have_been_updated", current_version));
				} else if((current_version_numbers[1] == previousVersion_numbers[1]) && (current_version_numbers[2] == previousVersion_numbers[2]) && (current_version_numbers[3] > previousVersion_numbers[3])){
					doNotif("z-Notifier", _("Addon_have_been_updated", current_version));
				}
			}
		}
	}
	/*if(typeof chrome.runtime.onInstalled == "object" && typeof chrome.runtime.onInstalled.removeListener == "function"){
		chrome.runtime.onInstalled.removeListener(checkIfUpdated);
	} else {*/
		savePreference("zNotifier_version", current_version);
	//}
}

chrome.storage.local.get(null,function(currentLocalStorage) {
	let currentPreferences = {};
	for(let prefId in currentLocalStorage){
		if(optionsData.options_default.hasOwnProperty(prefId)){
			currentPreferences[prefId] = currentLocalStorage[prefId];
		} else {
			currentPreferences[prefId] = currentLocalStorage[prefId];
			console.warn(`${prefId} has no default value (value: ${currentLocalStorage[prefId]})`);
		}
	}
	
	// Load default settings for the missing settings without saving them in the storage
	for(let prefId in optionsData.options_default){
		if(!currentPreferences.hasOwnProperty(prefId)){
			currentPreferences[prefId] = optionsData.options_default[prefId];
		}
	}
	
	appGlobal.currentPreferences = currentPreferences;
	consoleDir(currentPreferences,"Current preferences in the local storage:");
	
	/*if(typeof chrome.runtime.onInstalled == "object" && typeof chrome.runtime.onInstalled.removeListener == "function"){
		chrome.runtime.onInstalled.addListener(checkIfUpdated);
	} else {*/
		//consoleMsg("warn", "chrome.runtime.onInstalled is not available");
		let details;
		if(typeof getPreference("zNotifier_version") == "string" && getPreference("zNotifier_version") != ""){
			details = {
				"reason": "unknown",
				"previousVersion": getPreference("zNotifier_version")
			}
		} else {
			details = {
				"reason": "install",
				"previousVersion": "0.0.0"
			}
		}
		checkIfUpdated(details);
	//}
	
	loadJS(document, "/data/js/", ["backgroundTheme.js"]);
	loadJS(document, "/data/js/platforms/", ["deviantart.js","youtube.js"])
		.then(initAddon)
		.catch(initAddon)
})
