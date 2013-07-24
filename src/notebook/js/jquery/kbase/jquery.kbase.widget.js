/*


*/


(function( $, undefined ) {


    $.widget("kbase.widget", {
        version: "1.0.0",

        id : function() {
            return this.options.id;
        },

        data : function (key, val) {
            if (this.options._storage == undefined) {
                this.options._storage = {};
            }

            if (arguments.length == 2) {
                this.options._storage[key] = val;
            }

            if (key != undefined) {
                return this.options._storage[key];
            }
            else {
                return this.options._storage;
            }
        },

        _rewireIds : function($elem, $target) {

            if ($target == undefined) {
                $target = $elem;
            }

            if ($elem.attr('id')) {
                $target.data($elem.attr('id'), $elem);
                $elem.removeAttr('id');
            }

            $.each(
                $elem.find('[id]'),
                function(idx) {
                    $target.data($(this).attr('id'), $(this));
                    $(this).removeAttr('id');
                    }
            );

            return $elem;
        },


    });

}( jQuery ) );
