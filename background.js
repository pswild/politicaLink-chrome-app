/*******************************************************************************
* Author: Parker Wild, Jeffrey Gleason, Vignesh Rajendran
* NetID: pwild, jgleason, vpr
*
* Project: COS 333 - "politicaLink"
* Program(s): background.js
*
* Description: Shares local variables with the content.js script. Receives names
* and can be accessed in the popup.js script.
********************************************************************************
* Resources:
*******************************************************************************/

// Stores name and media information from found politicians
var found_names;
var found_phones;
var found_wikipedias;
var found_addresses;
var found_contact_forms;
var found_twitters;
var found_facebooks;
var found_parties;

chrome.runtime.onMessage.addListener(function(response, sender, sendResponse) {

    // check that message from content script is received
    console.log('received message from content script')

    // Assign array of names to be data receieved from content script
    var names = response.names;
    console.log(names)

    // Clear arrays from previous tabs
    found_names = [];
    found_phones = [];
    found_wikipedias = [];
    found_addresses = [];
    found_contact_forms = [];
    found_twitters = [];
    found_facebooks = [];
    found_parties = [];
    highlight_names = [];
    highlight_parties = [];

    // Initialize firebase
    var config = {
      apiKey: "AIzaSyCthA5jsrvzA_7FMex2X-YOMkvKeEKFsFE",
      databaseURL: "https://politicalink-6c215.firebaseio.com",
      storageBucket: "politicalink-6c215.appspot.com"
    };

    // Checks to see if Firebase reference already exists
    if (!firebase.apps.length) {
      var check = firebase.initializeApp(config);
    }

    // Connect to firebase and find politician information
    var query = firebase.database().ref();
    query.once("value").then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          for (i = 0; i < names.length; i++) {
            var string_split = names[i].split(" ");

            // Problem with name because official_full name (ex. Cory A. Booker)
            // rarely matches name we found in text (ex. cory booker). We need to
            // do some more pre-processing to make equality check looser
            if (childSnapshot.child("first_name").val().toLowerCase()
                  == string_split[0] &&
              childSnapshot.child("last_name").val().toLowerCase()
                  == string_split[string_split.length-1]) {

              // MUST REMOVE DUPLICATES BEFORE ADDING TO NAME LIST!!
              // EXAMPLE -> could have "paul ryan" and "paul d. ryan", both would be added to popup list

              // Add names
              var full_name = childSnapshot.child("first_name").val() + ' ' + childSnapshot.child("last_name").val()
              found_names.push(full_name);

              // Add name from website document to list of names to highlight
              highlight_names.push(names[i]);

              // Add phones
              found_phones.push(childSnapshot.child("phone").val());

              // Add wikipedias
              found_wikipedias.push(childSnapshot.child("wikipedia_id").val());

              // Add addresses
              found_addresses.push(childSnapshot.child("address").val());

              // Add contact form
              found_contact_forms.push(childSnapshot.child("contact_form").val());

              // Add twitter
              found_twitters.push(childSnapshot.child("twitter").val());

              // Add facebook
              found_facebooks.push(childSnapshot.child("facebook").val());

              // add political parties
              if (childSnapshot.child("party").val() == 'Democrat') {
                found_parties.push('rgba(4,67,137,0.67)');
                highlight_parties.push('rgba(4,67,137,0.33)')
              }
              else if (childSnapshot.child("party").val() == 'Republican') {
                found_parties.push('rgba(251,77,61,0.67)');
                highlight_parties.push('rgba(251,77,61,0.33)');
              }
              else if (childSnapshot.child("party").val() == 'Independent') {
                found_parties.push('rgba(78,205,196,0.67)');
                highlight_parties.push('rgba(78,205,196,0.33)');
              }

              console.log('Found: ' + string_split);
            }
          }
        });
        // send message to content script to highlight names found
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {names: highlight_names, parties: highlight_parties});
        });
      });
});