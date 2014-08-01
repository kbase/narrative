/**
 * A directive to fix a known issue with AngularJS:
 * https://github.com/angular/angular.js/issues/1460
 *
 * Workaround largely taken from:
 * http://stackoverflow.com/questions/14965968/angularjs-browser-autofill-workaround-by-using-a-directive/19854565#19854565
 *
 * @author Bill Riehl wjriehl@lbl.gov
 */
app.directive('autofillFix', function() {
        return function($scope, $elem, $attrs) {
            // Fixes a Chrome bug
            $elem.prop('method', 'POST');

            // Fix autofill issues where Angular doesn't know that autofilled inputs are present.
            if ($attrs.ngSubmit) {
                setTimeout(function() {
                    $elem.unbind('submit').submit(function(e) {
                        e.preventDefault();
                        $elem.find('input').trigger('input').trigger('change').trigger('keydown');
                        $scope.$apply($attrs.ngSubmit);
                    });
                }, 0);
            }
        };
    });