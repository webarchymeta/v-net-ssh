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
                description: colors.bold('app type (shell, sftp)'),
                message: 'choose from "shell" or "sftp"',
                pattern: /^(shell|sftp)$/,
                default: 'sftp' //tmp
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
            }
        }
    };
} else {
    schema = {
        properties: {
            app: {
                description: colors.bold('app type (shell, sftp)'),
                message: 'choose from "shell" or "sftp"',
                pattern: /^(shell|sftp)$/,
                required: true
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
            /*
            readline.emitKeypressEvents(process.stdin);
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('keypress', (str, key) => {
                console.log(str);
                console.log(key);
                if (key && key.ctrl && key.name == 'c') {
                    process.exit();
                }
            });
            */
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