define(['jquery', 'kbaseTabs'], ($, KBaseTabs) => {
    'use strict';
    describe('The KBaseTabs widget', () => {
        it('module should load', () => {
            expect(KBaseTabs).toBeDefined();
        });

        it('should render with minimal options', () => {
            const $host = $(document.createElement('div'));
            new KBaseTabs($host, {
                tabs: [{
                    tab: 'Foo',
                    content: 'BAR'
                }]
            });
            expect($host.text()).toContain('Foo');
            expect($host.text()).toContain('BAR');
        });
    });
});
