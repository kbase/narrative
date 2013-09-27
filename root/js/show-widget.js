/*
 * Uses angular.js
 */
function WidgetCtrl($scope) {
    $scope.widgets = Object.keys($.KBWidget.registry());
}