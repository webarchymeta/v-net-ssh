'use strict';

const
    socks = require('socksv5'),
    ssh_client = require('ssh2').Client,
    ssh_config = require(__dirname + '/ssh-config'),
    remote_shells = require(__dirname + '/sremote-shells');

const socks5_address = process.env.SOCKS5_ADDRESS;
const socks5_port = process.env.SOCKS5_PORT;


const connect = (opts) => {

    let ssh_addr;
    let ssh_port; // get these,
    let user, password, privateKey; // get these
    let conn_type = 'shell'; //get this

    if (privateKey) {
        try {
            privateKey = require('fs').readFileSync(privateKey)
        } catch (err) {
            console.error(err);
            return;
        }
    }

    var socks_client = socks.connect({
        host: ssh_addr,
        port: ssh_port,
        proxyHost: socks5_address,
        proxyPort: socks5_port,
        auths: [socks.auth.None()]
    }, (socket) => {
        console.log('>> Connection successful');
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
            //console.log('Client :: ready');
            const handler = handlers[conn_type + '_repl'];
            if (!handler) {
                console.log('don\'t know how to handle [' + conn_type + '] ...');
                this.end();
            } else {
                let this_handler = handler.bind(this);
                conn[conn_type](this_handler);
            }
        }.bind(ssh));
        ssh.connect(conn_opts);
    });
};

module.export = connect;