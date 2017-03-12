let YouTube = {
	dataURL:"https://www.youtube.com/",
	getViewURL:
		function(websiteState){
			if(websiteState.count > 0){
				return "https://www.youtube.com/feed/subscriptions";
			} else if(websiteState.logged != null && websiteState.logged == false){
				return "https://www.youtube.com/feed/subscriptions"; // dA will redirect it to https://www.deviantart.com/users/login?ref=*
			} else {
				return "https://www.youtube.com/";
			}
		},
	getLoginURL:
		function(websiteState){
			return "https://www.youtube.com/feed/subscriptions";
		},
	Request_documentParseToJSON:
		function(xhrRequest){
			let dataDocument = xhrRequest.response;
			
			let result = new ExtendedMap();
			
			let nodes = dataDocument.querySelectorAll("ul#guide-channels li.guide-channel");

			if(nodes != null){
				result.set("count", 0);
				result.set("logged", false)
				result.set("loginId", "")
				result.set("folders", new Map());
				
				let userId_node = dataDocument.querySelector("#yt-masthead-user");
				if(userId_node != null){
					result.set("logged", true);
					//result.set("loginId", "");
				}
				
				let iconNodes = dataDocument.querySelectorAll("link[sizes][rel*=icon][href]");
				let icons = new ExtendedMap();
				for(let iconNode of iconNodes){
					if(iconNode.getAttribute("sizes") != null){
						icons.set(iconNode.getAttribute("sizes"),iconNode.href);
					}
				}
				let iconUrl = icons.getBestIcon();
				result.set("websiteIcon", iconUrl);
				
				let foldersMap = new Map();
				for(let node of nodes){
					if(typeof node.tagName == "string" && node.hasChildNodes() && node.children.length > 0){ // children exclude text and comment nodes
						let idNode = node;
						let nameNode = node.querySelector(".display-name");
						
						let folderId = "",
							folderName = "";
						
						if(idNode == null){
							continue;
						} else {
							folderId = idNode.id.replace("-guide-item","");
							if(nameNode != null){
								folderName = nameNode.textContent.replace(/[\n\s]*/g,"");
							}
						}
						let folderCount = 0;
						
						let folderCountNode = node.querySelector(".guide-count-value");
						//let urlNode = data.querySelector("a.guide-item[href]");
						if(folderCountNode != null){
							let folderCount = parseInt(folderCountNode.textContent);
							//console.log(`${folderId} (${folderName}): ${folderCount}`);
							
							if(typeof folderCount && !isNaN(folderCount)){
								result.addValue("count", folderCount);
								result.get("folders").set(folderId, {"folderName": folderName,"folderCount": folderCount, "folderUrl": `https:\/\/www.youtube.com/channel/${folderId}`});
							}
						}
					}
				}
				return result;
			} else {
				return null;
			}
		}
}
websites.set("YouTube", YouTube);
