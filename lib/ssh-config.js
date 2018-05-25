'use strict';

const
    path = require('path'),
    readline = require('readline'),
    fs = require('fs'),
    os = require('os');

const seps = [' ', '\t'];

const getSepPos = str => {
    let pos = -1;
    for (let i = 0; i < seps.length; i++) {
        pos = str.indexOf(seps[i]);
        if (pos > -1) {
            return pos;
        }
    }
    return -1;
};

const loadConfig = () => {
    return new Promise((resolve, reject) => {
        const ssh_path = path.join(os.homedir(), '.ssh');
        fs.exists(ssh_path, ok => {
            if (!ok) {
                return resolve({});
            }
            const cfile = path.join(ssh_path, 'config');
            fs.exists(cfile, (ok) => {
                if (!ok) {
                    return resolve({});
                }
                const rl = readline.createInterface({
                    input: fs.createReadStream(cfile)
                });
                const config = {};
                let curr = undefined;
                rl.on('line', (line) => {
                    if (line.trim().indexOf('host ') === 0 || line.trim().indexOf('host\t') === 0) {
                        if (curr) {
                            config[curr.host] = curr;
                        }
                        curr = {
                            host: line.substr(getSepPos(line) + 1).trim()
                        }
                    } else if (line) {
                        line = line.trim();
                        const pos = getSepPos(line);
                        curr[line.substr(0, pos)] = line.substr(pos + 1).trim();
                    }
                });
                rl.on('close', () => {
                    if (curr) {
                        config[curr.host] = curr;
                    }
                    resolve(config);
                })
            });
        });
    });
};

module.exports = loadConfig;