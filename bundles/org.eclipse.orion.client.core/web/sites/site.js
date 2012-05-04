/*******************************************************************************
 * @license
 * Copyright (c) 2011 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global confirm define dojo dijit orion window*/
/*jslint browser:true*/

/*
 * Glue code for site.html
 */
define(['dojo', 'orion/bootstrap', 'orion/status', 'orion/progress', 'orion/commands', 
	'orion/fileClient', 'orion/operationsClient', 'orion/searchClient', 'orion/dialogs', 'orion/globalCommands', 'orion/util', 'orion/sites/siteClient', 'orion/sites/siteCommands', 'orion/PageUtil',
	'dojo/parser', 'dojo/hash', 'dijit/layout/BorderContainer', 'dijit/layout/ContentPane', 'orion/widgets/SiteEditor'], 
	function(dojo, mBootstrap, mStatus, mProgress, mCommands, mFileClient, mOperationsClient, mSearchClient, mDialogs, mGlobalCommands, mUtil, mSiteClient, mSiteCommands, PageUtil) {

	dojo.addOnLoad(function() {
		mBootstrap.startup().then(function(core) {
			var serviceRegistry = core.serviceRegistry;
			var preferences = core.preferences;
			document.body.style.visibility = "visible";
			dojo.parser.parse();
			
			var dialogService = new mDialogs.DialogService(serviceRegistry);
			var operationsClient = new mOperationsClient.OperationsClient(serviceRegistry);
			var statusService = new mStatus.StatusReportingService(serviceRegistry, operationsClient, "statusPane", "notifications", "notificationArea");
			var progressService = new mProgress.ProgressService(serviceRegistry, operationsClient);
			var commandService = new mCommands.CommandService({serviceRegistry: serviceRegistry});
		
			var siteLocation = PageUtil.matchResourceParameters().resource;
			var siteClient = mSiteClient.forLocation(serviceRegistry, siteLocation);
			var fileClient = siteClient._getFileClient();
			var searcher = new mSearchClient.Searcher({serviceRegistry: serviceRegistry, commandService: commandService, fileService: fileClient});
			mGlobalCommands.generateBanner("banner", serviceRegistry, commandService, preferences, searcher);

			var updateTitle = function() {
				var editor = dijit.byId("site-editor");
				var site = editor && editor.getSiteConfiguration();
				if (editor && site) {
					var location = dojo.byId("location");
					dojo.place(document.createTextNode(site.Name), location, "only");
					document.title = site.Name + (editor.isDirty() ? "* " : "") + " - Edit Site";
					mUtil.forceLayout(location);
				}
			};
			
			var onHashChange = function() {
				var params = PageUtil.matchResourceParameters();
				var resource = params.resource;
				var editor = dijit.byId("site-editor");
				if (resource && resource !== editor.getResource()) {
					var doit = !editor.isDirty() || confirm("There are unsaved changes. Do you still want to navigate away?");
					if (doit) {
						editor.load(resource).then(
							function() {
								updateTitle();
							});
					}
				}
			};
			dojo.subscribe("/dojo/hashchange", null, onHashChange);
			
			// Initialize the widget
			var widget;
			(function() {
				widget = new orion.widgets.SiteEditor({
					serviceRegistry: serviceRegistry,
					fileClient: fileClient,
					siteClient: siteClient,
					commandService: commandService,
					statusService: statusService,
					progressService: progressService,
					commandsContainer: dojo.byId("pageActions"),
					id: "site-editor"});
				dojo.place(widget.domNode, dojo.byId("site"), "only");
				widget.startup();
				
				dojo.connect(widget, "onSuccess", updateTitle);
				dojo.connect(widget, "setDirty", updateTitle);
				
				onHashChange();
			}());
			
			window.onbeforeunload = function() {
				if (widget.isDirty()) {
					return "There are unsaved changes.";
				}
			};

			mSiteCommands.createSiteCommands(serviceRegistry);
			commandService.registerCommandContribution("pageActions", "orion.site.start", 1);
			commandService.registerCommandContribution("pageActions", "orion.site.stop", 2);
			commandService.registerCommandContribution("pageActions", "orion.site.convert", 3);
			commandService.registerCommandContribution("pageActions", "orion.site.save", 4);
		});
	});
});