/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html',
    'common/events',
    'common/ui'
], function (
    html,
    Events,
    UI
    ) {
    'use strict';
    
    var t = html.tag,
        div = t('div'), span = t('span'), button = t('button'),
        ui = UI.make({node: document.body});
        
    function showMessageDialog(id) {
        ui.showInfoDialog({
            title: 'MESSAGE TITLE',
            body: 'Message id: ' + id
        });
    }
        

    function buildMessageAlert(messageDef) {
        var events = Events.make({node: document.body}),
            content = div({
                class: 'alert alert-' + messageDef.type,
                role: 'alert'
            }, [
                span({style: {fontWeight: 'bold'}}, messageDef.title),
                ': ',
                messageDef.message,
                ' ',
                button({
                    type: 'button',
                    class: 'btn btn-link alert-link',
                    id: events.addEvent({
                        type: 'click',
                        handler: function () {
                            showMessageDialog(messageDef.id);
                        }
                    })
                }, ui.buildIcon({name: 'info-circle'}))
            ]);
        return {
            events: events,
            content: content
        };
    }

//    function buildErrorMessage(error) {
//        var component = buildInputMessage({
//            title: 'ERROR',
//            type: 'danger',
//            message: error.message,
//            id: error.mesageId
//        });
//        places.$messagePanel
//            .removeClass('hidden');
//        places.$message
//            .html(component.content)
//            .addClass('-error');
//        component.events.attachEvents(document.body);
//    }
//
//    function setWarning(warning) {
//        var component = buildInputMessage({
//            title: 'Warning',
//            type: 'warning',
//            message: warning.message,
//            id: warning.message
//        });
//        places.$messagePanel
//            .removeClass('hidden');
//        places.$message
//            .html(component.content)
//            .addClass('-warning');
//        component.events.attachEvents(document.body);
//    }

    return {
        buildMessageAlert: buildMessageAlert
    };
});