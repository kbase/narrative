/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'kbaseCellToolbarMenu'
], function(Widget) {
    'use strict';
    describe('Test the kbaseCellToolbarMenu widget', function() {
        const mockParentCell = (message, collapsedState) => {
            const messageContainer = document.createElement('div');
            const execMessage = document.createElement('div');
            execMessage.setAttribute('data-element', 'execMessage');
            execMessage.innerHTML = message;
            messageContainer.appendChild(execMessage);
            return {
                element: [messageContainer],
                metadata: {
                    kbase: {
                        cellState: {
                            toggleMinMax: collapsedState
                        },
                        type: 'app'
                    }
                }
            };
        };
        const message = 'When in the course of human events...';

        it('Should do things', function() {
        });

        it('Should show the status message when collapsed', function() {
            const instance = Widget.make();
            const parentCell = mockParentCell(message, 'minimized');
            const toolbarDiv = document.createElement('div');
            instance.register_callback([toolbarDiv], parentCell);
            expect(
                toolbarDiv.querySelectorAll(
                    'div.title div:nth-child(3)'
                )[0].innerHTML
            ).toBe(message);
        });

        it('Should suppress the status message if not collapsed', function() {
            const instance = Widget.make();
            const parentCell = mockParentCell(message, 'maximized');
            const toolbarDiv = document.createElement('div');
            instance.register_callback([toolbarDiv], parentCell);
            expect(
                toolbarDiv.querySelectorAll(
                    'div.title div:nth-child(3)'
                )[0].innerHTML
            ).toBe('');
        });
    });
});
