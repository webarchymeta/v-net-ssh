'use strict';

const
    path = require('path'),
    os = require('os'),
    chalk = require('chalk'),
    app_register = require('./lib/app-register'),
    local_shell = require('./lib/local-shell');

process.stdout.columns = 220;

if (process.argv[0].match(/v-net-ssh(\.\w+)?$/ui)) {
    const cdir = path.dirname(process.execPath);
    if (process.cwd() !== cdir) {
        process.chdir(cdir);
    }
}

app_register.regist().then(run => {
    if (!run) {
        console.log('OK, the current app is registered with V-NET client. It can be launched there. Have a good day!');
        setTimeout(() => {
            process.exit(0);
        }, 500);
        return;
    }

    process.on('SIGINT', () => {
        process.exit(0);
    });

    console.log(chalk.yellow(`************************************************************************************************************

                Welcome to V-NET ssh client
                
                Current Host: ${os.hostname()}
                Host Type: ${os.type()}
                Target Gateway: ${!process.env.LOCAL_LAN && process.env.CONTEXT_TITLE ? process.env.CONTEXT_TITLE : 'Unknown' }
                SOCKS: (host: ${!process.env.LOCAL_LAN && process.env.SOCKS5_ADDRESS ? process.env.SOCKS5_ADDRESS : 'Undefined' }, port: ${!process.env.LOCAL_LAN && process.env.SOCKS5_PORT ? process.env.SOCKS5_PORT : 'Undefined' })
                Current Time: ${(new Date()).toLocaleString()}

************************************************************************************************************
` + chalk.gray.hex('#aaaaaa')('Please specify the following parameters:') + `

`));

    process.on('uncaughtException', err => {
        console.log(err);
        process.exit(1);
    })

    local_shell.start();
});