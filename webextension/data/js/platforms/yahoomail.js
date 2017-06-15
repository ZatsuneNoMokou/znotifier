let yahooMail = {
	dataURL:"https://mg.mail.yahoo.com/d/folders",
	getViewURL:
		function(websiteState){
			return "https://mail.yahoo.com/";
		},
	getLoginURL:
		function(websiteState){
			return "https://mail.yahoo.com/";
		},
	Request_documentParseToJSON:
		function(xhrRequest){
			let dataDocument = xhrRequest.response;


			let result = new ExtendedMap();

			result.set("logged", false);
			result.set("loginId", "");
			result.set("count", 0);
			result.set("folders", new Map());

			result.set("websiteIcon", "https://s.yimg.com/nq/favicons/2/favicons/favicon-no-badge-32x32.png");

			if(dataDocument === null){
				return null;
			}

			let iconNodes = dataDocument.querySelectorAll("link[rel='shortcut icon'][href]");
			if(iconNodes !== null && iconNodes.length > 0){
				result.set("websiteIcon", iconNodes[0].href);
			}

			if(xhrRequest.responseURL.indexOf('http://mg.mail.yahoo.com') !== -1 || xhrRequest.responseURL.indexOf('https://mg.mail.yahoo.com') !== -1){
				let yM_userId_node = dataDocument.querySelector("#yucs-meta");
				result.set("logged", true);
				result.set("loginId", yM_userId_node.dataset.userid);

				const scripts = dataDocument.scripts;
				let scriptData = null;
				for(let i in scripts){
					if(scripts.hasOwnProperty(i)){
						let script = scripts[i];
						if(script.outerHTML.indexOf('NC.folders=') !== -1){
							scriptData = script;
						}
					}
				}
				if(scriptData.outerHTML.indexOf('{"filterByTotal":') !== -1){
					let scriptDataStr = scriptData.outerHTML;
					scriptDataStr  = scriptDataStr.substr(scriptDataStr.indexOf('{"filterByTotal":'), scriptDataStr.length - 1);

					while(scriptDataStr.indexOf('{"filterByTotal":') !== -1){
						let begin = scriptDataStr.indexOf('{"filterByTotal":'),
							end = scriptDataStr.indexOf('"acctId":"1"}', begin) + 13,
							folderData = null;
						try{
							folderData = JSON.parse(scriptDataStr.substr(begin,end));
						}
						catch(err){
							console.warn(err);
						}

						if(folderData !== null && typeof folderData.unread === "number" && folderData.unread > 0){
							if(
								folderData.types.indexOf("CHATS")!==-1 ||
								folderData.types.indexOf("DRAFT")!==-1 ||
								folderData.types.indexOf("SENT")!==-1 ||
								folderData.types.indexOf("TRASH")!==-1 ||
								folderData.types.indexOf("INVISIBLE")!==-1
							){
								continue;
							}

							const folderCount = folderData.unread,
								folderId = folderData.id;
								folderName = folderData.folderInfo.name;

							if(folderName.toLocaleLowerCase() === "inbox"){
								folderName = _('inbox');
							} else if(folderData.types.indexOf("BULK")!==-1){
								folderName = _('spam');
							}

							result.addValue("count", folderCount);
							result.get("folders").set(folderId, {"folderCount": folderCount, "folderName": folderName});
						}
						scriptDataStr = scriptDataStr.substr(end + 1, scriptDataStr.length);
					}
				}
			}
			return result;
		}
};
websites.set("Yahoo Mail", yahooMail);
