define([
    'common/ui'
], (UI) => {
    'use strict';

    const loadingCases = [{
        arg: undefined,
        resultContains: 'fa-spinner'
    }, {
        arg: { color: '#123456' },
        resultContains: 'color: #123456'
    }, {
        arg: { message: 'some message'},
        resultContains: '<span>some message...'
    }, {
        arg: { size: '2x' },
        resultContains: 'fa-2x'
    }];

    describe('ui module tests', () => {
        it('should make a loading spinner with a UI instance', () => {
            const ui = UI.make({});
            loadingCases.forEach(testCase => {
                expect(ui.loading(testCase.arg)).toContain(testCase.resultContains);
            });
        });
        it('should make a loading spinner as a static function', () => {
            loadingCases.forEach(testCase => {
                expect(UI.loading(testCase.arg)).toContain(testCase.resultContains);
            });
        });
    });
});
