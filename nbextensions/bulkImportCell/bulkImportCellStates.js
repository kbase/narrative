/**
 * This has the list of available states for the bulk import cell. They should all be referenced
 * by their state id:
 *
 * editingIncomplete - the initial state, a user can edit the app configuration, but not run the
 *      cell yet
 * editingComplete - transition to this when the cell is ready to run. A user can still change
 *      the configuration, this just means it's ready to go.
 * launching - a user clicked "run" and is waiting on a response from the server. This should be
 *      cancelable.
 * queued - the jobs have launched, but all are either in the queue, or otherwise have no state
 *      that's worth looking at
 * running - the jobs are running and have a job state / logs to look at
 * appPartialComplete - at least one job is finished with results to look at
 * appComplete - all of the jobs are complete
 * appCanceled - the cell has canceled its running. Any jobs that have finished can still be looked
 *      at, and logs are still available
 * appError - some unrecoverable error has happened during the app run
 * generalError - not sure how this might get reached, but some horrible error has rendered the
 *      cell unusable. Maybe some mangled data, maybe some mangled internal information.
 */

define([], () => {
    'use strict';
    const states = {
        // for when the cell is in configuration mode, hasn't been run, has no jobs, no results
        editingIncomplete: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: true,
                            visible: true,
                        },
                        viewConfigure: {
                            enabled: false,
                            visible: false
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        // TODO: temporarily enable job status on startup
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        // TODO: temporarily enable results view on startup
                        results: {
                            enabled: true,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'runApp',
                    disabled: true
                }
            }
        },
        // when the cell is in configuration mode, ready to run, but hasn't been started yet
        editingComplete: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: true,
                            visible: true,
                        },
                        viewConfigure: {
                            enabled: false,
                            visible: false
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: false,
                            visible: true
                        },
                        results: {
                            enabled: false,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'runApp',
                    disabled: false
                }
            }
        },
        // the user has clicked "run" and is waiting on the run to start
        launching: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: false,
                            visible: false,
                        },
                        viewConfigure: {
                            enabled: true,
                            visible: true
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: false,
                            visible: true
                        },
                        results: {
                            enabled: false,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'cancel',
                    disabled: false
                }
            }

        },
        // the main app is queued, no child apps have started yet
        queued: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: false,
                            visible: false,
                        },
                        viewConfigure: {
                            enabled: true,
                            visible: true
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        results: {
                            enabled: false,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'cancel',
                    disabled: false
                }
            }

        },
        // apps are running, none are complete yet
        running: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: false,
                            visible: false,
                        },
                        viewConfigure: {
                            enabled: true,
                            visible: true
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        results: {
                            enabled: false,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'cancel',
                    disabled: false
                }
            }

        },
        // at least one child job is complete
        appPartialComplete: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: false,
                            visible: false,
                        },
                        viewConfigure: {
                            enabled: true,
                            visible: true
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        results: {
                            enabled: true,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'cancel',
                    disabled: false
                }
            }

        },
        // all child jobs are complete
        appComplete: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: false,
                            visible: false,
                        },
                        viewConfigure: {
                            enabled: true,
                            visible: true
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        results: {
                            enabled: true,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'reRunApp',
                    disabled: false
                }
            }

        },
        // user canceled the run, and hasn't done anything else yet
        appCanceled: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: false,
                            visible: false,
                        },
                        viewConfigure: {
                            enabled: true,
                            visible: true
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        results: {
                            enabled: true,
                            visible: true
                        },
                        error: {
                            enabled: false,
                            visible: false
                        }
                    }
                },
                action: {
                    name: 'resetApp',
                    disabled: false
                }
            }
        },
        // unrecoverable error(s) occurred during the app run
        appError: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: false,
                            visible: false,
                        },
                        viewConfigure: {
                            enabled: true,
                            visible: true,
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        results: {
                            enabled: true,
                            visible: true
                        },
                        error: {
                            enabled: true,
                            visible: true
                        }
                    }
                },
                action: {
                    name: 'reRunApp',
                    disabled: false
                }
            }
        },
        // something tragic and unrecoverable has happened
        generalError: {
            ui: {
                tab: {
                    tabs: {
                        configure: {
                            enabled: false,
                            visible: false,
                        },
                        viewConfigure: {
                            enabled: true,
                            visible: true
                        },
                        info: {
                            enabled: true,
                            visible: true
                        },
                        jobStatus: {
                            enabled: true,
                            visible: true
                        },
                        results: {
                            enabled: true,
                            visible: true
                        },
                        error: {
                            enabled: true,
                            visible: true
                        }
                    }
                },
                action: {
                    name: 'runApp',
                    disabled: false
                }
            }

        }
    };
    return states;
});
