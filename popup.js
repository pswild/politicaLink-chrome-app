/*******************************************************************************
* Author: Parker Wild, Jeffrey Gleason, Vignesh Rajendran
* NetID: pwild, jgleason, vpr
*
* Project: COS 333 - "politicaLink"
* Program(s): background.js
*
* Description: Implements rendering the content of the popup - passes data
* to the HTML document or prints it directly.
********************************************************************************
* Resources:
* 1) https://jonsuh.com/blog/javascript-templating-without-a-library/
* 2) https://developer.chrome.com/extensions/devguide
*******************************************************************************/

/**
 + * Get the current URL.
 + *
 + * @param {function(string)} callback called when the URL of the current tab
 + *   is found.
 + */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

/**
 * Change the contact information of the current page
 *
 * @param {array} names The names to change to
 * @param {array} phones The phones to change to
 * @param {array} wikis The wikis to change to
 * @param {array} addrs The addrs to change to
 * @param {array} contacts The contacts to change to
 * @param {array} twitters The twitters to change to
 * @param {array} facebooks The facebook to change to
*/
function changeContactInfo(names, phones, wikis, addrs, contacts, twitters, facebooks, parties) {
  // Format the wikipedia URLs
  for (var i = 0; i < wikis.length; i++) {
    wikis[i] = wikis[i].split(' ').join('_');
  }

  // Cache of the template
  var template = document.getElementById("template-list-item");
  // Get the contents of the template
  var templateHtml = template.innerHTML;
  // Final HTML variable as empty string
  var listHtml = "";

  // Loop through arrays, replace placeholder tags
  // with actual data, and generate final HTML
  for (i = 0; i < names.length; i++) {
    listHtml += templateHtml.replace(/{{party}}/g, parties[i])
                            .replace(/{{name}}/g, names[i])
                            .replace(/{{phone}}/g, phones[i])
                            .replace(/{{wiki}}/g, wikis[i])
                            .replace(/{{addr}}/g, addrs[i])
                            .replace(/{{contact}}/g, contacts[i])
                            .replace(/{{facebook}}/g, facebooks[i])
                            .replace(/{{twitter}}/g, twitters[i]);
  }

  // Replace the HTML of #list with final HTML
  document.getElementById("list").innerHTML = listHtml;
}

/**
 * Gets the saved contact information for url.
 *
 * @param {string} url URL whose saved contact information is to be retrieved.
 * @param {function(string)} callback called with the saved contact information for
 *     the given url on success, or a falsy value if no color is retrieved.
*/
function getSavedTabContactInfo(url, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
    chrome.storage.sync.get(url, (items) => {
      callback(chrome.runtime.lastError ? null : items[url]);
  });
}

/**
 * Sets the given contact information for url.
 *
 * @param {string} url URL for which contact information is to be saved.
 * @param {array} names The names to be saved.
 * @param {array} phones The phones to be saved.
 * @param {array} wikis The wikis to be saved.
 * @param {array} addrs The addrs to be saved.
 * @param {array} contacts The contacts to be saved.
 * @param {array} twitters The twitters to be saved.
 * @param {array} facebooks The facebook to be saved.
 */

function saveTabContactInfo(url, names, phones, wikis, addrs, contacts, twitters, facebooks, parties) {
  var items = {};
  items[url] = [names, phones, wikis, addrs, contacts, twitters, facebooks, parties]
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
  // optional callback since we don't need to perform any action once the
  // background color is saved.
  chrome.storage.sync.set(items);
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log('message received')
  });

// Upon loading the content of the DOM, call background script to search
// document and acquire names from content
document.addEventListener('DOMContentLoaded', () => {
  
  // UNCOMMENT THIS LINE TO CLEAR CHROME STORAGE 
  // chrome.storage.sync.clear()
  
  getCurrentTabUrl((url) => {

    // Get name data for this page if already saved
    getSavedTabContactInfo(url, (saved_data) => {
      if (saved_data) {
        console.log(saved_data[0].length)
        console.log('Saved tab - we already have contact data!')
        changeContactInfo(saved_data[0], saved_data[1], saved_data[2], saved_data[3],
          saved_data[4], saved_data[5], saved_data[6], saved_data[7]);
      }
      else {
        console.log('New Tab - must find contact data!')

        // Load background page which contains message from content script with names
        var background = chrome.extension.getBackgroundPage();
        var names = background.found_names;
        var phones = background.found_phones;
        var wikipedias = background.found_wikipedias;
        var addresses = background.found_addresses;
        var contacts = background.found_contact_forms;
        var twitters = background.found_twitters;
        var facebooks = background.found_facebooks;
        var parties = background.found_parties;

        changeContactInfo(names, phones, wikipedias, addresses, contacts, twitters, facebooks, parties);

        // save contact information for this url
        saveTabContactInfo(url, names, phones, wikipedias, addresses, contacts, twitters, facebooks, parties);
      }
    });
  });
});
