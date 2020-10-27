const Launcher = require('@wdio/cli').default;

const configPath = process.argv[2];
const wdio = new Launcher(configPath);

wdio.run()
    .then(
        code => {
            console.info('Launcher completed with code', code);
            process.exit(code);
        },
        error => {
            console.error('Launcher failed to start the test', error.stacktrace);
            process.exit(1);
        },
    );
