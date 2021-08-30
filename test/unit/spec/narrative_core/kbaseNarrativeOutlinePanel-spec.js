define(['jquery', 'kbaseNarrativeOutlinePanel', 'base/js/namespace'], ($, Widget, Jupyter) => {
    'use strict';
    describe('The kbaseNarrativeOutlinePanel widget', () => {
        let widget, $target;
        beforeAll(() => {
            if (!Jupyter) Jupyter = {};
            Jupyter.notebook = {
                get_cells: () => [],
            };
            $target = $(`<div id="test-div">`);
            widget = new Widget($target, {
                widget: 'kbaseNarrativeOutlinePanel',
            });
        });
        it('should have a body', () => {
            expect(widget.body).toBeDefined();
        });

        it('should render basic outline', () => {
            Jupyter.notebook = {
                get_cells: () => [
                    {
                        cell_type: 'markdown',
                        element: $('<div>').append('<h1>test header</h1>'),
                        selected: true,
                        getIcon: () => '<span>test-icon</span>',
                    },
                ],
            };
            widget.renderOutline();
            expect(widget.body.html()).toBe(
                '<div class="kb-narr-outline">' +
                    '<ul>' +
                    '<li>' +
                    '<div class="kb-narr-outline__item kb-narr-outline__item--highlight-selected">' +
                    '<span class="kb-narr-outline__item-icon-wrapper">' +
                    '<span class="kb-narr-outline__item-icon">test-icon</span>' +
                    '</span>' +
                    '<a href="#" class="kb-narr-outline__item-content">test header</a>' +
                    '</div>' +
                    '<ul></ul>' +
                    '</li>' +
                    '</ul>' +
                    '</div>'
            );
        });

        it('should render outline with sub-items', () => {
            Jupyter.notebook = {
                get_cells: () => [
                    {
                        cell_type: 'markdown',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Example sample import with value validation error ...',
                                },
                            },
                        },
                        element: $(
                            '<h2 id="Example-sample-import-with-value-validation-error-and-user-defined-column-warnings">Example sample import with value validation error and user-defined column warnings</h2>\n'
                        ),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'markdown',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'empty md cell',
                                },
                            },
                        },
                        element: $('<p>empty md cell</p>\n'),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'code',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Import Samples',
                                },
                            },
                        },
                        element: $('<div/>'),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'markdown',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Example SESAR import with bad unit types',
                                },
                            },
                        },
                        element: $(
                            '<h2 id="Example-SESAR-import-with-bad-unit-types">Example SESAR import with bad unit types</h2>\n'
                        ),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'code',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Import Samples',
                                },
                            },
                        },
                        element: $('<div/>'),
                        selected: true,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'code',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Code Cell',
                                },
                            },
                        },
                        element: $('<div/>'),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'code',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Foo 2',
                                },
                            },
                        },
                        element: $('<div/>'),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'markdown',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Header1',
                                },
                            },
                        },
                        element: $(
                            '<h1 id="Header1">Header1</h1>\n<h2 id="Header2">Header2</h2>\n<h3 id="Header3">Header3</h3>\n<h4 id="Header4">Header4</h4>\n<h5 id="Header5">Header5</h5>\n<h6 id="Header6">Header6</h6>\n'
                        ),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'code',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Import Samples',
                                },
                            },
                        },
                        element: $('<div/>'),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                    {
                        cell_type: 'code',
                        metadata: {
                            kbase: {
                                attributes: {
                                    title: 'Import Samples',
                                },
                            },
                        },
                        element: $('<div/>'),
                        selected: false,
                        getIcon: () => '<span>icon</span>',
                    },
                ],
            };
            widget.renderOutline();
            expect(widget.body.html()).toBe(
                $('<div>')
                    .append(
                        '<div class="kb-narr-outline">' +
                            '<ul>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Example sample import with value validation error ...</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">empty md cell</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Import Samples</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Example SESAR import with bad unit types</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item kb-narr-outline__item--highlight-selected"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Import Samples</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Code Cell</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Foo 2</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Header1</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Import Samples</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '<li>' +
                            '<div class="kb-narr-outline__item"><span class="kb-narr-outline__item-icon-wrapper"><span class="kb-narr-outline__item-icon">icon</span></span><a href="#" class="kb-narr-outline__item-content">Import Samples</a></div>' +
                            '<ul></ul>' +
                            '</li>' +
                            '</ul>' +
                            '</div>'
                    )
                    .html()
            );
        });
    });
});
