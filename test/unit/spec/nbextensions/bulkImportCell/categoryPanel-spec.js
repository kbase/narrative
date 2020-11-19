/* global define describe it expect jasmine */
define([
    '../../../../../../narrative/nbextensions/bulkImportCell/categoryPanel',
    'common/runtime'
], (
    CategoryPanel,
    Runtime
) => {
    'use strict';

    const categories = {
        cat1: {
            label: 'A Category'
        },
        cat2: {
            label: 'Another Category'
        },
        cat3: {
            label: 'A Third Category'
        }
    };
    const header = {
        icon: 'fa fa-times',
        label: 'Category Header'
    };
    describe('test the category panel', () => {

        it('should load and start properly with the right available functions', () => {
            let panel = CategoryPanel.make({
                bus: Runtime.make().bus(),
                categories: categories,
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
                    for (const cat of Object.keys(categories)) {
                        expect(node.innerHTML).toContain(categories[cat].label);
                    }
                });
        });

        it('should respond to an update state signal modifying elements', () => {
            let panel = CategoryPanel.make({
                bus: Runtime.make().bus(),
                categories: categories,
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
                    for (const cat of Object.keys(categories)) {
                        const elem = node.querySelector(`[data-element="${cat}"]`);
                        beforeNode[cat] = elem.outerHTML;
                        beforeIcon[cat] = elem.querySelector('[data-element="icon"]').outerHTML;
                    }
                    panel.updateState({
                        selected: 'cat1'
                    });
                    for (const cat of Object.keys(categories)) {
                        const elem = node.querySelector(`[data-element="${cat}"]`);
                        if (cat === 'cat1') {
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
                            'cat2': true,
                        }
                    });
                    for (const cat of Object.keys(categories)) {
                        const iconElem = node.querySelector(`[data-element="${cat}"] [data-element="icon"]`);
                        if (cat === 'cat2') {
                            expect(iconElem.outerHTML).not.toEqual(beforeIcon[cat]);
                        }
                        else {
                            expect(iconElem.outerHTML).toEqual(beforeIcon[cat]);
                        }
                    }
                });
        });

        it('should respond to clicking on an unselected category', () => {
            const clickSpy = jasmine.createSpy('clickSpy');
            let panel = CategoryPanel.make({
                bus: Runtime.make().bus(),
                categories: categories,
                header: header,
                toggleAction: clickSpy
            });
            let node = document.createElement('div');
            return panel.start({
                node: node,
                state: {
                    selected: 'cat1'
                }
            })
                .then(() => {
                    node.querySelector('[data-element="cat1"]').click();
                    expect(clickSpy).not.toHaveBeenCalled();
                    node.querySelector('[data-element="cat2"]').click();
                    expect(clickSpy).toHaveBeenCalled();
                });
        });
    });
});
