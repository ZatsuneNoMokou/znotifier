// Avoid keeping init node in memory
let panelinitjs_node = document.querySelector("#panelInit");
panelinitjs_node.parentNode.removeChild(panelinitjs_node);

function sendDataToMain(id, data){
	function responseCallback(response){
		if(typeof response !== "undefined"){
			console.group();
			console.info(`Port response of ${id}: `);
			console.groupEnd();
		}
	}
	chrome.runtime.sendMessage({"sender": "Live_Notifier_Panel","receiver": "Live_Notifier_Main", "id": id, "data": data}, responseCallback);
}

var backgroundPage = chrome.extension.getBackgroundPage();

var theme_cache_update = backgroundPage.backgroundTheme.theme_cache_update;

let options = backgroundPage.optionsData.options;
let options_default = backgroundPage.optionsData.options_default;
let options_default_sync = backgroundPage.optionsData.options_default_sync;

let appGlobal = backgroundPage.appGlobal;

let i18n = chrome.i18n.getMessage;

/*				---- Website notification list ----				*/

let websiteDataList_Node = document.querySelector("#websiteDataList");

function removeAllChildren(node){
	// Taken from https://stackoverflow.com/questions/683366/remove-all-the-children-dom-elements-in-div
	while(node.hasChildNodes()){
		node.removeChild(node.lastChild);
	}
}
function updatePanelData(data){
	console.log("Updating panel data");
	let websites = backgroundPage.websites;
	let websitesData = backgroundPage.websitesData;
	
	removeAllChildren(websiteDataList_Node);
	
	websitesData.forEach((websiteData, website) => {
		let websiteNode = document.createElement("article");
		websiteNode.classList.add("websiteItem");
		websiteNode.classList.add("cursor");
		websiteNode.dataset.logged = websiteData.logged;
		
		websiteNode.style.backgroundImage = "url('" + websiteData.websiteIcon + "')";
		websiteNode.dataset.websiteLogo = websiteData.websiteIcon;
		
		let websiteNode_title = document.createElement("div");
		websiteNode_title.classList.add("websiteTitle");
		websiteNode_title.dataset.website = website;
		websiteNode_title.dataset.count = websiteData.count;
		websiteNode.appendChild(websiteNode_title);
		
		let websiteNode_data = document.createElement("div");
		websiteNode_data.classList.add("websiteData");

		if(websiteData.logged){
			websiteData.folders.forEach((folderData, folderName) => {
				let count = folderData.folderCount;
				if(typeof count === "number" && !isNaN(count) && count > 0){
					let folderNode = document.createElement("span");
					folderNode.classList.add("folder");
					folderNode.dataset.folderCount = count;
					folderNode.dataset.folderTitle = (typeof folderData.folderName === "string")? folderData.folderName : folderName;
					websiteNode_data.appendChild(folderNode);
					
					if(typeof folderData.folderUrl === "string" && folderData.folderUrl !== ""){
						folderNode.dataset.translateTitle = "open_folder";
						folderNode.dataset.folderUrl = folderData.folderUrl;
						folderNode.addEventListener("click", function(event){
							event.stopPropagation();
							backgroundPage.openTabIfNotExist(folderNode.dataset.folderUrl);
						});
					}
				}
			})
		} else {
			let folderNode = document.createElement("span");
			folderNode.classList.add("folder");
			folderNode.dataset.translateId = "not_logged";
			websiteNode_data.appendChild(folderNode);
		}
		websiteNode.appendChild(websiteNode_data);
		
		websiteNode.addEventListener("click", function(event){
			event.stopPropagation();
			backgroundPage.open_website(website);
		});
		websiteNode.dataset.website = website;
		
		websiteDataList_Node.appendChild(websiteNode);
	});

	scrollbar_update("websiteDataList");
}

/*				---- addEventListeners ----				*/
let refreshStreamsButton = document.querySelector("#refreshWebsites");
function refreshButtonClick(){
	let done = function(reason){
		console.dir(reason);
		updatePanelData();
	};
	backgroundPage.refreshWebsitesData()
		.then(done)
		.catch(done)
}
refreshStreamsButton.addEventListener("click",refreshButtonClick,false);

let settingsButton_node = document.querySelector("#settings");
settingsButton_node.addEventListener("click", (event) => { chrome.runtime.openOptionsPage(); }, false);

function current_version(version){
	let current_version_node = document.querySelector("#current_version");
	//current_version_node.textContent = version;
	current_version_node.dataset.currentVersion = version;
}
current_version(chrome.runtime.getManifest().version);

/*				---- load theme ----				*/

function theme_update(){
	let panelColorStylesheet = theme_cache_update(document.querySelector("#generated-color-stylesheet"));
	
	if(typeof panelColorStylesheet === "object" && panelColorStylesheet !== null){
		console.info("Theme update");
		
		let currentThemeNode = document.querySelector("#generated-color-stylesheet");
		currentThemeNode.parentNode.removeChild(currentThemeNode);
		
		document.querySelector("head").appendChild(panelColorStylesheet);
	}
}
theme_update();

/*				---- Load events ----				*/
loadTranslations();

sendDataToMain("panel_onload","");

let scrollbar = {"websiteDataList": null};
function load_scrollbar(id){
	let scroll_node;
	if(id == "websiteDataList"){
		scroll_node = document.querySelector('#websiteDataList');
	} else {
		console.warn(`[Live notifier] Unkown scrollbar id (${id})`);
		return null;
	}
	
	$(scroll_node).perfectScrollbar({
		theme: "slimScrollbar",
		suppressScrollX: true
	});
	/*Ps.initialize(scroll_node, {
		theme: "slimScrollbar",
		suppressScrollX: true
	});*/
}

function scrollbar_update(nodeId){
	if(typeof nodeId === "string" && nodeId !== ""){
		let scrollbar_node = document.querySelector(`#${nodeId}`);
		if(scrollbar_node !== null){
			$(scrollbar_node).perfectScrollbar('update');
			//Ps.update(scrollbar_node);
		}
	}
}

load_scrollbar("websiteDataList");
window.onresize = _.debounce(event=>{
	scrollbar_update("websiteDataList");
}, 500);

updatePanelData();
