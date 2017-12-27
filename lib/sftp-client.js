'use strict';

const
    path = require('path'),
    fs = require('fs'),
    colors = require("colors/safe"),
    readline = require('readline'),
    tokenizer = require(__dirname + '/tokenizer'),
    local_fsys = require(__dirname + '/local-filesystem');

require('console.table');

let curr_remote_path;
let curr_local_path;

const sftp_commands = [
    ['pwd', 'pwd', 'show current remote directory'],
    ['lpwd', 'lpwd', 'show current local directory'],
    ['lcd', 'lcd', 'change current local directory'],
    ['lls', 'lls', 'list a specified local directory'],
    ['readdir_', 'cd', 'change current remote directory'],
    ['readdir', 'ls', 'list a specified remote directory, it also initializes a remote working directory.'],
    ['fastGet', 'get', 'simple retrieving of a remote file'],
    ['fastPut', 'put', 'simple sending of a local file'],
    ['exit', 'exit', 'exit ftp session'],
];

const remote_file_sorter = (l, r) => {
    if (l.longname[0] === 'd' && r.longname[0] !== 'd') {
        return -1;
    } else if (r.longname[0] === 'd' && l.longname[0] !== 'd') {
        return 1;
    } else {
        return l.filename < r.filename ? -1 : 1;
    }
};

const local_file_sorter = (l, r) => {
    if (l.type === 'directory' && r.type !== 'directory') {
        return -1;
    } else if (r.type === 'directory' && l.type !== 'directory') {
        return 1;
    } else {
        return l.filename < r.filename ? -1 : 1;
    }
};

const resolve_remote_path = (_path, cb, file) => {
    if (!curr_remote_path && _path[0] !== '/') {
        cb('The current remote path is not specified.');
    } else {
        let check = true;
        if (!_path || _path === '.') {
            _path = curr_remote_path + (file ? '/' + file : '');
            check == false;
        } else if (_path === '..') {
            let old_path = _path;
            let pos = curr_remote_path.lastIndexOf('/');
            if (pos !== -1) {
                _path = curr_remote_path.substr(0, pos);
            } else {
                return cb('Invalid path: ' + old_path);
            }
        } else if (_path.indexOf('/') !== 0) {
            let curr_dir = curr_remote_path;
            let old_path = _path;
            while (_path.indexOf('..') === 0) {
                let pos = curr_dir.lastIndexOf('/');
                if (pos === -1) {
                    return cb('Invalid path: ' + old_path);
                }
                _path = _path.length > 3 ? _path.substr(3) : '';
                curr_dir = curr_dir.substr(0, pos);
            }
            _path = curr_dir + '/' + _path;
        }
        if (file && check) {
            if (_path[_path.length - 1] === '/') {
                _path = _path + file;
            }
        }
        //console.log(pars);
        cb(undefined, _path);
    }
};

