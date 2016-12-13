'use strict';

const
    path = require('path'),
    fs = require('fs');

const list_directory = (parent_path) => {
    return new Promise((resolve, reject) => {
        let file_items = [];
        fs.readdir(parent_path, (err, items) => {
            if (err) {
                reject(err);
            } else {
                if (items && items.length > 0) {
                    var p = Promise.all(items.map((fi) => {
                        return new Promise((res, rej) => {
                            fs.lstat(path.join(parent_path, fi), (err, stats) => {
                                if (!err) {
                                    if (stats.isDirectory()) {
                                        file_items.push({
                                            type: 'directory',
                                            filename: fi,
                                            longname: fi,
                                            fullpath: path.join(parent_path, fi),
                                            attrs: {
                                                stats: stats
                                            }
                                        })
                                    } else {
                                        file_items.push({
                                            type: 'file',
                                            filename: fi,
                                            longname: fi,
                                            fullpath: path.join(parent_path, fi),
                                            attrs: {
                                                stats: stats
                                            }
                                        })
                                    }
                                } else {
                                    console.log(err.message || err.msg || typeof err === 'string' ? err : JSON.stringify(err));
                                }
                                res();
                            });
                        });
                    })).then(() => {
                        return file_items;
                    });
                    resolve(p);
                } else {
                    resolve(file_items);
                }
            }
        });
    });
};

module.exports = {
    list_directory: list_directory
};