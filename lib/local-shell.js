'use strict';

const
    path = require('path'),
    colors = require("colors/safe"),
    prompt = require('prompt'),
    readline = require('readline'),
    ssh_config = require(__dirname + '/ssh-config'),
    ssh_connect = require(__dirname + '/ssh-connect');

let schema, hosts;

prompt.colors = false;
prompt.message = colors.grey('>>');
prompt.delimiter = colors.yellow(':');

if (!process.env.SOCKS5_ADDRESS || !process.env.SOCKS5_PORT) {
    schema = {
        properties: {
            proxy: {
                description: colors.bold('through proxy (yes/no)'),
                message: 'choose from "yes" or "no"',
                pattern: /^(yes|no)$/,
                default: 'no',
            },
            socks5_host: {
                description: colors.bold('socks v5 host'),
                ask: () => {
                    let proxy = prompt.history('proxy').value;
                    return proxy && proxy === 'yes';
                }
            },
            socks5_port: {
                description: colors.bold('socks v5 port'),
                type: 'integer',
                ask: () => {
                    let proxy = prompt.history('proxy').value;
                    return proxy && proxy === 'yes';
                }
            },
            app: {
                description: colors.bold('app type (shell, sftp or x11)'),
                message: 'choose from "shell", "sftp" or "x11"',
                pattern: /^(shell|sftp|x11)$/,
                default: 'shell'
            },
            host: {
                description: colors.bold('ssh host'),
                required: true
            },
            user: {
                ask: () => {
                    let host = prompt.history('host').value;
                    return host && !hosts[host];
                }
            },
            port: {
                type: 'integer',
                default: 22,
                ask: () => {
                    let host = prompt.history('host').value;
                    return host && !hosts[host];
                }
            },
            password: {
                hidden: true,
                replace: '*',
                ask: () => {
                    let host = prompt.history('host').value;
                    return host && (!hosts[host] || !hosts[host].identityfile);
                }
            },
            x_server_ip: {
                description: colors.bold('x server ip'),
                default: 'localhost',
                ask: () => {
                    let app = prompt.history('app').value;
                    return app === 'x11';
                }
            },
            x_server_port: {
                type: 'integer',
                description: colors.bold('x server port'),
                default: 6000,
                ask: () => {
                    let app = prompt.history('app').value;
                    return app === 'x11';
                }
            }
        }
    };
} else {
    schema = {
        properties: {
            app: {
                description: colors.bold('app type (shell, sftp or x11)'),
                message: 'choose from "shell", "sftp" or "x11"',
                pattern: /^(shell|sftp|x11)$/,
                default: 'shell'
            },
            host: {
                description: colors.bold('ssh host'),
                required: true
            },
            user: {
                ask: () => {
                    let host = prompt.history('host').value;
                    return host && !hosts[host];
                }
            },
            port: {
                type: 'integer',
                default: 22,
                ask: () => {
                    let host = prompt.history('host').value;
                    return host && !hosts[host];
                }
            },
            password: {
                hidden: true,
                replace: '*',
                ask: () => {
                    let host = prompt.history('host').value;
                    return host && (!hosts[host] || !hosts[host].identityfile);
                }
            },
            x_server_ip: {
                description: colors.bold('x server ip'),
                default: 'localhost',
                ask: () => {
                    let app = prompt.history('app').value;
                    return app === 'x11';
                }
            },
            x_server_port: {
                type: 'integer',
                description: colors.bold('x server port'),
                default: 6000,
                ask: () => {
                    let app = prompt.history('app').value;
                    return app === 'x11';
                }
            }
        }
    };
}

const start = () => {

    prompt.start({
        noHandleSIGINT: true
    });
    prompt.get(schema, (err, result) => {
        if (err) {
            console.error(err);
        } else {
            if (process.env.SOCKS5_ADDRESS && process.env.SOCKS5_PORT) {
                try {
                    result.socks5_host = process.env.SOCKS5_ADDRESS;
                    result.socks5_port = typeof process.env.SOCKS5_PORT === 'string' ? parseInt(process.env.SOCKS5_PORT) : process.env.SOCKS5_PORT;
                } catch (ex) {
                    console.error(ex);
                }
            }
            let cfg = hosts[result.host];
            if (cfg) {
                result.host = cfg.hostname;
                result.user = cfg.user;
                result.port = cfg.port || 22;
                if (cfg.identityfile) {
                    if (cfg.identityfile.indexOf('~/') == 0) {
                        result.identityfile = path.join(process.env.HOME, cfg.identityfile.substr(1));
                    } else {
                        result.identityfile = cfg.identityfile;
                    }
                }
            }
            console.log(colors.grey('connecting to the remote server ...'));
            ssh_connect(result);
        }
    });
};


module.exports = {
    start: () => {
        ssh_config().then(cfg => {
            hosts = cfg;
            start();
        });
    }
};