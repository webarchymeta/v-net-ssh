'use strict';

const
    path = require('path'),
    fs = require('fs'),
    crypto = require('crypto'),
    inter_proc_ipc = require('node-ipc'),
    pjson = require(__dirname + '/../package.json');

const
    config = fs.existsSync(path.join(__dirname, '../config.js')) ? require(__dirname + '/../config') : undefined;

let ipc_connected = false;

const get_app_id = () => {
    let md5 = crypto.createHash('md5');
    md5.update(__filename.toLowerCase());
    return md5.digest('hex');
};

const register_app = () => {
    return new Promise((resolve, reject) => {
        const is_register = process.argv.length > 2 && process.argv[2] === '--register';
        inter_proc_ipc.config.id = 'socks_app_register';
        inter_proc_ipc.config.retry = 1500;
        inter_proc_ipc.config.stopRetrying = true;
        inter_proc_ipc.config.silent = true;
        inter_proc_ipc.connectTo('inter_app_services', () => {
            inter_proc_ipc.of.inter_app_services.on('connect', () => {
                inter_proc_ipc.log('## connected to inter_app_services ##'.rainbow, inter_proc_ipc.config.delay);
                const data = {
                    id: get_app_id(),
                    categ: 'socks',
                    type: process.env.APP_TYPE || 'shell',
                    name: pjson.name,
                    appPath: path.join(__dirname, '/..'),
                    shell: true,
                    pid: process.pid,
                    single_instance: false,
                    started: true,
                };
                if (config && config.customShell) {
                    if (fs.existsSync(config.customShell)) {
                        data.customShell = config.customShell;
                    } else {
                        console.log('Note: custom shell executable "' + config.customShell + '" is ignored because it is not found.');
                    }
                }
                ipc_connected = true;
                inter_proc_ipc.of.inter_app_services.emit('socks-client-register', data);
                resolve(!is_register);
            });
            inter_proc_ipc.of.inter_app_services.on('error', (err) => {
                if (err.code === 'ENOENT') {
                    if (!is_register) {
                        console.log('fail to connect [ENOENT]');
                    } else {
                        console.log('1-NET client application can not be reached, the registration failed.');
                        process.exit(1);
                        resolve(false);
                    }
                } else {
                    console.log(err);
                }
                resolve(!is_register);
            });
            inter_proc_ipc.of.inter_app_services.on('disconnect', () => {
                inter_proc_ipc.log('disconnected from socks_app_register'.notice);
            });
            inter_proc_ipc.of.inter_app_services.on('socks-client-register-ack', (data) => {
                inter_proc_ipc.log('got a message from socks_app_register : '.debug, data);
            });
        });
    });
};

process.on('beforeExit', (code) => {
    if (ipc_connected) {
        inter_proc_ipc.of.inter_app_services.emit('socks-client-status', {
            id: get_app_id(),
            pid: process.pid,
            started: false
        });
    }
});

module.exports = {
    regist: register_app
};