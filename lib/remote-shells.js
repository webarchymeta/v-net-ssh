'use strict';

const
    path = require('path'),
    readline = require('readline');

const shell_loop = function(err, stream) {
    if (err)
        throw err;
    const conn = this;
    process.stdin.pipe(stream).pipe(process.stdout);
    stream.on('close', () => {
        conn.end();
        process.exit();
    }).stderr.on('data', (data) => {
        console.error('STDERR: ' + data);
    });
};

module.exports = {
    shell_loop: shell_loop
};