const resolve_local_path = (_path, cb, file) => {
    if (!curr_local_path && !path.isAbsolute(_path)) {
        cb('The current local path is not specified.');
    } else {
        if (path.sep === '\\') {
            _path = _path.replace(/\//g, '\\');
        } else {
            _path = _path.replace(/\\/g, '/');
        }
        if (!_path || _path === '.') {
            if (!file)
                _path = curr_local_path;
            else {
                _path = path.join(curr_local_path, file);
            }
        } else if (!path.isAbsolute(_path)) {
            if (!file || _path[_path.length - 1] === path.sep) {
                _path = path.join(curr_local_path, _path);
            } else {
                _path = path.join(curr_local_path, _path, file);
            }
        }
        cb(undefined, _path);
    }
};

const sftp_call_schema = {
    pwd: {
        isLocal: true
    },
    lpwd: {
        isLocal: true
    },
    lcd: {
        path: {
            description: colors.bold('local path')
        },
        isLocal: true,
        resolve: (pars, cb) => {
            resolve_local_path(pars[0], (err, dir) => {
                if (err) {
                    cb(err);
                } else {
                    pars[0] = dir;
                    cb(undefined, pars);
                }
            });
        },
        callback: (_path) => {
            curr_local_path = path.normalize(_path[_path.length - 1] === path.sep ? _path.substr(0, _path.length - 1) : _path);
            process.chdir(curr_local_path);
            console.log('   => ' + curr_local_path);
        }
    },
    lls: {
        path: {
            description: colors.bold('local path')
        },
        isLocal: true,
        resolve: (pars, cb) => {
            resolve_local_path(pars[0], (err, dir) => {
                if (err) {
                    cb(err);
                } else {
                    pars[0] = dir;
                    cb(undefined, pars);
                }
            });
        },
        callback: (_path, list) => {
            list.sort(local_file_sorter);
            console.table(list.map(f => {
                return {
                    name: f.filename,
                    type: f.type === 'directory' ? 'folder' : '',
                    size: f.attrs.stats.size,
                    modified: (new Date(f.attrs.stats.mtime)).toLocaleString()
                }
            }));
        }
    },
    readdir_: {
        path: {
            description: colors.bold('remote path')
        },
        resolve: (pars, cb) => {
            resolve_remote_path(pars[0], (err, _path) => {
                if (err)
                    cb(err);
                else {
                    pars[0] = _path;
                    cb(undefined, pars);
                }
            });
        },
        callback: (_path, list) => {
            curr_remote_path = _path[_path.length - 1] === '/' ? _path.substr(0, _path.length - 1) : _path;
            console.log('   => ' + curr_remote_path + ' (%d items)', list.length);
        }
    },
    readdir: {
        path: {
            description: colors.bold('remote path')
        },
        resolve: (pars, cb) => {
            resolve_remote_path(pars[0], (err, _path) => {
                if (err)
                    cb(err);
                else {
                    pars[0] = _path;
                    cb(undefined, pars);
                }
            });
        },
        callback: (path, list) => {
            if (!curr_remote_path) {
                curr_remote_path = path[path.length - 1] === '/' ? path.substr(0, path.length - 1) : path;
            }
            list.sort(remote_file_sorter);
            list.forEach(item => {
                //console.log(item);
                console.log('   ' + item.longname);
            });
        }
    },
    fastGet: {
        remotePath: {
            description: colors.bold('remote file path')
        },
        localPath: {
            description: colors.bold('local file or directory path')
        },
        resolve: (pars, cb) => {
            resolve_remote_path(pars[0], (err, _path) => {
                if (err)
                    cb(err);
                else {
                    pars[0] = _path;
                    let file = _path.substr(_path.lastIndexOf('/') + 1);
                    resolve_local_path(pars[1], (err, _path) => {
                        if (err)
                            cb(err);
                        else {
                            pars[1] = _path;
                            cb(undefined, pars);
                        }
                    }, file);
                }
            });
        },
        callback: (resp) => {
            console.log(resp);
        }
    },
    fastPut: {
        localPath: {
            description: colors.bold('local file path'),
            required: true,
        },
        remotePath: {
            description: colors.bold('remote file or directory path')
        },
        resolve: (pars, cb) => {
            resolve_local_path(pars[0], (err, _path) => {
                if (err)
                    cb(err);
                else {
                    pars[0] = _path;
                    let file = _path.substr(_path.lastIndexOf(path.sep) + 1);
                    resolve_remote_path(pars[1], (err, _path) => {
                        if (err)
                            cb(err);
                        else {
                            pars[1] = _path;
                            cb(undefined, pars);
                        }
                    }, file);
                }
            });
        },
        callback: (resp) => {
            console.log(resp);
        }
    }
};

const sftp_completer = (line) => {
    let cmds = sftp_commands.map(c => c[1]);
    const hits = cmds.filter((c) => {
        return c.indexOf(line.trim()) === 0;
    });
    return [hits.length ? hits : cmds, line];
};

const parse_params = (str, cb) => {
    cb(tokenizer.proc(str))
};

const sftp_loop = function(err, sftp) {
    if (err)
        throw err;
    const conn = this;
    curr_local_path = process.cwd();
    if (curr_local_path[curr_local_path.length - 1] === path.sep) {
        curr_local_path = curr_local_path.slice(0, curr_local_path.length - 1);
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: sftp_completer,
        prompt: colors.cyan('sftp> ')
    });
    rl.prompt();
    rl.on('line', line => {
        if (line.trim() === 'exit') {
            this.end();
            process.exit();
        } else if (line.trim() === '?') {
            let cmds = sftp_commands.map(c => {
                return {
                    cmd: colors.bold(c[1]),
                    descr: colors.yellow(c[2])
                }
            });
            cmds.push({
                cmd: colors.bold('"tab"'),
                descr: colors.yellow('completes the input, if possible')
            }, {
                cmd: colors.bold('?'),
                descr: colors.yellow('show help information')
            });
            console.table(cmds);
            rl.prompt();
        } else if (line) {
            let params_str = '';
            const hits = sftp_commands.filter((c) => {
                if (line.length <= c[1].length) {
                    return c[1].indexOf(line.trim()) === 0;
                } else if (line.indexOf(' ') > -1) {
                    let cmd = line.substr(0, line.indexOf(' '));
                    if (cmd === c[1]) {
                        params_str = line.substr(line.indexOf(' ') + 1).trim();
                        return true;
                    } else
                        return false;
                }
            });
            if (hits.length === 0) {
                console.log(colors.red('command "%s" is not known ...'), line.trim());
                rl.prompt();
            } else if (hits.length > 1) {
                console.log(colors.gray('command "%s" is ambiguous ...'), line.trim());
                rl.prompt();
            } else {
                let method = hits[0][0]; //...
                let schema = sftp_call_schema[method];
                let keys = Object.keys(schema).filter(k => {
                    let ptype = typeof schema[k];
                    return ptype === 'object';
                });
                if (!schema.isLocal) {
                    let call = (params) => {
                        params = params || [];
                        if (params.length > 0) {
                            if (params.length > keys.length) {
                                params.splice(keys.length, params.length - keys.length);
                                keys = [];
                            } else {
                                keys.splice(0, params.length);
                            }
                        }
                        const input = (i) => {
                            if (keys.length === 0)
                                return Promise.resolve();
                            return new Promise(r => {
                                rl.question(schema[keys[i]].description + ' = ', (answer) => {
                                    params.push(answer);
                                    if (i < keys.length - 1)
                                        r(input(i + 1));
                                    else
                                        r();
                                });
                            });
                        };
                        return input(0).then(() => {
                            schema.resolve(params, (err, params) => {
                                if (err) {
                                    console.log('   ' + colors.red(err));
                                    rl.prompt();
                                } else {
                                    sftp[method.replace(/_+$/g, '')](...params, (err, result) => {
                                        if (err)
                                            console.log(err.message || err);
                                        else if (result) {
                                            schema.callback(...params, result);
                                        }
                                        rl.prompt();
                                    });
                                }
                            })
                        });
                    };
                    if (!params_str) {
                        call().catch(err => {
                            console.error(err);
                            rl.prompt();
                        });
                    } else {
                        parse_params(params_str, (para_arr) => {
                            //console.log(para_arr);
                            call(para_arr).catch(err => {
                                console.error(err);
                                rl.prompt();
                            });
                        });
                    }
                } else {
                    switch (method) {
                        case 'pwd':
                            if (curr_remote_path) {
                                console.log('    ' + colors.green(curr_remote_path));
                            } else {
                                console.log('    ' + colors.red('not yet specified'));
                            }
                            rl.prompt();
                            break;
                        case 'lpwd':
                            console.log('    ' + colors.green(curr_local_path));
                            rl.prompt();
                            break;
                        case 'lcd':
                            {
                                let call = (params) => {
                                    params = params || [];
                                    if (params.length > 0) {
                                        if (params.length > keys.length) {
                                            params.splice(keys.length, params.length - keys.length);
                                            keys = [];
                                        } else {
                                            keys.splice(0, params.length);
                                        }
                                    }
                                    const input = (i) => {
                                        if (keys.length === 0)
                                            return Promise.resolve();
                                        return new Promise(r => {
                                            rl.question(schema[keys[i]].description + ' = ', (answer) => {
                                                params.push(answer);
                                                if (i < keys.length - 1)
                                                    r(input(i + 1));
                                                else
                                                    r();
                                            });
                                        });
                                    };
                                    return input(0).then(() => {
                                        schema.resolve(params, (err, params) => {
                                            if (err) {
                                                console.log('   ' + colors.red(err));
                                            } else {
                                                schema.callback(...params);
                                            }
                                            rl.prompt();
                                        })
                                    });
                                };
                                if (!params_str) {
                                    call().catch(err => {
                                        console.error(err);
                                        rl.prompt();
                                    });
                                } else {
                                    parse_params(params_str, (para_arr) => {
                                        call(para_arr).catch(err => {
                                            console.error(err);
                                            rl.prompt();
                                        });
                                    });
                                }
                            }
                            break;
                        case 'lls':
                            {
                                let call = (params) => {
                                    params = params || [];
                                    if (params.length > 0) {
                                        if (params.length > keys.length) {
                                            params.splice(keys.length, params.length - keys.length);
                                            keys = [];
                                        } else {
                                            keys.splice(0, params.length);
                                        }
                                    }
                                    const input = (i) => {
                                        if (keys.length === 0)
                                            return Promise.resolve();
                                        return new Promise(r => {
                                            rl.question(schema[keys[i]].description + ' = ', (answer) => {
                                                params.push(answer);
                                                if (i < keys.length - 1)
                                                    r(input(i + 1));
                                                else
                                                    r();
                                            });
                                        });
                                    };
                                    return input(0).then(() => {
                                        schema.resolve(params, (err, params) => {
                                            if (err) {
                                                console.log('   ' + colors.red(err));
                                                rl.prompt();
                                            } else {
                                                local_fsys.list_directory(...params).then((list) => {
                                                    schema.callback(...params, list);
                                                    rl.prompt();
                                                }).catch((err) => {
                                                    console.log('   ' + colors.red(resp.err));
                                                    rl.prompt();
                                                });
                                            }
                                        })
                                    });
                                };
                                if (!params_str) {
                                    call().catch(err => {
                                        console.error(err);
                                        rl.prompt();
                                    });
                                } else {
                                    parse_params(params_str, (para_arr) => {
                                        call(para_arr).catch(err => {
                                            console.error(err);
                                            rl.prompt();
                                        });
                                    });
                                }
                            }
                            break;
                    }
                }
            }
        } else {
            rl.prompt();
        }
    });
};

module.exports = sftp_loop;