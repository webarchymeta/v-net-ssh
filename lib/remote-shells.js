'use strict';

const
    path = require('path'),
    colors = require("colors/safe"),
    readline = require('readline'),
    sftp_loop = require(__dirname + '/sftp-client');

const shell_loop = function(err, stream) {
    if (err)
        throw err;
    const conn = this;
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    process.stdin.on('keypress', (str, key) => {
        stream.write(key.sequence);
    });
    process.stdin.resume();
    stream.pipe(process.stdout);
    stream.on('close', () => {
        conn.end();
        process.exit();
    }).stderr.on('data', (data) => {
        console.error('STDERR: ' + data);
    });
};


module.exports = {
    shell_loop: shell_loop,
    sftp_loop: sftp_loop
};