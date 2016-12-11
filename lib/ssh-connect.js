'use strict';

const
    socks = require('socksv5'),
    colors = require('colors'),
    ssh_client = require('ssh2').Client,
    handlers = require(__dirname + '/remote-shells');

let socks5_address = process.env.SOCKS5_ADDRESS;
let socks5_port = (process.env.SOCKS5_PORT && typeof process.env.SOCKS5_PORT === 'string') ? parseInt(process.env.SOCKS5_PORT) : process.env.SOCKS5_PORT;

const connect = (opts) => {

    let ssh_addr = opts.host;
    let ssh_port = opts.port;
    let user = opts.user;
    let password = opts.password;
    let identityfile = opts.identityfile;
    let conn_type = opts.app;
    let privateKey;
    if (!socks5_address) {
        socks5_address = opts.socks5_host;
    }
    if (!socks5_port) {
        socks5_port = opts.socks5_port;
    }
    if (identityfile) {
        try {
            privateKey = require('fs').readFileSync(identityfile)
        } catch (err) {
            console.error(err);
            return;
        }
    }

    let socks_client = socks.connect({
        host: ssh_addr,
        port: ssh_port,
        proxyHost: socks5_address,
        proxyPort: socks5_port,
        auths: [socks.auth.None()]
    }, (socket) => {
        console.log(colors.grey('connected to the remote server ...'));
        let conn_opts = {
            sock: socket,
            username: user
        };
        if (privateKey) {
            conn_opts.privateKey = privateKey;
        } else if (password) {
            conn_opts.password = password;
        }
        var ssh = new ssh_client();
        ssh.once('ready', function() {
            console.log(colors.grey('ssh ready ...'));
            const handler = handlers[conn_type + '_loop'];
            if (!handler) {
                console.log('don\'t know how to handle [' + conn_type + '] ...');
                this.end();
            } else {
                let this_handler = handler.bind(this);
                if (conn_type === 'shell') {
                    this[conn_type]({
                        cols: 200,
                        rows: 60
                    }, this_handler);
                } else {
                    this[conn_type](this_handler);
                }
            }
        }.bind(ssh));
        ssh.connect(conn_opts);
    });
};

module.exports = connect;