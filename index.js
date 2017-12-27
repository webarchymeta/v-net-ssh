'use strict';

const
    path = require('path'),
    os = require('os'),
    colors = require('colors'),
    readline = require('readline'),
    app_register = require(__dirname + '/lib/app-register'),
    local_shell = require(__dirname + '/lib/local-shell');

process.stdout.columns = 120;

app_register.regist().then((run) => {
    if (!run) {
        console.log('OK, the current app is registered with 1-NET client. It can be launched there. Have a good day!');
        setTimeout(() => {
            process.exit(0);
        }, 500);
        console.log()
        return;
    }

    process.on('SIGINT', function() {
        process.exit(0);
    });

    console.log(colors.cyan(`************************************************************************************************************

                Welcome to 1-NET ssh client
                
                Current Host: ${os.hostname()}
                Host Type: ${os.type()}
                Target Gateway: (${process.env.CONTEXT_TITLE ? process.env.CONTEXT_TITLE : 'Unknown' })
                SOCKS: (host: ${process.env.SOCKS5_ADDRESS ? process.env.SOCKS5_ADDRESS : 'Unknown' }, port: ${process.env.SOCKS5_PORT ? process.env.SOCKS5_PORT : 'Unknown' })
                Current Time: ${(new Date()).toLocaleString()}

************************************************************************************************************
` + colors.gray.bold('Please specify the following parameters:') + `

`));

    process.on('uncaughtException', function(err) {
        console.log(err);
        process.exit(1);
    })

    local_shell.start();
});