define([], () => {
    'use strict';

    const CacheItemState = {
        RESERVED: 1,
        PRESENT: 2,
    };

    const DEFAULT_CACHE_TTL = 1800000; // 5 minutes
    const DEFAULT_MONITORING_FREQUENCY = DEFAULT_CACHE_TTL / 10;
    const DEFAULT_WAITER_TIMEOUT = 30000; // 30 seconds
    const DEFAULT_WAITER_FREQUENCY = 50; // 50 ms

    /**
     * A class representing a cache of arbitrary objects, with expiration invalidation,
     * concurrent access, and automatic population via callback.
     */
    class Cache {
        constructor({ itemLifetime, monitoringFrequency, waiterTimeout, waiterFrequency } = {}) {
            this.cache = new Map();

            // 10 minute cache lifetime
            this.cacheLifetime = itemLifetime || DEFAULT_CACHE_TTL;

            // Frequency with which to monitor the cache for expired items
            // or refreshing them.
            this.monitoringFrequency = monitoringFrequency || DEFAULT_MONITORING_FREQUENCY;

            // The waiter waits for a cache item to become available if it has
            // been reserved. These settings determine how long to wait
            // for a waiter to wait, and how often to check the cache item to see if it has
            // yet been fulfilled.
            this.waiterTimeout = waiterTimeout || DEFAULT_WAITER_TIMEOUT;
            this.waiterFrequency = waiterFrequency || DEFAULT_WAITER_FREQUENCY;

            this.isMonitoring = false;
        }

        runMonitor() {
            if (this.isMonitoring) {
                return;
            }
            this.isMonitoring = true;
            setTimeout(() => {
                const newCache = new Map();
                for (const [id, item] of this.cache.entries()) {
                    if (!this.isExpired(item)) {
                        newCache.set(id, item);
                    }
                }
                this.cache = newCache;
                this.isMonitoring = false;

                if (this.cache.size > 0) {
                    this.runMonitor();
                }
            }, this.monitoringFrequency);
        }

        isExpired(cacheItem) {
            const elapsed = Date.now() - cacheItem.createdAt;
            return elapsed > this.cacheLifetime;
        }

        /**
         * Wait for a reserved item associated with id to become available, and then
         * return it.
         * Implements this by polling for a given amount of time, with a given pause time between
         * poll attempts.
         * Handles the case of a reserve item disappearing between polls, in which case the item
         * will be reserved and fetched.
         *
         * @param id - an identifier which uniquely identifies an item of type T
         * @param fetcher - a function returning a promise of an item of type T
         */
        reserveWaiter(id, fetcher) {
            return new Promise((resolve, reject) => {
                const started = new Date().getTime();
                const resolveItem = async () => {
                    const item = this.cache.get(id);

                    // If on a wait-loop cycle we discover that the
                    // cache item has been deleted, we volunteer
                    // to attempt to fetch it ourselves.
                    // The only case now for this is a cancellation
                    // of the first request to any dynamic service,
                    // which may cancel the initial service wizard
                    // call rather than the service call.

                    // Does not exist yet, reserve it and fetch and set it.
                    // This is an edge case, which can occur if the requested
                    // cache item is removed while we are waiting for it.
                    // In real life, this will probably never happen, because it would
                    // require a cache item ttl low enough to be triggered
                    // after an item is created, and before this wait loop can
                    // run.
                    if (typeof item === 'undefined') {
                        resolve(await this.reserveAndFetch(id, fetcher));
                        return;
                    }

                    switch (item.state) {
                        case CacheItemState.RESERVED:
                            (() => {
                                const elapsed = new Date().getTime() - started;
                                if (elapsed < this.waiterTimeout) {
                                    // Our time spent waiting is still within the timeout window, so keep going.
                                    waiter();
                                } else {
                                    // Otherwise we have waited too long, and we just give up.
                                    reject(
                                        new Error(
                                            `Timed-out waiting for cache item to become available; timeout ${this.waiterTimeout}, waited ${elapsed}`
                                        )
                                    );
                                }
                            })();
                            break;
                        case CacheItemState.PRESENT:
                            resolve(item);
                    }
                };

                const waiter = () => {
                    setTimeout(resolveItem, this.waiterFrequency);
                };
                waiter();
            });
        }

        /**
         * Reserve an item, uniquely identified by id, and the proceed to fetch it
         * and add it to the cache (under that id).
         *
         * @param {string} id - an identifier for the value to cache
         * @param {function} fetcher - a function which returns promise which resolves to a value to cache
         */
        async reserveAndFetch(id, fetcher) {
            // now, reserve it.
            this.reserveItem(id, fetcher);

            // Fetch it
            const newItem = await fetcher();

            // And cache it.
            const newCacheItem = {
                id,
                fetcher,
                createdAt: new Date().getTime(),
                value: newItem,
                state: CacheItemState.PRESENT,
            };
            this.cache.set(id, newCacheItem);

            // Start the monitor to enable cache expiration
            this.runMonitor();
            return newCacheItem;
        }

        /**
         * Given an id which uniquely identifies an item,
         * and a fetcher with which to retrieve such an item,
         * return a promise for such an item.
         *
         * @param id - unique identifier for an object of type T
         * @param fetcher - a function returning a promise of an item of type T
         */
        async waitForItem(id, fetcher) {
            const cached = this.cache.get(id);

            // If there is no item cached yet, we reserve it and then fetch it. We don't
            // need to wait. (Others asking for this cache item, though, will need to wait
            // until the reserve is cleared.)
            if (typeof cached === 'undefined') {
                return (await this.reserveAndFetch(id, fetcher)).value;
            }

            // If an item is expired, we immediately remove it and then re-reserve-and-fetch-it
            if (this.isExpired(cached)) {
                this.cache.delete(id);
                return (await this.reserveAndFetch(id, fetcher)).value;
            }

            switch (cached.state) {
                case CacheItemState.RESERVED:
                    return (async () => {
                        return (await this.reserveWaiter(id, fetcher)).value;
                    })();
                case CacheItemState.PRESENT:
                    return cached.value;
            }
        }

        /**
         * Adds an item to the cache in a "reserved" state.
         * This state implies that item is or is going to soon be
         * fetched.
         *
         * @param id - some opaque string identifier uniquely associated with the thing T
         * @param fetcher
         */
        reserveItem(id, fetcher) {
            const reservedItem = {
                id,
                fetcher,
                reservedAt: new Date().getTime(),
                state: CacheItemState.RESERVED,
            };
            this.cache.set(id, reservedItem);
            return reservedItem;
        }
    }

    return Cache;
});
