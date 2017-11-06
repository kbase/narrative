define([
], function() {
    'use strict';

    var UpaApi = function(mainWorkspace) {
        var externalTag = '&',
            mainWs = String(mainWorkspace);

        /**
         * Runs a regex that tests the given string to see if it's a valid upa.
         * valid upas are of the form:
         * ws/obj/ver or ws1/obj1/ver1;ws2/obj2/ver2;...
         */
        var isUpa = function(upa) {
            return RegExp(/^\d+(\/\d+){2}(;\d+(\/\d+){2})*$/).test(upa);
        };

        /**
         * @method
         * @public
         * Serializes an UPA - prepares it for storage as a part of Narrative cell metadata.
         * This means a bit of a tweak to the UPA itself. Currently, we want to store it in a way
         * that designates it as a serialized string, and gives an easy path to substitute the
         * initial workspace part of the UPA with a different workspace.
         * So it gets transformed from:
         * ws1/obj1/ver1;ws2/obj2/ver2;...
         * to
         * [ws1]/obj1/ver1;ws2/obj2/ver2;...
         *
         * In the case of UPAs representing objects that are located in a different workspace all
         * together (e.g. set items that aren't copied into the Narrative with the set container
         * object), they get flagged with a special character. In that case, the UPA is maintained,
         * but transformed into:
         * &ws1/obj1/ver1;ws2/obj2/ver2;...
         */
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
            if (!isUpa(upa)) {
                throw new Error('This is not a valid UPA. It may already have been serialized');
            }
            var headWs = upa.match(/^\d+/)[0];
            if (headWs === mainWorkspace) {
                return upa.replace(/^(\d+)/, '[$1]');
            }
            else {
                return externalTag + upa;
            }
        };

        /**
         * @public
         * @method
         * serial upa = either [ws]/obj/ver;ws/obj/ver; ... or &ws/obj/ver;ws/obj/ver
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
                deserial = serial.replace(/^\[\d+\]/, mainWs);
            }
            if (!isUpa(deserial)) {
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
