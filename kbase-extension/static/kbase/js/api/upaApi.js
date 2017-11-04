define([
], function() {
    'use strict';

    var UpaApi = function(mainWorkspace) {
        var externalTag = '&',
            mainWs = String(mainWorkspace),
            wsLen = mainWs.length;

        /**
         * Runs a regex that tests the given string to see if it's a valid upa.
         * valid upas are of the form:
         * ws/obj/ver or ws1/obj1/ver1;ws2/obj2/ver2;...
         */
        var testUpa = function(upa) {
            return RegExp(/^\d+\/\d+\/\d+(;\d+\/\d+\/\d+)*$/).test(upa);
        };

        var serialize = function(upa) {
            if (typeof upa !== 'string') {
                // stringify the array version of an UPA, if that's what we have.
                if (Array.isArray(upa)) {
                    upa = upa.join(';');
                }
                else {
                    throw new Error('Can only serialize UPA strings or Arrays of UPA paths');
                }
            }
            if (!testUpa(upa)) {
                throw new Error('This is not a valid UPA. It may already have been serialized');
            }
            var headWs = upa.match(/^\d+/)[0];
            if (headWs === mainWorkspace) {
                return upa.substring(wsLen + 1);
            }
            else {
                return externalTag + upa;
            }
        };

        /**
         * @public
         * @method
         * serial upa = either obj/ver;ws/obj/ver; ... or &ws/obj/ver;ws/obj/ver
         * deserialize either adds the current ws to the front, or snips the tag from the front.
         */
        var deserialize = function(serial) {
            if (typeof serial !== 'string') {
                throw new Error('Can only deserialize UPAs from strings.');
            }
            var deserial;
            if (serial[0] === externalTag) {
                deserial = serial.substring(1);
            } else {
                deserial = mainWs + '/' + serial;
            }
            if (!testUpa(deserial)) {
                throw new Error('deserialized UPA: ' + deserial + ' is invalid!');
            }
            return deserial;
        };


        return {
            serialize: serialize,
            deserialize: deserialize,
            externalTag: externalTag
        };
    };

    return UpaApi;

});
