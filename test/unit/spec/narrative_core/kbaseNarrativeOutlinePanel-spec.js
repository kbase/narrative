define(['jquery', 'kbaseNarrativeOutlinePanel', 'base/js/namespace', 'narrativeMocks'], (
    $,
    Widget,
    Jupyter,
    Mocks
) => {
    'use strict';
    const { buildMockCell, buildMockNotebook } = Mocks;
    describe('The kbaseNarrativeOutlinePanel widget', () => {
        let widget, $target;
        beforeAll(() => {
            if (!Jupyter) Jupyter = {};
            Jupyter.notebook = buildMockNotebook();
            $target = $(`<div id="test-div">`);
            widget = new Widget($target, {
                widget: 'kbaseNarrativeOutlinePanel',
            });
        });

        it('should have a body', () => {
            expect(widget.body).toBeDefined();
        });

        it('should render basic outline', () => {
            Jupyter.notebook = buildMockNotebook({
                cells: [
                    buildMockCell('markdown', 'markdown', {
                        output: '<h1>test header!!</h1>',
                        iconContent: 'test-icon',
                    }),
                    buildMockCell('code', 'app'),
                ],
            });

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
            ).toBe('Untitled Cell');
        });

        it('should highlight selected', () => {
            Jupyter.notebook = buildMockNotebook({
                cells: [buildMockCell('code', 'app', { selected: true })],
            });

            widget.renderOutline();
            expect(widget.body.find('.kb-narr-outline__item').length).toBe(1);
            expect(
                widget.body
                    .find('.kb-narr-outline__item')
                    .hasClass('kb-narr-outline__item--highlight-selected')
            ).toBe(true);
        });

        it('should render outline with nested items', () => {
            Jupyter.notebook = buildMockNotebook({
                cells: [
                    buildMockCell('markdown', 'markdown', { output: '<h6/>' }),
                    buildMockCell('markdown', 'markdown', { output: '<h2/>' }),
                    buildMockCell('markdown', 'markdown', { output: '<h1/>' }),
                    /**/ buildMockCell('markdown', 'markdown', { output: '<h2/>' }),
                    /**/ /**/ buildMockCell('markdown', 'markdown', { output: '<h3/>' }),
                    /**/ /**/ /**/ buildMockCell('markdown', 'markdown', { output: '<h4/>' }),
                    /**/ /**/ /**/ buildMockCell('code', 'app'),
                    /**/ /**/ /**/ buildMockCell('markdown', 'markdown', { output: '<h5/>' }),
                    /**/ /**/ /**/ buildMockCell('markdown', 'markdown', { output: '<h6/>' }),
                    /**/ buildMockCell('markdown', 'markdown', { output: '<h2/>' }),
                    /**/ /**/ buildMockCell('markdown', 'markdown', { output: '<h4/>' }),
                    buildMockCell('markdown', 'markdown', { output: '<h1/>' }),
                    /**/ buildMockCell('code', 'app'),
                    /**/ buildMockCell('markdown', 'markdown', { output: '<h2/>' }),
                    /**/ /**/ buildMockCell('code', 'app'),
                    /**/ /**/ buildMockCell('code', 'app'),
                    /**/ /**/ buildMockCell('code', 'app'),
                    /**/ /**/ buildMockCell('markdown', 'markdown', { output: '<h3/>' }),
                    /**/ /**/ /**/ buildMockCell('code', 'app'),
                    /**/ buildMockCell('markdown', 'markdown', { output: '<h2/>' }),
                    /**/ /**/ buildMockCell('markdown', 'markdown', { output: '<h4/>' }),
                    /**/ /**/ buildMockCell('code', 'app'),
                ],
            });
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
});
