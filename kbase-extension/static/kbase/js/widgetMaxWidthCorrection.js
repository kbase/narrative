var components = {};
var notebookContainer = null;

var prevNotebookContainerW = null;

function getNotebookContainerWidth() {
	if (!notebookContainer) {
		notebookContainer = $('#notebook-container');
		prevNotebookContainerW = notebookContainer.width();
	}
	return notebookContainer.width();
}

function updateMaxWidth(componentId, w) {
	jqueryComponent = components[componentId];
	if (!jqueryComponent.closest('html'))
		return;
	jqueryComponent.css({'max-width': (w - 50) + 'px'});
	//console.log("widgetMaxWidthCorrection: max-width changed into " + (w - 50) + " (componentId=" + 
	//	componentId + ", parentNode=" + jqueryComponent.closest('html') + ")");
}

var windowResizeListener = function() {
	var newW = notebookContainer.width();
	if (prevNotebookContainerW != newW) {
		prevNotebookContainerW = newW;
		for (var componentId in components)
			updateMaxWidth(componentId, newW);
	}
}

function watchForWidgetMaxWidthCorrection(componentId) {
	if (!notebookContainer) {
		getNotebookContainerWidth();
		if (!notebookContainer) {
			console.log("widgetMaxWidthCorrection: notebookContainer is not defined for some reason...");
		} else {
			$(window).resize(windowResizeListener);
		}
	}
	components[componentId] = $('#'+componentId);
	updateMaxWidth(componentId, prevNotebookContainerW);
}