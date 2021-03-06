/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 ******************************************************************************/
/*eslint-env amd, mocha*/
define([
	'webtools/cssQuickFixes',
	'webtools/cssValidator',
	'webtools/cssResultManager',
	'chai/chai',
	'orion/Deferred',
	'mocha/mocha', //must stay at the end, not a module
], function(CssQuickFixes, CssValidator, ResultMgr, chai, Deferred) {
	var assert = chai.assert;

	describe('CSS Quick Fix Tests', function() {
		
		var validator;
		var resultMgr;
		var contentsChanged;
		
		beforeEach(function(){
			contentsChanged = false;
		});
		
		afterEach(function(){
			// Reset the rule severities to defaults
			if (validator){
				validator._restoreRules();
			}
			if(resultMgr) {
			    resultMgr.onModelChanging({file:{}});
			}
		});
		
		
		/**
		 * @description Sets up the test
		 * @param {Object} options {buffer, contentType}
		 * @returns {Object} The object with the initialized values
		 */
		function setup(options) {
		    var buffer = options.buffer;
		    var contentType = options.contentType ? options.contentType : 'text/css';
		    resultMgr = new ResultMgr.CssResultManager();
			validator = new CssValidator(resultMgr);
			var rule = options.rule;
			validator._enableOnly(rule.id, rule.severity);
			var fixComputer = new CssQuickFixes.CssQuickFixes();
			var editorContext = {
				/*override*/
				getText: function() {
					return new Deferred().resolve(buffer);
				},
				
				setText: function(text, start, end) {
					contentsChanged = true;
				    assertFixes(text, start, end, options.expected);
				}
			};
			return {
			    validator: validator,
				fixComputer: fixComputer,
				editorContext: editorContext,
				contentType: contentType
			};
		}
	
	    /**
    	 * @description Runs the validator on the given options and computes fixes for those problems
    	 * @param {Object} options {buffer, contentType, rule}
    	 * @returns {orion.Promise} The validation promise
    	 */
    	function getFixes(options) {
            var obj = setup(options);
            return obj.validator.computeProblems(obj.editorContext, {contentType: obj.contentType, rule: options.rule}).then(function(problems) {
                var pbs = problems.problems;
                var annot = pbs[0];
                if(options.pid) {
                    for(var i = 0; i < pbs.length; i++) {
                        if(pbs[i].id === options.pid) {
                            annot = pbs[i];
                            break;
                        }
                    }
                    assert(i !== pbs.length, "Did not find any problems for the expcted id: "+ options.pid);
                } else {
                    assert(pbs, "There should always be problems");
                    assert.equal(pbs.length, 1, 'There should only be one problem per test');
                }
                annot.title = annot.description;
                
            	// Problem has start/end ranges with a line number, Annotation uses a start/end offset of the entire text buffer. Translate these values to allow tests with more than one line
                if (pbs[0].line){
                	annot.start--;
                	annot.end--;
                	if (pbs[0].line > 1){
	                	obj.editorContext.getText().then(function(text){
		                	var line = pbs[0].line;
		                	var offset = 0;
		                	while (line > 1){
								offset = text.indexOf('\n', offset);
								line--;
		                	}
		                	if (offset >= 0){
		                		annot.start += offset;
		                		annot.end += offset;
		                	}
	                	});
                	}
                }
                return obj.fixComputer.execute(obj.editorContext, {annotation: annot}).then(function(){
                	assert(contentsChanged, "No fixes were executed");
                });
            });
	    }
	
	    /**
    	 * @description Compares the computed fixes set against the expected ones
    	 * @param {Array.<orion.Fix>} computed The computed set of fixes
    	 * @param {Array.<Object>} expected The expected set of fixes
    	 */
    	function assertFixes(computed, start, end, expected) {
	        assert(computed !== null && typeof computed !== 'undefined', 'There should be fixes');
    	    assert(computed.indexOf(expected.value) > -1, 'The fix: '+computed+' does not match the expected fix of: '+expected.value);
    	    assert.equal(start, expected.start, 'The fix location {' + start + ',' + end + '} does not match the expected position {'+ expected.start + ',' + expected.end + '}');
    	    assert.equal(end, expected.end, 'The fix location {' + start + ',' + end + '} does not match the expected position {'+ expected.start + ',' + expected.end + '}');
	    }
	
	    /**
    	 * @description Creates a test rule object for the test set up
    	 * @param {String} id The id of the rule used to update the preferences in webtools/cssValidator#updated
    	 * @param {Number} severity The severity of the problem or null (which defaults to '2')
    	 * @returns {Object} Returns a new rule object for testing with
    	 */
    	function createTestRule(id, severity) {
	        var rule = Object.create(null);
	        rule.id = id;
	        rule.severity = severity ? severity : 2;
	        return rule;
	    }
	
		it("Test empty-rules - single line", function() {
		    var rule = createTestRule('empty-rules');
		    var expected = {value: "",
		                    start: 0, 
		                    end: 7};
		    return getFixes({buffer: 'rule {}', 
		                      rule: rule,
		                      expected: expected});
		});
		
		it("Test empty-rules - multi line", function() {
		    var rule = createTestRule('empty-rules');
		    var expected = {value: "",
		                    start: 0, 
		                    end: 9};
		    return getFixes({buffer: 'rule {\n}\n', 
		                      rule: rule,
		                      expected: expected});
		});
		
		it("Test empty-rules - leading trailing whitespace", function() {
		    var rule = createTestRule('empty-rules');
		    var expected = {value: "",
		                    start: 0, 
		                    end: 14};
		    return getFixes({buffer: '\t rule {\t\n}   \t\n', 
		                      rule: rule,
		                      expected: expected});
		});
		
		it("Test empty-rules - multiple identifiers", function() {
		    var rule = createTestRule('empty-rules');
		    var expected = {value: "",
		                    start: 0, 
		                    end: 21};
		    return getFixes({buffer: '\truleA ruleB ruleC {}\n', 
		                      rule: rule,
		                      expected: expected});
		});
		
		it("Test important - single line", function() {
		    var rule = createTestRule('important');
		    var expected = {value: "",
		                    start: 19, 
		                    end: 30};
		    return getFixes({buffer: 'rule { border : 0px !important;}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test important - uppercase", function() {
		    var rule = createTestRule('important');
		    var expected = {value: "",
		                    start: 19, 
		                    end: 30};
		    return getFixes({buffer: 'rule { border : 0px !IMPORTANT;}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test important - missing semi", function() {
		    var rule = createTestRule('important');
		    var expected = {value: "",
		                    start: 19, 
		                    end: 30};
		    return getFixes({buffer: 'rule { border : 0px !important}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test important - multi line", function() {
			// Used to test that getFixes() can properly translate a line/col problem to an offset annotation
		    var rule = createTestRule('important');
		    var expected = {value: "",
		                    start: 20, 
		                    end: 31};
		    return getFixes({buffer: 'rule {\n border : 0px\n!important;\n}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test important - trailing spaces", function() {
		    var rule = createTestRule('important');
		    var expected = {value: "",
		                    start: 20, 
		                    end: 40};
		    return getFixes({buffer: 'rule {\n border : 0px !important       \t\n;\n}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test important - preceding spaces", function() {
		    var rule = createTestRule('important');
		    var expected = {value: "",
		                    start: 20, 
		                    end: 40};
		    return getFixes({buffer: 'rule {\n border : 0px        \n\t!important;\n}', 
		                      rule: rule,
		                      expected: expected});
		});
		
		it("Test zero-units - single line", function() {
		    var rule = createTestRule('zero-units');
		    var expected = {value: "0",
		                    start: 16, 
		                    end: 19};
		    return getFixes({buffer: 'rule { border : 0px;}', 
		                      rule: rule,
		                      expected: expected});
		});
		it("Test zero-units - multi line", function() {
			// Used to test that getFixes() can properly translate a line/col problem to an offset annotation
		    var rule = createTestRule('zero-units');
		    var expected = {value: "0",
		                    start: 16, 
		                    end: 19};
		    return getFixes({buffer: 'rule {\n border : 0px;\n}', 
		                      rule: rule,
		                      expected: expected});
		});
		
	});
		
});
