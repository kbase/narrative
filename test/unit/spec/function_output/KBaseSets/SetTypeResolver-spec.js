define([
    'widgets/function_output/KBaseSets/SetTypeResolver',
    'widgets/function_output/KBaseSets/SetElements/AssemblySetViewer',
    'widgets/function_output/KBaseSets/SetElements/ReadsAlignmentSetViewer'
], (SetTypeResolver, AssemblySetViewer, ReadsAlignmentSetViewer) => {
    'use strict';

    describe('The SetTypeResolver module', () => {
        it('resolve() method should resolve supported types', () => {
            const testCases = [
                {
                    args: [
                        'KBaseSets.ReadsAlignmentSet'
                    ],
                    expected: {
                        method: 'get_reads_alignment_set_v1',
                        module: ReadsAlignmentSetViewer
                    }
                },
                {
                    args: [
                        'KBaseSets.AssemblySet'
                    ],
                    expected: {
                        method: 'get_assembly_set_v1',
                        module: AssemblySetViewer
                    }
                }
            ];


            for (const { args, expected } of testCases) {
                const { module, method } = SetTypeResolver.resolve.apply(null, args);
                expect(method).toEqual(expected.method);
                expect(module).toEqual(expected.module);
            }

        });

        it('resolve() method should throw if given a non-string argument', () => {
            const testArgs = [
                1,
                0
                - 1,
                undefined,
                null,
                true,
                false,
                new Date(),
                {},
                { foo: 'bar' },
                [],
                ['foo'],
                Symbol(),
                Symbol('foo'),
                Symbol(123)
            ];

            const unsupportedTypes = [
                'boolean', 'number', 'object', 'symbol', 'undefined'
            ];

            function shouldThrow(arg) {
                return () => {
                    SetTypeResolver.resolve(arg);
                };
            }

            const coveredTypes = new Set();

            for (const arg of testArgs) {
                coveredTypes.add(typeof arg);
                expect(shouldThrow(arg)).toThrowError(Error, /type "((number)|(boolean)|(undefined)|(object)|(symbol))" not supported as a workspace type value for KBaseSets/);
            }

            expect(Array.from(coveredTypes).sort()).toEqual(unsupportedTypes);
        });

        it('resolve() method should throw if an unsupported type string error if given an unsupported workspace type string', () => {
            const testArgs = [
                'foo',
                'foo.bar',
                ''
            ];

            function shouldThrow(arg) {
                return () => {
                    SetTypeResolver.resolve(arg);
                };
            }

            for (const arg of testArgs) {
                expect(shouldThrow(arg)).toThrowError(Error, /workspace type ".*?" not supported for KBaseSets/);
            }
        });
    });
});
