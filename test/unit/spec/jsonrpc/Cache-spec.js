define(['jsonrpc/Cache'], (Cache) => {
    'use strict';

    function waitFor(duration) {
        return new Promise((resolve) => {
            window.setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    describe('The Cache class', () => {
        it('should be defined', () => {
            expect(Cache).toBeDefined();
        });

        it('should get a value requesting it with fetcher', async () => {
            const cache = new Cache();
            const shouldFetch = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('bar');
                });
            };
            await expectAsync(shouldFetch()).toBeResolvedTo('bar');
        });

        it('should get a value requesting it with fetcher using internal api', async () => {
            const cache = new Cache();
            const shouldFetch = async () => {
                return (
                    await cache.reserveAndFetch('foo', () => {
                        return Promise.resolve('bar');
                    })
                ).value;
            };
            await expectAsync(shouldFetch()).toBeResolvedTo('bar');
        });

        it('should throw an error if the fetch times out', async () => {
            const cache = new Cache({
                waiterTimeout: 1,
                waiterFrequency: 100,
            });
            cache.waitForItem('foo', async () => {
                await waitFor(200);
                return 'bar';
            });
            const shouldFetch = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('baz');
                });
            };
            await expectAsync(shouldFetch()).toBeRejected();
        });

        it('should get a value which has expired', async () => {
            const cache = new Cache({
                itemLifetime: 50,
            });
            const firstFetch = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('bar');
                });
            };

            await expectAsync(firstFetch()).toBeResolvedTo('bar');

            await waitFor(100);

            const secondFetch = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('baz');
                });
            };
            await expectAsync(secondFetch()).toBeResolvedTo('baz');
        });

        it('an item which expires with a monitor frequency less than the ttl should be automatically removed', async () => {
            const cache = new Cache({
                itemLifetime: 50,
                monitoringFrequency: 25,
            });
            const fetchItem = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('bar');
                });
            };
            await expectAsync(fetchItem()).toBeResolvedTo('bar');
            expect(cache.cache.size).toEqual(1);

            const fetchItem2 = () => {
                return cache.waitForItem('meaning', () => {
                    return Promise.resolve(42);
                });
            };
            await expectAsync(fetchItem2()).toBeResolvedTo(42);
            expect(cache.cache.size).toEqual(2);

            await waitFor(100);

            expect(cache.cache.size).toEqual(0);
        });

        it('a more complex scenario', async () => {
            const cache = new Cache({
                itemLifetime: 100,
                monitoringFrequency: 10,
            });
            const fetchItem = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('bar');
                });
            };

            await expectAsync(fetchItem()).toBeResolvedTo('bar');
            expect(cache.cache.size).toEqual(1);

            await waitFor(50);

            const fetchItem2 = () => {
                return cache.waitForItem('meaning', () => {
                    return Promise.resolve(42);
                });
            };
            await expectAsync(fetchItem2()).toBeResolvedTo(42);
            expect(cache.cache.size).toEqual(2);

            await waitFor(75);

            expect(cache.cache.size).toEqual(1);

            await waitFor(75);

            expect(cache.cache.size).toEqual(0);
        });

        it('should get a value which has not yet expired', async () => {
            const cache = new Cache({
                itemLifetime: 100,
            });
            const firstFetch = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('bar');
                });
            };

            await expectAsync(firstFetch()).toBeResolvedTo('bar');

            await waitFor(50);

            const secondFetch = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('baz');
                });
            };
            await expectAsync(secondFetch()).toBeResolvedTo('bar');
        });

        it('requesting an item already requested should wait', async () => {
            const cache = new Cache();
            const firstFetch = () => {
                return cache.waitForItem('foo', async () => {
                    await waitFor(100);
                    return 'bar';
                });
            };
            // This will cause the first fetch to become a dangling promise, which
            // will keep running in the background for at least 100ms.
            firstFetch();
            // await expectAsync(firstFetch()).toBeResolvedTo('bar');
            expect(cache.cache.size).toEqual(1);

            // Now try to get it again, but this time without waiting.
            const start = Date.now();
            const secondFetch = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('bar');
                });
            };
            await expectAsync(secondFetch()).toBeResolvedTo('bar');

            // It should have taken on the order of 100ms, say over 50ms.
            expect(Date.now() - start).toBeGreaterThan(50);
        });

        it('should handle a cache item going missing while waiting for it', async () => {
            const cache = new Cache();
            const firstFetch = () => {
                return cache.waitForItem('foo', async () => {
                    await waitFor(200);
                    return 'bar';
                });
            };
            // This will cause the first fetch to become a dangling promise, which
            // will keep running in the background for at least 100ms as the cache
            // waits for the fetch to complete.
            firstFetch();

            expect(cache.cache.size).toEqual(1);

            // schedule a brutal deletion of the cache entry
            // in the middle of the wait loop
            window.setTimeout(() => {
                cache.cache.delete('foo');
            }, 75);

            // await expectAsync(firstFetch()).toBeResolvedTo('bar');
            // expect(cache.cache.size).toEqual(0);

            // Now try to get it again, but this time without waiting.
            const start = Date.now();
            const secondFetch = () => {
                return cache.waitForItem('foo', () => {
                    return Promise.resolve('baz');
                });
            };
            await expectAsync(secondFetch()).toBeResolvedTo('baz');

            // It should have experienced no delays.
            expect(Date.now() - start).toBeLessThan(200);
        });
    });
});
