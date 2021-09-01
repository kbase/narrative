define(['jquery', 'kbaseNarrativeOutlinePanel', 'base/js/namespace'], ($, Widget, Jupyter) => {
    'use strict';
    describe('The kbaseNarrativeOutlinePanel widget', () => {
        let widget, $target;
        beforeAll(() => {
            if (!Jupyter) Jupyter = {};
            Jupyter.notebook = { get_cells: () => [] };
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
                    mockCell('markdown', null, false, 'test-icon', '<h1>test header!!</h1>'),
                    mockCell('code', 'My App', false),
                ],
            };
            widget.renderOutline();

            expect(widget.body.find('.kb-narr-outline__item').length).toBe(2);
            expect(getItemDepths(widget.body)).toEqual([0, 1]);

            expect(
                widget.body
                    .find('.kb-narr-outline__item .kb-narr-outline__item-content')
                    .eq(0)
                    .text()
            ).toBe('test header!!');

            expect(
                widget.body.find('.kb-narr-outline__item .kb-narr-outline__item-icon').eq(0).html()
            ).toBe('test-icon');

            expect(
                widget.body
                    .find('.kb-narr-outline__item .kb-narr-outline__item-content')
                    .eq(1)
                    .text()
            ).toBe('My App');
        });

        it('should highlight selected', () => {
            Jupyter.notebook = {
                get_cells: () => [mockCell(null, null, true)],
            };
            widget.renderOutline();
            expect(widget.body.find('.kb-narr-outline__item').length).toBe(1);
            expect(
                widget.body
                    .find('.kb-narr-outline__item')
                    .hasClass('kb-narr-outline__item--highlight-selected')
            ).toBe(true);
        });

        it('should render outline with nested items', () => {
            Jupyter.notebook = {
                get_cells: () => [
                    mockCell('markdown', null, null, null, '<h6/>'),
                    mockCell('markdown', null, null, null, '<h2/>'),
                    mockCell('markdown', null, null, null, '<h1/>'),
                    /**/ mockCell('markdown', null, null, null, '<h2/>'),
                    /**/ /**/ mockCell('markdown', null, null, null, '<h3/>'),
                    /**/ /**/ /**/ mockCell('markdown', null, null, null, '<h4/>'),
                    /**/ /**/ /**/ mockCell('code', 'My App', false),
                    /**/ /**/ /**/ mockCell('markdown', null, null, null, '<h5/>'),
                    /**/ /**/ /**/ mockCell('markdown', null, null, null, '<h6/>'),
                    /**/ mockCell('markdown', null, null, null, '<h2/>'),
                    /**/ /**/ mockCell('markdown', null, null, null, '<h4/>'),
                    mockCell('markdown', null, null, null, '<h1/>'),
                    /**/ mockCell('code', 'My App', false),
                    /**/ mockCell('markdown', null, null, null, '<h2/>'),
                    /**/ /**/ mockCell('code', 'My App', false),
                    /**/ /**/ mockCell('code', 'My App', false),
                    /**/ /**/ mockCell('code', 'My App', false),
                    /**/ /**/ mockCell('markdown', null, null, null, '<h3/>'),
                    /**/ /**/ /**/ mockCell('code', 'My App', false),
                    /**/ mockCell('markdown', null, null, null, '<h2/>'),
                    /**/ /**/ mockCell('markdown', null, null, null, '<h4/>'),
                    /**/ /**/ mockCell('code', 'My App', false),
                ],
            };
            widget.renderOutline();
            expect(getItemDepths(widget.body)).toEqual([
                0, 0, 0, 1, 2, 3, 3, 3, 3, 1, 2, 0, 1, 1, 2, 2, 2, 2, 3, 1, 2, 2,
            ]);
        });
    });

    function getItemDepths(body) {
        return body
            .find('.kb-narr-outline__item')
            .map(function () {
                // find ul/li pairs of parents
                const uls_and_lis = $(this)
                    .parentsUntil('.kb-narr-outline')
                    .filter('.kb-narr-outline>ul, ul>li, li>ul').length;
                // number of pairs, minus 1 so its zero-based
                return uls_and_lis / 2 - 1;
            })
            .get();
    }

    function mockCell(
        type = 'code',
        title = 'Some Cell',
        selected = false,
        iconContent = 'Some Icon',
        elementContent = '<div>'
    ) {
        return {
            cell_type: type,
            metadata: {
                kbase: {
                    attributes: {
                        title: title,
                    },
                },
            },
            element: $('<div>').append(elementContent),
            selected: selected,
            getIcon: () => $('<span>').append(iconContent)[0].outerHTML,
        };
    }
});
