(function ( $ ) {

	$.fn.kbaseTreeView = function( data, opt ) {
		var options = {
			tabSize : 20,		// how deep the padding should be on each tree depth
			depth : 0,			// initial tree depth - affects the padding
			maxShown : 10,		// maximum subtrees displayed
			expandSpeed : 400   // ms
		};

		for (var attr in opt) {
			options[attr] = opt[attr];
		}

		/* Assumes that everything should be done in order.
		 * So, 'data' is a data object with a series of properties.
		 * Each property should be a top-level container.
		 * Each lower level container is a list.
		 * If the list element is a string, it is a bottom level type.
		 * If it is an object, each of its properties are a container, and so on.
		 * 
		 * E.g.
		 * {
		 *   'container1' : ['file', 
		 *					 'file2',
		 *					 'file3'],
		 *   'container2' : ['file4', 
		 *						{
		 *							'lower_container': ['file5', 'file6'],
		 *						},
		 *					 'file7']
		 * }
		 *
		 * Also, all top-level containers are displayed, but only a few of
		 * the inner-containers of each level are shown.
		 * 
		 * The [show more] button should do something. I'm not sure what.
		 *
		 * As such, it's natural that this should be built recursively... right?
		 */

		for (var topName in data) {
			// add a div with a closed arrow as the first element, some space, then the name as a link.
			// add a click event that should toggle what's under that div.

			if (data.hasOwnProperty(topName)) {
				this.append(
					makeTree(topName, data[topName], options)
				);
			}
		}

		return this;
	};

	var makeTree = function(name, data, options) {
		/* Trees have a header and a body.
		 * The header is the name parameter (as given)
		 * The body is the list of strings in data, except for those that are also objects
		 * those, in turn, become trees in their own right
		 * The body (and all sub-bodies) is initialized as hidden.
		 *
		 * Structure:
		 * <div (whole tree)>
		 * 	<div (header) />
		 * 	<div (body)>
		 * 		<div (top ten)>
		 * 			<div elem 1/>
		 * 			<div elem 2/>
		 * 			...
		 * 		</div>
		 * 		<div (show all clicky) />
		 * 		<div (remaining)>
		 * 			<div elem 11/>
		 * 			<div elem 12/>
		 * 			...
		 * 			<div (hide) />
		 * 		</div>
		 * 	</div>
		 * </div>
		 */

		// holds the whole tree
		var $treeDiv = $("<div></div>");

		// The header is the expandable part of the tree.
		var $treeHeader = $("<div></div>")
							.append(
								$("<i></i>")
								.attr("class", "icon-caret-right")
							)
							.append(
								$("<span></span>")
								.html(name)
								.attr("class", "tree-header-text")
							)
							.css("padding-left", (options.depth * options.tabSize) + "px")
							.click([$treeDiv, options.expandSpeed], toggleTree);

		// The body holds all subtrees and plain string fields. It's separated into two sections
		// 1. $treeBodyShow = the region that is always shown upon tree toggling.
		// 2. $treeBodyExtra = the region of the tree that overflows the number of fields in $treeBodyShow
		var $treeBody;
		if (data.length > 0) {
			$treeBody = $("<div></div>")
						.css("padding-left", ((options.depth+1) * options.tabSize) + "px");

			var limit = Math.min(data.length, options.maxShown);

			// build a 'subtree' for the first chunk.
			$treeBodyShow = buildSubTree(data.slice(0, limit), options);
			$treeBody.append($treeBodyShow);

			// if there are more data than that first chunk, build another subtree out of the rest.
			if (limit < data.length) {
				var $treeBodyExtra = buildSubTree(data.slice(limit, data.length), options);

				// Add a toggle button between the first subtree and the extension.
				// So that a user sees the first few rows, then can toggle to see the remaining.
				var $showAllButton = $("<div></div>")
									 .html("[ <span class=\"tree-button-text\">show all</span> ]");
				$showAllButton.click([$treeBodyExtra, $showAllButton, options.expandSpeed], toggleTreeExtension);

				// At the bottom of the subtree extension, place an un-toggle button that will hide it.
				$treeBodyExtra.append(
										$("<div></div>")
									 	.html("[ <span class=\"tree-button-text\">collapse</span> ]")
									 	.click([$treeBodyExtra, $showAllButton, options.expandSpeed], toggleTreeExtension)
									 );
				$treeBodyExtra.hide();

				$treeBody.append($showAllButton)
						 .append($treeBodyExtra);
			}

			$treeBody.hide();
		}

		$treeDiv.append($treeHeader);
		$treeDiv.append($treeBody);
		$treeDiv.attr("class", "tree-closed");

		return $treeDiv;
	};

	/* Constructs a subtree.
	 * This iterates through the data Array. If it sees a string, it just inserts it into the tree,
	 * but if it sees an object, it inserts a new tree made from that object by recursively calling
	 * makeTree.
	 */
	var buildSubTree = function(data, options) {
		var $subTree = $("<div></div>");

		for (var i = 0; i < data.length; i++) {
			var d = data[i];

			// If it's a string, insert it.
			if (typeof d === "string") {
				$subTree.append(
								$("<div></div>")
								.html(d)
							   );
			}

			// Otherwise, we need a new tree.
			else {
				for (var subName in data[i]) {
					$subTree.append(makeTree(subName, data[i][subName], options));
				}
			}
		}
		return $subTree;
	};

	/* Toggles the tree extension view.
	 * When the [ show all ] button is clicked, it gets hidden, and the extension of the tree is shown.
	 * This works as a toggle state - the first two elements in event.data are toggled, whatever they are.
	 */
	var toggleTreeExtension = function(event) {
		var $extension = event.data[0];
		var $button = event.data[1];
		var expandSpeed = event.data[2];

		$extension.toggle(expandSpeed);
		$button.toggle();
	};

	/* Toggles the tree view.
	 * When a header is clicked on, the triangle icon is twiddled, and the tree view is shown or hidden.
	 */
	var toggleTree = function(event) {
		var $tree = event.data[0];
		var expandSpeed = event.data[1];

		$tree.toggleClass("tree-closed");
		$tree.toggleClass("tree-open");

		var $header = $tree.find(">:first-child");
		$header.find(">:first-child")
			   .toggleClass("icon-caret-right")
			   .toggleClass("icon-caret-down");

		$tree.find(">:nth-child(2)").toggle(expandSpeed);
	};

}( jQuery ));