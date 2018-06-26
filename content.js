/*******************************************************************************
* Author: Parker Wild, Jeffrey Gleason, Vignesh Rajendran
* NetID: pwild, jgleason, vpr
*
* Project: COS 333 - "politicaLink"
* Program(s): content.js
*
* Description: Interacts with the content of the webpage. Scrapes for names
* displayed in the main article, sorts them by frequency, and cleans up the
* array before returning it to the background.js script.
*
********************************************************************************
* Resources:
*
* Chrome Extension Message Passing Tutorial:
* https://www.youtube.com/
* watch?v=wjiku6X-hd8&list=PLYxzS__5yYQlWil-vQ-y7NR902ovyq1Xi&index=4\
*
* DOM Tree Walker:
* https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker
*
* NLP Compromise Library:
* https://github.com/nlp-compromise/compromise
*
* Sort array by frequency and uniqueness:
* https://stackoverflow.com/questions/3579486/
* sort-a-javascript-array-by-frequency-and-then-filter-repeats
*
* Replace and Re-Format Words in Body of Article:
* https://github.com/panicsteve/cloud-to-butt
* and https://stackoverflow.com/questions/5904914/javascript-regex-to-replace-text-not-in-html-attributes/5904945#5904945
*******************************************************************************/

// Listens for message from background script with names to highlight in document
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
   	
   	// get last names for highlighting
   	last_names = []
   	for (var i = 0; i < request.names.length; i++) {
   		split = request.names[i].split(" ");
   		last_names.push(split[split.length - 1]);
   	}

   	// track frequency of last names for ordering
   	frequency_names = []
   	for (var i = 0; i < last_names.length; i++) {
   		frequency_names.push(0);
   	}

    // code on lines 40-82 copied and modified from
    // Steven Frank of Cloud to Butt (https://github.com/panicsteve/cloud-to-butt/)
    // with public use liscence 
    walk(document.body, frequency_names);
    //console.log(frequency_names)

	function walk(node, counts) 
	{
		// I stole this function from here:
		// http://is.gd/mwZp7E
		
		var child, next;
		
		//if (node.tagName.toLowerCase() == 'input' || node.tagName.toLowerCase() == 'textarea'
		//    || node.classList.indexOf('ace_editor') > -1) {
		//	return;
		//}

		switch ( node.nodeType )  
		{
			case 1:  // Element
			case 9:  // Document
			case 11: // Document fragment
				child = node.firstChild;
				while ( child ) 
				{
					next = child.nextSibling;
					walk(child, counts);
					child = next;
				}
				break;

			case 3: // Text node
				handleText(node, counts);
				break;
		}
	}

	function handleText(textNode, counts) 
	{
		var v = textNode.nodeValue;

		for (var i = 0; i < last_names.length; i++) {
			var index = v.toLowerCase().indexOf(last_names[i])
			if (index >= 0 && index <= textNode.length) {
				counts[i] = counts[i] + 1;
				var string_match = textNode.splitText(index);
				var string_after = string_match.splitText(last_names[i].length);
				var mark = document.createElement('mark');
				mark.style.backgroundColor = request.parties[i];
				mark.appendChild(string_match);
				textNode.parentNode.insertBefore(mark, string_after);
			}
		}
	}
  });

// Sort array by frequency and filter duplicates
function sortFreqUnique(names) {
	var frequency = {}, value;

	// Compute frequencies of each value
	for (var i = 0; i < names.length; i++) {
		value = names[i];
		if(value in frequency) {
			frequency[value]++;
		}
		else {
			frequency[value] = 1;
		}
	}

	// Make array from the frequency object to de-duplicate the original array
	var uniques = [];
	for (value in frequency) {
		uniques.push(value);
	}

	// Sort the unique array in descending order by frequency
	function compareFrequency(a, b) {
		return frequency[b] - frequency[a];
	}

	// Call JavaScript ArraySort
	return uniques.sort(compareFrequency);
}

var findNames = function() {

	// Create object that traverses text nodes in the DOM tree
	var domTreeWalker =
		document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

	// Create final names array to concatenate all node text
	var names = [];

	// Traverse tree and find names
	while(domTreeWalker.nextNode()) {

		// NOTE: WE SHOULD ONLY TRAVERSE NODES FOR TEXT THAT BELONG TO THE MAIN
		// ARTICLE CONTENT

		// Create block of text from website new article content
		var text = nlp(domTreeWalker.currentNode.textContent);

		// Identify names in text nodes
		var people = text.people();
		// Normalize punctuation, case, whitespace
		people = people.normalize();
		// Remove any possessives
		people = people.not('#Possessive');
		// Change to title title script
		people = people.toTitleCase();
		// Format as an array
		peoples = people.out('array');

		// Push found names into cumulative array
		for (i = 0; i < peoples.length; i++) {
			name = peoples[i];
			len = name.split(' ').length;
			if(len > 1 && len < 4)
				names.push(name);
		}
	}

	// Sort by frequency and eliminate filter names
	names = sortFreqUnique(names);

	// Print out retrieved names to console
	// console.log(names);
	return names;
}

// Send names as message to background script
chrome.runtime.sendMessage({names: findNames()});

