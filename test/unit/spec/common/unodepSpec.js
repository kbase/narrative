/*global define*/ // eslint-disable-line no-redeclare
/*global describe, expect, it*/
/*jslint white: true*/

define([
    'common/events',
    'common/ui',
    'common/unodep',
    'kb_common/html',
], (
    Events,
    UI,
    Unodep,
    html
) => {
    'use strict';
    const div = html.tag('div');
    const button = html.tag('button');
    const container = document.createElement('div');
    const events = Events.make({ node: container });
    const ui = UI.make({ node: container });
    const control = { node: container, index: 0 };
    describe('Test Unodep module', () => {
        it('Should be loaded with the right functions', () => {
            expect(Unodep).toBeDefined();
            expect(Unodep.clipboardButton).toBeDefined();
            expect(Unodep.formatElapsedTime).toBeDefined();
            expect(Unodep.formatTime).toBeDefined();
            expect(Unodep.isEqual).toBeDefined();
        });

        it('Should use the clipboard icon', () => {
            const clipboardButton = Unodep.clipboardButton(
                div, button, events, ui, control
            );
            container.innerHTML = clipboardButton;
            expect(container
                .querySelectorAll('[data-element=icon]')[0]
                .classList.contains('fa-clipboard')
            ).toBeTrue();
        });
    });
});
