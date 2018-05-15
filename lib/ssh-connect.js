'use strict';

const
    fs = require('fs'),
    socks = require('socks5-client'),
    chalk = require('chalk'),
    ssh_client = require('ssh2').Client,
    handlers = require(__dirname + '/remote-shells');

let socks5_address = process.env.SOCKS5_ADDRESS;
let socks5_port = (process.env.SOCKS5_PORT && typeof process.env.SOCKS5_PORT === 'string') ? parseInt(process.env.SOCKS5_PORT) : process.env.SOCKS5_PORT;

const connect = opts => {

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
            privateKey = fs.readFileSync(identityfile);
        } catch (err) {
            console.error(err);
            return;
        }
    }
    let ssh_conn = socket => {
        console.log(chalk.grey('connected to the remote server ...'));
        let conn_opts = socket ? {
            sock: socket,
            username: user
        } : {
            host: opts.host,
            port: opts.port,
            username: user
        };
        if (privateKey) {
            conn_opts.privateKey = privateKey;
        } else if (password) {
            conn_opts.password = password;
        }
        var ssh = new ssh_client();
        ssh.once('ready', function() {
            console.log(chalk.grey('ssh ready ...'));
            const handler = handlers[conn_type + '_loop'];
            if (!handler) {
                console.log('don\'t know how to handle [' + conn_type + '] ...');
                this.end();
            } else {
                let this_handler = handler.bind(this);
                if (conn_type === 'shell') {
                    this[conn_type]({
                        cols: process.stdout.columns,
                        rows: process.stdout.rows,
                        term: process.env.TERM || 'xterm'
                    }, this_handler);
                } else if (conn_type === 'x11') {
                    let self = this;
                    this_handler(opts.x_server_ip, opts.x_server_port);
                } else {
                    this[conn_type](this_handler);
                }
            }
        }.bind(ssh));
        ssh.on('error', err => {
            console.log(err);
        });
        ssh.connect(conn_opts);
    };
    if (opts.proxy === 'yes') {
        const ss5 = socks.createConnection({
            socksHost: socks5_address,
            socksPort: socks5_port,
            host: ssh_addr,
            port: ssh_port
        });
        ss5.on('connect', () => {
            ssh_conn(ss5.socket);
        });
    } else {
        ssh_conn();
    }
};

module.exports = connect;