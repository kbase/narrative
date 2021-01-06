define([
    'util/icon',
    'narrativeConfig',
    'jquery',
], function(
    Icon,
    narrativeConfig,
    $
) {
    'use strict';

    const specWithIcon = {info:{icon:{url:'path/to/icon.png'}}},
        specNoIcon = {info:{icon:{}}},
        iconSpec = narrativeConfig.get('icons'),
        defaultIcon = iconSpec.data.DEFAULT[0],
        exampleIcon = 'Assembly',
        makeIconTests = {
            App: [
                {   // app has an icon specified
                    args: [specWithIcon],
                    result: {
                        iconUrl: 'path/to/icon.png',
                    }
                },
                {   // no icon -- uses app default fa-cube
                    args: [specNoIcon],
                    result: {
                        iconTypeClass: 'fa-cube',
                    }
                },
                {   // no spec -- uses app default fa-cube
                    args: [],
                    result: {
                        iconTypeClass: 'fa-cube',
                    }
                }
            ],
            Generic: [
                {   // default colour
                    args: ['cross'],
                    result: {
                        iconTypeClass: 'fa-cross',
                    }
                },
                {   // custom colour
                    args: ['cross', 'pink'],
                    result: {
                        style: 'color: pink',
                        iconTypeClass: 'fa-cross',
                    }
                },
                {   // no arg supplied - uses app default fa-cube
                    args: [],
                    result: {
                        iconTypeClass: 'fa-cube',
                    }
                }
            ],
            Type: [
                {   // default icon
                    args: ['DEFAULT'],
                    result: {
                        iconTypeClass: defaultIcon,
                    },
                },
                {   // custom colour and custom icon
                    // would be better if it weren't hardcoded, but never mind...
                    args: [`KBase.${exampleIcon}-v2.75`],
                    result: {
                        style: 'color: ' + iconSpec.color_mapping[exampleIcon],
                        iconTypeClass: iconSpec.data[exampleIcon][0],
                    },
                },
                {   // made-up icon name => uses default icon
                    args: ['Mary Poppins'],
                    result: {
                        iconTypeClass: defaultIcon,
                    },
                },
            ]
        },
        methods = Object.keys(makeIconTests).sort(),
        types = ['', 'Toolbar'],
        cssBaseName = Icon.cssBaseName;

    describe('The Icon util module', () => {
        it('Is alive!', function() {
            expect(Icon).toBeTruthy();
        });
        const otherMethods = ['makeDataIcon', 'overwriteDataIcon'];
        otherMethods.forEach( (method) => {
            it(`has the method ${method}`, () => {
                expect(Icon[method]).toBeDefined();
            });
        });
        methods.forEach((method) => {
            types.forEach((type) => {
                const methodName = `make${type}${method}Icon`;
                it(`has the method ${methodName}`, () => {
                    expect(Icon[methodName]).toBeDefined();
                });
            });
        });
        it('has a css class base name', function() {
            expect(Icon.cssBaseName).toBeTruthy();
        });
    });

    const tests = [{
        desc: 'can create an icon using FontAwesome',
        args: ['FeatureClusters', false],
        result: {
            iconType: 'data',
            iconTypeClassList: ['fa'].concat(iconSpec.data['FeatureClusters']),
            style: 'color: ' + iconSpec.color_mapping['FeatureClusters'],
        }
    },
    {
        desc: 'can create a stacked icon',
        args: ['FeatureClusters', true],
        result: {
            iconType: 'data-stack',
            iconTypeClassList: ['fa'].concat(iconSpec.data['FeatureClusters']),
            // precalculated
            style: 'color: rgb(194,254,20)',
        }
    },
    {
        desc: 'can use a custom kbase icon',
        args: ['GenomeAnnotation', false],
        result: {
            iconType: 'data',
            iconTypeClassList: ['fa', 'icon-genome'],
            style: 'color: ' + iconSpec.color_mapping['GenomeAnnotation'],
        }
    }];

    describe('The Icon util method makeDataIcon', () => {
        let container,
            $jqueryContainer;

        tests.forEach((test) => {
            beforeEach(() => {
                container = document.createElement('div');
                $jqueryContainer = $('<div>');
            });

            it('can build an icon with args: ' + test.args.join(', '), () => {

                container.innerHTML = Icon.makeDataIcon(...test.args);

                // create the other icon container
                Icon.buildDataIcon($jqueryContainer, ...test.args);

                const parent = container.childNodes[0],
                    $parent = $jqueryContainer[0].childNodes[0],
                    isStacked = test.args[1],
                    iconType = test.result.iconType,
                    parentClassList = [
                        `${cssBaseName}__container--${iconType}`,
                        'fa-stack'
                    ];

                parentClassList.forEach((cssClass) => {
                    expect(parent).toHaveClass(cssClass);
                    expect($parent).toHaveClass(cssClass);
                });
                expect($parent.innerHTML).toEqual(parent.innerHTML);

                const nChildren = parent.childNodes.length;
                expect(nChildren).toBe(isStacked ? 4 : 2);

                const bgNode = parent.childNodes[nChildren - 2],
                    iconNode = parent.childNodes[nChildren - 1],
                    classList = {
                        bg: [
                            `${cssBaseName}__icon_background--${iconType}`,
                            'fa',
                            'fa-circle',
                            'fa-stack-2x',
                        ],
                        icon: [
                            `${cssBaseName}__icon--${iconType}`,
                            'fa-inverse',
                            'fa-stack-1x',
                        ].concat(test.result.iconTypeClassList),
                        outline: [
                            'fa',
                            'fa-circle',
                            'fa-stack-2x',
                            `${cssBaseName}__outline--l1`,
                        ],
                        stack: [
                            'fa',
                            'fa-circle',
                            'fa-stack-2x',
                            `${cssBaseName}__stack--l1`,
                        ]
                    };

                classList.bg.forEach((cssClass) => {
                    expect(bgNode).toHaveClass(cssClass);
                });

                classList.icon.forEach((cssClass) => {
                    expect(iconNode).toHaveClass(cssClass);
                });

                if (isStacked) {
                    const stackNode = parent.childNodes[nChildren - 4],
                        outlineNode = parent.childNodes[nChildren - 3];

                    classList.stack.forEach((cssClass) => {
                        expect(stackNode).toHaveClass(cssClass);
                    });
                    classList.outline.forEach((cssClass) => {
                        expect(outlineNode).toHaveClass(cssClass);
                    });
                    if (test.result.style) {
                        expect(stackNode.getAttribute('style')).toBe(test.result.style);
                        expect(bgNode.getAttribute('style')).not.toBe(test.result.style);
                        expect(bgNode.getAttribute('style')).toContain('color: ');
                    }
                }
                else {
                    expect(bgNode.getAttribute('style')).toBe(test.result.style);
                }
            });
        });
    });

    /* test the "make<whatever>Icon" methods */
    methods.forEach((method) => {
        types.forEach((type) => {
            const methodName = `make${type}${method}Icon`;
            let container;

            beforeEach(() => {
                container = document.createElement('div');
            });

            describe(`The Icon method ${methodName}`, function() {
                const methodTests = makeIconTests[method];
                methodTests.forEach((test) => {
                    it('can build an icon with args: ' + test.args.join(', '), () => {

                        container.innerHTML = Icon[methodName](...test.args);
                        const parent = container.childNodes[0];

                        // icons with an image as their icon
                        if (test.result.iconUrl) {
                            expect(parent).toHaveClass(`${cssBaseName}__container--image`);
                            expect(parent.childNodes.length).toBe(1);
                            const child = parent.childNodes[0];
                            expect(child).toHaveClass(`${cssBaseName}__img--image`);
                            expect(child.getAttribute('src')).toEqual(jasmine.stringMatching(test.result.iconUrl));
                            return;
                        }

                        // icons generated using the magic of FontAwesome
                        let iconType = method.toLowerCase();
                        if (type) {
                            iconType += '-toolbar';
                        }

                        const parentClassList = [
                            `${cssBaseName}__container--${iconType}`,
                            'fa-stack',
                        ];
                        parentClassList.forEach((cssClass) => {
                            expect(parent).toHaveClass(cssClass);
                        });

                        expect(parent.childNodes.length).toBe(2);
                        const bgNode = parent.childNodes[0],
                            iconNode = parent.childNodes[1],
                            bgNodeClassList = [
                                `${cssBaseName}__icon_background--${iconType}`,
                                'fa',
                                'fa-square',
                                'fa-stack-2x',
                            ],
                            iconNodeClassList = [
                                `${cssBaseName}__icon--${iconType}`,
                                'fa',
                                'fa-inverse',
                                'fa-stack-1x',
                                test.result.iconTypeClass,
                            ];

                        bgNodeClassList.forEach((cssClass) => {
                            expect(bgNode).toHaveClass(cssClass);
                        });

                        iconNodeClassList.forEach((cssClass) => {
                            expect(iconNode).toHaveClass(cssClass);
                        });

                        if (test.result.style) {
                            expect(bgNode.getAttribute('style')).toBe(test.result.style);
                        }
                        else {
                            expect(bgNode.getAttribute('style')).toBe('');
                        }
                    });
                });
            });
        });
    });
});
