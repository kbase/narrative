define([], () => {
    'use strict';
    const states = {
        // for when the cell is in configuration mode, hasn't been run, has no jobs, no results
        editingIncomplete: {
            ui: {
                tab: {
                    selected: 'configure',
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
                    name: 'runApp',
                    disabled: true
                }
            }
        },
        // when the cell is in configuration mode, ready to run, but hasn't been started yet
        editingComplete: {
            ui: {
                tab: {
                    selected: 'configure',
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
                    selected: 'configure',
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
                    selected: 'configure',
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
                    selected: 'configure',
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
                    selected: 'configure',
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
                    name: 'runApp',
                    disabled: false
                }
            }

        },
        // all child jobs are complete
        appComplete: {
            ui: {
                tab: {
                    selected: 'configure',
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
                    selected: 'configure',
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
                    selected: 'configure',
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
                    selected: 'configure',
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
