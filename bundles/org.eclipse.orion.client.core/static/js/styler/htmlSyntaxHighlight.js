/******************************************************************************* 
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation 
 ******************************************************************************/

/*jslint */
/*global dojo orion:true*/

var orion = orion || {};

orion.syntax = orion.syntax || {};

/**
 * Uses a grammar to provide some very rough syntax highlighting for HTML.<p>
 * @class orion.syntax.HtmlSyntaxHighlight
 */
orion.syntax.HtmlSyntaxHighlight = (function() {
	var _fileTypes = [ "html", "htm" ];
	return {
		/**
		 * What kind of highlight provider we are.
		 * @public
		 * @type "grammar"|"parser"
		 */
		type: "grammar",
		
		/**
		 * The file extensions that we provide rules for.
		 * @public
		 * @type String[]
		 */
		fileTypes: _fileTypes,
		
		/**
		 * Object containing the grammar rules.
		 * @public
		 * @type JSONObject
		 */
		grammar: {
			"comment": "HTML syntax rules",
			"name": "HTML",
			"fileTypes": _fileTypes,
			"scopeName": "source.html",
			"uuid": "3B5C76FB-EBB5-D930-F40C-047D082CE99B",
			"patterns": [
				// TODO unicode?
				{
					"match": "<!(doctype|DOCTYPE)[^>]+>",
					"name": "entity.name.tag.doctype.html"
				},
				{ // startDelimiter + tagName
					"match": "<[A-Za-z0-9_\\-:]+(?= ?)",
					"name": "entity.name.tag.html"
				},
				{
					"match": "<!--|-->",
					"name": "punctuation.definition.comment.html"
				},
				{ "include": "#attrName" },
				{ "include": "#qString" },
				{ "include": "#qqString" },
				// TODO attrName, qString, qqString should be applied first while inside a tag
				{ // startDelimiter + slash + tagName + endDelimiter
					"match": "</[A-Za-z0-9_\\-:]+>",
					"name": "entity.name.tag.html"
				},
				{ // end delimiter of open tag
					"match": ">", 
					"name": "entity.name.tag.html"
				} ],
			"repository": {
				"attrName": { // attribute name
					"match": "[A-Za-z\\-:]+(?=\\s*=\\s*['\"])",
					"name": "entity.other.attribute.name.html"
				},
				"qqString": { // double quoted string
					"match": "(\")[^\"]+(\")",
					"name": "string.quoted.double.html"
				},
				"qString": { // single quoted string
					"match": "(')[^']+(\')",
					"name": "string.quoted.single.html"
				}
			}
		}
	};
}());