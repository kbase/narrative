define([], () => {
    'use strict';

    /*
     * A clipboard button for copying data from select boxes.
     */
    function clipboardButton(div, button, events, ui, node) {
        return div(
            {
                class: 'input-group-addon kb-app-row-clip-btn-addon',
            },
            button(
                {
                    class: 'btn btn-xs kb-app-row-clip-btn',
                    type: 'button',
                    id: events.addEvent({
                        type: 'click',
                        handler: async function () {
                            const text = node.querySelectorAll('[role=textbox]')[0].innerText;
                            await navigator.clipboard.writeText(text);
                        },
                    }),
                },
                ui.buildIcon({
                    name: 'clipboard',
                })
            )
        );
    }

    function containerContent(div, button, events, ui, container, input) {
        const clipboard = clipboardButton(div, button, events, ui, container);
        const content = div(
            {
                dataElement: 'input-row',
                class: 'kb-input-row-flex',
            },
            [
                div(
                    {
                        class: 'input-group kb-input-group-wide',
                    },
                    input
                ),
                clipboard,
            ]
        );
        return content;
    }

    return {
        clipboardButton: clipboardButton,
        containerContent: containerContent,
    };
});
