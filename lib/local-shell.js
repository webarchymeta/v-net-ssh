'use strict';

const
    path = require('path'),
    os = require('os'),
    chalk = require("chalk"),
    prompt = require('prompt'),
    readline = require('readline'),
    ssh_config = require('./ssh-config'),
    ssh_connect = require('./ssh-connect');

let schema, hosts;

prompt.chalk = false;
prompt.message = chalk.grey('>>');
prompt.delimiter = chalk.yellow(':');

schema = {
    properties: {
        proxy: {
            description: chalk.hex('#aaaaaa')('through proxy (yes/no)'),
            message: 'choose from "yes" or "no"',
            pattern: /^(yes|no)$/,
            default: process.env.SOCKS5_ADDRESS && process.env.SOCKS5_PORT ? 'yes' : 'no',
            ask: () => {
                return !process.env.SOCKS5_ADDRESS || !process.env.SOCKS5_PORT;
            }
        },
        socks5_host: {
            description: chalk.hex('#aaaaaa')('socks v5 host'),
            default: process.env.SOCKS5_ADDRESS,
            ask: () => {
                if (!process.env.LOCAL_LAN && !process.env.SOCKS5_ADDRESS) {
                    let proxy = prompt.history('proxy').value;
                    return proxy && proxy === 'yes';
                } else {
                    return false;
                }
            }
        },
        socks5_port: {
            description: chalk.hex('#aaaaaa')('socks v5 port'),
            type: 'integer',
            default: process.env.SOCKS5_PORT ? parseInt(process.env.SOCKS5_PORT) : 0,
            ask: () => {
                if (!process.env.LOCAL_LAN && !process.env.SOCKS5_ADDRESS) {
                    let proxy = prompt.history('proxy').value;
                    return proxy && proxy === 'yes';
                } else {
                    return false;
                }
            }
        },
        app: {
            description: chalk.hex('#aaaaaa')('app type (shell, sftp or x11)'),
            message: 'choose from "shell", "sftp" or "x11"',
            pattern: /^(shell|sftp|x11)$/,
            default: process.env.SHELL_APP || 'shell',
            ask: () => {
                return !process.env.SHELL_APP
            }
        },
        host: {
            description: chalk.hex('#aaaaaa')('ssh host'),
            required: true
        },
        port: {
            description: chalk.hex('#aaaaaa')('port'),
            type: 'integer',
            default: 22,
            ask: () => {
                let host = prompt.history('host').value;
                return host && !hosts[host];
            }
        },
        user: {
            description: chalk.hex('#aaaaaa')('user'),
            ask: () => {
                let host = prompt.history('host').value;
                return host && !hosts[host];
            }
        },
        password: {
            description: chalk.hex('#aaaaaa')('password'),
            hidden: true,
            replace: '*',
            ask: () => {
                const host = prompt.history('host').value;
                return host && (!hosts[host] || !hosts[host].identityfile);
            }
        },
        x_server_ip: {
            description: chalk.hex('#aaaaaa')('x server ip'),
            default: 'localhost',
            ask: () => {
                if (process.env.SHELL_APP) {
                    return process.env.SHELL_APP === 'x11' && !process.env.X11_SERVER_IP;
                } else {
                    return prompt.history('app') && prompt.history('app').value === 'x11';
                }
            }
        },
        x_server_port: {
            type: 'integer',
            description: chalk.hex('#aaaaaa')('x server port'),
            default: 6000,
            ask: () => {
                if (process.env.SHELL_APP) {
                    return process.env.SHELL_APP === 'x11' && !process.env.X11_SERVER_PORT;
                } else {
                    return prompt.history('app') && prompt.history('app').value === 'x11';
                }
            }
        }
    }
};

const start = () => {

    prompt.start({
        noHandleSIGINT: true
    });
    prompt.get(schema, (err, result) => {
        if (err) {
            console.error(err);
        } else {
            if (process.env.SHELL_APP) {
                result.app = process.env.SHELL_APP;
            }
            if (process.env.LOCAL_LAN) {
                result.proxy = 'no';
            } else if (process.env.SOCKS5_ADDRESS && process.env.SOCKS5_PORT) {
                result.proxy = 'yes';
                result.socks5_host = process.env.SOCKS5_ADDRESS;
                try {
                    result.socks5_port = typeof process.env.SOCKS5_PORT === 'string' ? parseInt(process.env.SOCKS5_PORT) : process.env.SOCKS5_PORT;
                } catch (ex) {
                    console.error(ex);
                }
            }
            if (process.env.SHELL_APP === 'x11') {
                if (process.env.X11_SERVER_IP) {
                    result.x_server_ip = process.env.X11_SERVER_IP;
                }
                if (process.env.X11_SERVER_PORT) {
                    try {
                        result.x_server_port = typeof process.env.X11_SERVER_PORT === 'string' ? parseInt(process.env.X11_SERVER_PORT) : process.env.X11_SERVER_PORT;
                    } catch (ex) {
                        console.error(ex);
                    }
                }
            }
            let cfg = hosts[result.host];
            if (cfg) {
                result.host = cfg.hostname;
                result.user = cfg.user;
                result.port = cfg.port || 22;
                if (cfg.identityfile) {
                    if (cfg.identityfile.indexOf('~/') === 0) {
                        result.identityfile = path.join(os.homedir(), cfg.identityfile.substr(1));
                    } else {
                        result.identityfile = cfg.identityfile;
                    }
                }
            }
            console.log(chalk.grey('connecting to the remote server ...'));
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