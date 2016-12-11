'use strict';

const
    path = require('path'),
    crypto = require('crypto'),
    inter_proc_ipc = require('node-ipc');

const pjson = require(__dirname + '/../package.json');

const get_app_id = () => {
    let md5 = crypto.createHash('md5');
    md5.update(__filename.toLowerCase());
    return md5.digest('hex');
};

const register_app = () => {
    inter_proc_ipc.config.id = 'socks_app_register';
    inter_proc_ipc.config.retry = 1500;
    inter_proc_ipc.config.silent = true;
    inter_proc_ipc.connectTo('inter_app_services', () => {
        inter_proc_ipc.of.inter_app_services.on('connect', () => {
            inter_proc_ipc.log('## connected to inter_app_services ##'.rainbow, inter_proc_ipc.config.delay);
            let data = {
                id: get_app_id(),
                categ: 'socks',
                type: process.env.APP_TYPE || 'shell',
                runtime: 'node',
                name: pjson.name,
                appPath: path.join(__dirname, '/..'),
                shell: true,
                pid: process.pid,
                started: true,
            };
            inter_proc_ipc.of.inter_app_services.emit('socks-client-register', data);
        });
        inter_proc_ipc.of.inter_app_services.on('disconnect', () => {
            inter_proc_ipc.log('disconnected from socks_app_register'.notice);
        });
        inter_proc_ipc.of.inter_app_services.on('socks-client-register-ack', (data) => {
            inter_proc_ipc.log('got a message from socks_app_register : '.debug, data);
        });
    });
};

process.on('beforeExit', (code) => {
    inter_proc_ipc.of.inter_app_services.emit('socks-client-status', {
        id: get_app_id(),
        pid: process.pid,
        started: false
    });
});

module.exports = {
    regist: register_app
};