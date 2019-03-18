const scriptTag = document.createElement('script');
scriptTag.src = chrome.extension.getURL('compute_and_insert_functions.js');
document.getElementsByTagName("head")[0].appendChild(scriptTag);
document.getElementsByTagName("body")[0].setAttribute("onLoad", "proceed_after_header_appear();");
// inspired by https://stackoverflow.com/a/31374433