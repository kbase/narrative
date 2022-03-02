define(['common/html', 'common/events', 'common/ui'], (html, Events, UI) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        b = t('b'),
        button = t('button'),
        ui = UI.make({ node: document.body });

    function showMessageDialog(title, id) {
        ui.showInfoDialog({
            title,
            body: 'Message id: ' + id,
        });
    }

    function buildMessageAlert(messageDef) {
        const events = Events.make(),
            content = div(
                {
                    class: 'alert alert-' + messageDef.type,
                    role: 'alert',
                },
                [
                    b(messageDef.title),
                    `: ${messageDef.message} `,
                    button(
                        {
                            type: 'button',
                            class: 'btn btn-link alert-link',
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    showMessageDialog(messageDef.title || 'Error', messageDef.id);
                                },
                            }),
                        },
                        ui.buildIcon({ name: 'info-circle' })
                    ),
                ]
            );
        return {
            events,
            content,
        };
    }

    /**
     * Creates a little input group addon div to show that the input should be greater than or
     * equal to some value. Value is expected to be either a number or string, but this isn't
     * strictly enforced. It'll be cast as a string either way.
     * @param {Number} value the number to represent as a boundary
     * @param {Boolean} isMin if true, then render as "value <=", else render as "<= value"
     * @returns {String} an HTML div element.
     */
    function numericalBoundaryDiv(value, isMin) {
        value = String(value);
        const text = isMin ? `${value} &#8804; ` : ` &#8804; ${value}`;
        return div(
            {
                class: 'input-group-addon kb-input-group-addon',
            },
            text
        );
    }

    return {
        buildMessageAlert,
        numericalBoundaryDiv,
    };
});
