const scriptTag = document.createElement('script');
scriptTag.src = chrome.extension.getURL('compute_and_insert.js');
document.getElementsByTagName("body")[0].appendChild(scriptTag);
