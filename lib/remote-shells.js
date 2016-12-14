'use strict';

const
    path = require('path'),
    net = require('net'),
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

/**
 *  Current Linux GUI system disable tcp connection to x-server by default. To use the current feature:
 *  1) Enable tcp connection on the x-server node
 *     on ubuntu: add
 *          [SeatDefaults]
 *          xserver-allow-tcp=true
 *     to the /etc/lightdm/lightdm.conf file
 *  2) on the x-server node execute xhost +hostname where hostname is the ip or the host name of
 *     the node on which this program run (localhost, most likely)
 */

const x11_loop = function(x_server_ip, x_server_port) {
    const conn = this;
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: colors.cyan('X11> ')
    });
    const start = () => {
        rl.question('Remote application: ', answer => {
            conn.once('x11', function(info, accept, reject) {
                let xserversock = new net.Socket();
                xserversock.on('connect', function() {
                    console.log('connected to x11 server ...');
                    let xclientsock = accept();
                    //xclientsock.pipe(xserversock).pipe(xclientsock);
                    xserversock.on('data', (data) => {
                        //console.log('s: data [' + data + ']');
                        if (!xclientsock.write(data))
                            xserversock.pause();
                    });
                    xserversock.on('drain', () => {
                        xclientsock.resume();
                    });
                    xserversock.on('close', () => {
                        console.log('s: close');
                        xclientsock.end();
                    });
                    xserversock.on('end', (msg) => {
                        if (msg) {
                            console.log('s: end = ' + msg);
                        }
                        xclientsock.end();
                    });
                    xserversock.on('error', (err) => {
                        console.log('s: error');
                        console.error(err);
                    });
                    xclientsock.on('data', (data) => {
                        //console.log('c: data [' + data + ']');
                        if (!xserversock.write(data))
                            xclientsock.pause();
                    });
                    xclientsock.on('drain', () => {
                        xserversock.resume();
                    });
                    xclientsock.on('end', (msg) => {
                        if (msg) {
                            console.log('c: end = ' + msg);
                        }
                        xserversock.end();
                    });
                    xclientsock.on('close', () => {
                        console.log('c: close');
                        xserversock.end();
                    });
                    xclientsock.on('error', (err) => {
                        console.log('c: error');
                        console.error(err);
                    });
                    rl.prompt();
                });
                xserversock.connect(x_server_port || 6000, x_server_ip || 'localhost');
            });
            conn.exec(answer.trim(), {
                x11: true,
                agentForward: true
            }, (err, stream) => {
                if (err)
                    return console.error(err);
                let code = 0;
                stream.on('end', () => {
                    if (code !== 0)
                        console.log('Do you have X11 forwarding enabled on your SSH server?');
                    conn.end();
                }).on('exit', (exitcode) => {
                    code = exitcode;
                });
            });
        });
    };
    start();
    rl.on('line', line => {
        if (!line || line.trim() === '') {
            rl.prompt();
        } else if (line.trim() === 'exit') {
            conn.end();
            return process.exit();
        } else if (line.trim() === '?') {
            console.log('Enter: another or exit');
            rl.prompt();
        } else if (line.trim() === 'another') {
            start();
        }
    });
};

module.exports = {
    shell_loop: shell_loop,
    sftp_loop: sftp_loop,
    x11_loop: x11_loop
};