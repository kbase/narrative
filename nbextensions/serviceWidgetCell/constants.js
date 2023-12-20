define([], () => {
    const DEFAULT_MAX_HEIGHT = '15em';
    const DEFAULT_SHOW_BORDER = false;
    const PLUGIN_STARTUP_TIMEOUT = 60000;

    return {
        typeName: 'serviceWidget',
        DEFAULT_MAX_HEIGHT, DEFAULT_SHOW_BORDER, PLUGIN_STARTUP_TIMEOUT
    }
});