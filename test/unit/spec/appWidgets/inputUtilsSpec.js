define(['widgets/appWidgets2/inputUtils', 'testUtil'], (InputUtils, TestUtil) => {
    'use strict';

    describe('input utils tests', () => {
        it('has expected functions', () => {
            expect(InputUtils).toEqual(jasmine.any(Object));
            ['numericalBoundaryDiv', 'buildMessageAlert'].forEach((fn) => {
                expect(InputUtils[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('buildMessageAlert tests', () => {
            const msg = {
                type: 'error',
                title: 'An Error',
                message: 'OMG an error happened!',
                id: 'special-error-id',
            };

            it('creates an error message with expected content', () => {
                const alertMsg = InputUtils.buildMessageAlert(msg);
                expect(Object.keys(alertMsg)).toEqual(
                    jasmine.arrayWithExactContents(['events', 'content'])
                );
                const content = alertMsg.content;
                expect(content).toContain(msg.title);
                expect(content).toContain(msg.message);
                expect(content).not.toContain(msg.id);
                expect(content).toContain(`alert-${msg.type}`);
            });

            it('has a button that opens a dialog with an error detail', async () => {
                const alertMsg = InputUtils.buildMessageAlert(msg);
                const node = document.createElement('div');
                node.innerHTML = alertMsg.content;
                document.body.appendChild(node);
                alertMsg.events.attachEvents(document.body);
                await TestUtil.waitForElement(document.body, 'div.modal-body', () =>
                    node.querySelector('button').click()
                );
                const expectedMsg = `Message id: ${msg.id}`;
                expect(document.body.querySelector('div.modal-body').innerHTML).toContain(
                    expectedMsg
                );
                await TestUtil.waitForElementState(
                    document.body,
                    () => {
                        const elem = document.body.querySelector('div.modal-body');
                        if (!elem) {
                            return true;
                        }
                        return !elem.innerHTML.includes(expectedMsg);
                    },
                    () => {
                        document.body.querySelector('div.modal-footer > button').click();
                    }
                );
                // expect the modal to be really gone.
                expect(document.body.querySelectorAll('div.modal').length).toBe(0);
                document.body.removeChild(node);
            });
        });

        it('numericalBoundaryDiv should show minimum and maximum values', () => {
            const values = [-1000, -1, 0, 1, '5', '10'];
            values.forEach((value) => {
                [true, false].forEach((isMin) => {
                    const bound = InputUtils.numericalBoundaryDiv(value, isMin);
                    expect(bound).toContain('input-group-addon');
                    expect(bound).toContain('kb-input-group-addon');
                    if (isMin) {
                        expect(bound).toContain(`${value} &#8804;`);
                    } else {
                        expect(bound).toContain(`&#8804; ${value}`);
                    }
                });
            });
        });
    });
});
