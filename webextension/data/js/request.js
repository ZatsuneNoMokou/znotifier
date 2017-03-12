function mapToObj(myMap){
	if(myMap instanceof Map){
		let obj = {};
		myMap.forEach((value, index, array) => {
			obj[index] = (value instanceof Map)? mapToObj(value) : value;
		})
		return obj;
	} else {
		throw 'myMap should be an Map';
	}
}
class Params extends Map {
	encode() {
		const array = [];
		this.forEach((value, key) => {
			array.push((value || typeof value == 'boolean')? `${encodeURI(key)}=${encodeURI(value)}` : `${encodeURI(key)}`);
		});
		
		return array.join('&');
	}
}
function Request(options){
	if(typeof options.url != "string" && typeof options.onComplete != "function"){
		consoleMsg("warn", "Error in options");
	} else {
		let core = function(method){
			let xhr;
			if(typeof options.anonymous == "boolean"){
				xhr = new XMLHttpRequest({anonymous:true});
			} else {
				xhr = new XMLHttpRequest();
			}
			
			const content = (Array.isArray(options.content) || options.content instanceof Map)? options.content : [];
			const params = new Params(content);
			
			xhr.open(method, ((method == 'GET')? `${options.url}${(params.size > 0)? `?${params.encode()}` : ""}` : options.url), true);
			
			if(typeof options.contentType == "string"){
				xhr.responseType = options.contentType;
			}
			if(typeof options.overrideMimeType == "string"){
				xhr.overrideMimeType(options.overrideMimeType);
			}
			
			xhr.timeout = getPreference("timeout_delay") * 1000;
			
			if(options.hasOwnProperty("headers") == true && typeof options.headers == "object"){
				for(let header in options.headers){
					let value = options.headers[header];
					xhr.setRequestHeader(header, value);
				}
			}
			
			xhr.addEventListener("loadend", function(){
				let response = {
					"url": xhr.responseURL,
					"json": null,
					"status": xhr.status,
					"statusText": xhr.statusText,
					"header": xhr.getAllResponseHeaders()
				}
				if(xhr.responseType == "" || xhr.responseType == "text"){
					response.text= xhr.responseText;
				}
				if(typeof xhr.response != "undefined"){
					response.response = xhr.response;
				}
				
				if(typeof options.urlencodedToJSON == "boolean" && options.urlencodedToJSON == true){
						let jsonDATA = {};
						let splitedData = xhr.responseText.split("&");
						
						function splitEqual(str){
							return str.split("=");
						}
						splitedData = splitedData.map(splitEqual);
						for(let item of splitedData){
							jsonDATA[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
						}
						response.json = jsonDATA;
				} else if(xhr.responseType == "document" && typeof options.Request_documentParseToJSON == "function"){
					let result = options.Request_documentParseToJSON(xhr);
					if(result instanceof Map){
						response.map = result;
						response.json = mapToObj(result);
					} else {
						response.json = result;
					}
				} else {
					try{response.json = JSON.parse(xhr.responseText);}
					catch(error){response.json = null;}
				}
				options.onComplete(response);
			});
			
			if(method == 'GET'){
				xhr.send();
			} else if(method == 'POST'){
				xhr.send(params.encode());
			} else {
				throw `Unknown method "${method}"`
			}
		}
		
		let methods = {
			'get' : function() {
				return core('GET');
			},
			'post' : function() {
				return core('POST');
			}
		};
		return methods;
	}
}
