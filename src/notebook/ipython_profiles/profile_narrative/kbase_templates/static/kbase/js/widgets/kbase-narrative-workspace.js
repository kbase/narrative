/**
 * Options:
 *
 * tabs - 
 * loadingImage - an image to show in the middle of the widget while loading data
 */

(function( $, undefined ) {
	$.KBWidget("kbaseNarrativeWorkspace", 'kbaseWidget', {
		version: "1.0.0",
		$buttonList: null,
		$viewPort: null,
		viewPortTabs: {},
		currentTab: null,
		workspaceWidgets: [],

		options: {
			tabs: [
				{ 
					//name: "Narrative",
					name: "MrPibbs",
					workspace: "workspace1"
				},
				{
					name: "Workspace",
					workspace: "workspace2"
				},
				{
					name: "Project",
					workspace: "workspace3"
				}
			],

			loadingImage: ""
		},

		init: function(options) {
			this._super(options);

			this.$buttonList = $("<ul class='kbnws-tabs'/>");
			$header = $("<div class='kbnws-header'/>").append(this.$buttonList);
			this.$elem.append($header);

			this.$viewPort = $("<div class='kbnws-viewport'/>");
			this.$elem.append(this.$viewPort);

			for (var i=0; i<this.options.tabs.length; i++) {
				this.addTab(this.options.tabs[i]);
			}

			this.changeTabs(this.options.tabs[0].name);
			return this;
		},

		addTab: function(tabInfo) {
			// add a button to the header
			// add a div to the viewport
			// tie the button to the div with a clicky event
			// make a new kbaseMiniWorkspace widget on the viewport

			var $newButton = $("<li/>")
							 .append(tabInfo.name)
							 .attr("id", tabInfo['name'] + "-btn");
			this.$buttonList.append($newButton);

			var $newView = $("<div/>")
						   .attr("id", tabInfo['name'] + "-view")
						   .addClass("kbnws-hidden")
			this.$viewPort.append($newView);
			this.workspaceWidgets.push(
				$newView.kbaseMiniWorkspace(
					{ 
						'workspaceName': tabInfo.workspace,
						'loadingImage': this.options.loadingImage 
					}
				)
			);

			this.viewPortTabs[tabInfo.name] = {
				button: $newButton,
				view: $newView
			};
			// this.viewPortTabs[tabInfo.name].view = $newView;

			var browser = this;
			$newButton.on("click", function(event) {
				browser.changeTabs(tabInfo.name);
			});
		},

		changeTabs: function(name) {
			if (this.currentTab != name) {
				if (this.currentTab != null) {
					this.viewPortTabs[this.currentTab].view.addClass("kbnws-hidden");
					this.viewPortTabs[this.currentTab].button.removeClass("kbnws-selected");
				}
				this.viewPortTabs[name].view.removeClass("kbnws-hidden");
				this.viewPortTabs[name].button.addClass("kbnws-selected");
				this.currentTab = name;
			}
		},

		render: function() {
			return this;
		},

		loggedIn: function(args) {
			for (var i=0; i<this.workspaceWidgets.length; i++)
				this.workspaceWidgets[i].loggedIn(args);
		},

		loggedOut: function(args) {
			for (var i=0; i<this.workspaceWidgets.length; i++)
				this.workspaceWidgets[i].loggedOut(args);
		}
	});

})( jQuery );