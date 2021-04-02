define([
    '../../../../../../narrative/nbextensions/bulkImportCell/fileTypePanel',
    'common/runtime',
    'bluebird',
], (FileTypePanel, Runtime, Promise) => {
    'use strict';

    const fileTypes = {
        file1: {
            label: 'A File',
        },
        file2: {
            label: 'Another File',
        },
        file3: {
            label: 'A Third File',
        },
    };
    const header = {
        icon: 'fa fa-times',
        label: 'File Header',
    };
    describe('test the file type panel', () => {
        let container;
        beforeEach(() => {
            container = document.createElement('div');
        });
        afterEach(() => {
            container.remove();
        });
        it('should load and start properly with the right available functions', () => {
            const panel = FileTypePanel.make({
                bus: Runtime.make().bus(),
                fileTypes: fileTypes,
                header: header,
                toggleAction: () => {},
            });
            expect(panel.start).toBeDefined();
            expect(panel.stop).toBeDefined();
            expect(panel.updateState).toBeDefined();
            return panel
                .start({
                    node: container,
                    state: {},
                })
                .then(() => {
                    expect(container.innerHTML).toContain(header.label);
                    for (const cat of Object.keys(fileTypes)) {
                        expect(container.innerHTML).toContain(fileTypes[cat].label);
                    }
                });
        });

        it('should respond to an update state signal modifying elements', () => {
            const panel = FileTypePanel.make({
                bus: Runtime.make().bus(),
                fileTypes: fileTypes,
                header: header,
                toggleAction: () => {},
            });
            return panel
                .start({
                    node: container,
                    state: {}, // start with no state, nothing selected, nothing completed
                })
                .then(() => {
                    const beforeNode = {},
                        beforeIcon = {};
                    for (const cat of Object.keys(fileTypes)) {
                        const elem = container.querySelector(`[data-element="${cat}"]`);
                        beforeNode[cat] = elem.outerHTML;
                        beforeIcon[cat] = elem.querySelector('[data-element="icon"]').outerHTML;
                    }
                    panel.updateState({
                        selected: 'file1',
                    });
                    for (const cat of Object.keys(fileTypes)) {
                        const elem = container.querySelector(`[data-element="${cat}"]`);
                        if (cat === 'file1') {
                            // try to black-box test, so we can just know that it should be
                            // different. (really I shouldn't even use the selector, but
                            // I gotta test something)
                            expect(elem.outerHTML).not.toEqual(beforeNode[cat]);
                        } else {
                            expect(elem.outerHTML).toEqual(beforeNode[cat]);
                        }
                    }
                    panel.updateState({
                        completed: {
                            file2: true,
                        },
                    });
                    for (const cat of Object.keys(fileTypes)) {
                        const iconElem = container.querySelector(
                            `[data-element="${cat}"] [data-element="icon"]`
                        );
                        if (cat === 'file2') {
                            expect(iconElem.outerHTML).not.toEqual(beforeIcon[cat]);
                        } else {
                            expect(iconElem.outerHTML).toEqual(beforeIcon[cat]);
                        }
                    }
                });
        });

        it('should respond to clicking on an unselected file type', () => {
            const clickSpy = jasmine.createSpy('clickSpy');
            const panel = FileTypePanel.make({
                bus: Runtime.make().bus(),
                fileTypes: fileTypes,
                header: header,
                toggleAction: clickSpy,
            });
            return panel
                .start({
                    node: container,
                    state: {
                        selected: 'file1',
                    },
                })
                .then(() => {
                    container.querySelector('[data-element="file1"]').click();
                    expect(clickSpy).not.toHaveBeenCalled();
                    container.querySelector('[data-element="file2"]').click();
                    expect(clickSpy).toHaveBeenCalled();
                });
        });

        it('should return a promise from a stop command', () => {
            const panel = FileTypePanel.make({
                bus: Runtime.make().bus(),
                fileTypes: fileTypes,
                header: header,
                toggleAction: () => {},
            });
            return panel
                .start({
                    node: container,
                    state: {},
                })
                .then(() => {
                    const stopProm = panel.stop();
                    expect(stopProm instanceof Promise).toBeTrue();
                    return stopProm;
                })
                .then(() => {
                    // if we got here, then pass.
                    // This is just here to consume the rest of the promise
                    // so it doesn't dangle.
                });
        });
    });
});
