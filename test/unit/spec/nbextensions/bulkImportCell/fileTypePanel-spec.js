/* global describe it expect jasmine */
define([
    '../../../../../../narrative/nbextensions/bulkImportCell/fileTypePanel',
    'common/runtime',
    'bluebird'
], (
    FileTypePanel,
    Runtime,
    Promise
) => {
    'use strict';

    const fileTypes = {
        file1: {
            label: 'A File'
        },
        file2: {
            label: 'Another File'
        },
        file3: {
            label: 'A Third File'
        }
    };
    const header = {
        icon: 'fa fa-times',
        label: 'File Header'
    };
    describe('test the file type panel', () => {

        it('should load and start properly with the right available functions', () => {
            let panel = FileTypePanel.make({
                bus: Runtime.make().bus(),
                fileTypes: fileTypes,
                header: header,
                toggleAction: () => {}
            });
            expect(panel.start).toBeDefined();
            expect(panel.stop).toBeDefined();
            expect(panel.updateState).toBeDefined();
            let node = document.createElement('div');
            return panel.start({
                node: node,
                state: {}
            })
                .then(() => {
                    expect(node.innerHTML).toContain(header.label);
                    for (const cat of Object.keys(fileTypes)) {
                        expect(node.innerHTML).toContain(fileTypes[cat].label);
                    }
                });
        });

        it('should respond to an update state signal modifying elements', () => {
            let panel = FileTypePanel.make({
                bus: Runtime.make().bus(),
                fileTypes: fileTypes,
                header: header,
                toggleAction: () => {}
            });
            let node = document.createElement('div');
            return panel.start({
                node: node,
                state: {}       // start with no state, nothing selected, nothing completed
            })
                .then(() => {
                    let beforeNode = {},
                        beforeIcon = {};
                    for (const cat of Object.keys(fileTypes)) {
                        const elem = node.querySelector(`[data-element="${cat}"]`);
                        beforeNode[cat] = elem.outerHTML;
                        beforeIcon[cat] = elem.querySelector('[data-element="icon"]').outerHTML;
                    }
                    panel.updateState({
                        selected: 'file1'
                    });
                    for (const cat of Object.keys(fileTypes)) {
                        const elem = node.querySelector(`[data-element="${cat}"]`);
                        if (cat === 'file1') {
                            // try to black-box test, so we can just know that it should be
                            // different. (really I shouldn't even use the selector, but
                            // I gotta test something)
                            expect(elem.outerHTML).not.toEqual(beforeNode[cat]);
                        }
                        else {
                            expect(elem.outerHTML).toEqual(beforeNode[cat]);
                        }
                    }
                    panel.updateState({
                        completed: {
                            'file2': true,
                        }
                    });
                    for (const cat of Object.keys(fileTypes)) {
                        const iconElem = node.querySelector(`[data-element="${cat}"] [data-element="icon"]`);
                        if (cat === 'file2') {
                            expect(iconElem.outerHTML).not.toEqual(beforeIcon[cat]);
                        }
                        else {
                            expect(iconElem.outerHTML).toEqual(beforeIcon[cat]);
                        }
                    }
                });
        });

        it('should respond to clicking on an unselected file type', () => {
            const clickSpy = jasmine.createSpy('clickSpy');
            let panel = FileTypePanel.make({
                bus: Runtime.make().bus(),
                fileTypes: fileTypes,
                header: header,
                toggleAction: clickSpy
            });
            let node = document.createElement('div');
            return panel.start({
                node: node,
                state: {
                    selected: 'file1'
                }
            })
                .then(() => {
                    node.querySelector('[data-element="file1"]').click();
                    expect(clickSpy).not.toHaveBeenCalled();
                    node.querySelector('[data-element="file2"]').click();
                    expect(clickSpy).toHaveBeenCalled();
                });
        });

        it('should return a promise from a stop command', () => {
            let panel = FileTypePanel.make({
                bus: Runtime.make().bus(),
                fileTypes: fileTypes,
                header: header,
                toggleAction: () => {}
            });
            let node = document.createElement('div');
            return panel.start({
                node: node,
                state: {}
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
