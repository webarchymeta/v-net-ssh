'using strict';

const seps = [' ', '\t', '"', '\''];

const next_sep = (str, i0) => {
    let next_i = -1;
    seps.forEach((sep) => {
        let i = str.indexOf(sep, i0);
        if (i !== -1) {
            if (next_i === -1 || next_i > i) {
                next_i = i;
            }
        }
    });
    return {
        i: next_i,
        sep: next_i === -1 ? undefined : str[next_i]
    }
};

const skip_spaces = (str, i0, qc) => {
    let ptr = str.indexOf(qc, i0);
    if (ptr > -1) {
        let cont = true;
        while (cont) {
            let i = ptr - 1;
            if (i > i0 && str[i] === '\\') {
                let cnt = 0;
                while (i > i0 && str[i] === '\\') {
                    cnt++;
                    i--;
                }
                if (cnt % 2 == 0) {
                    return ptr;
                } else {
                    i0 = ptr + 1;
                    ptr = str.indexOf(qc, i0);
                    if (ptr === -1)
                        return -1;
                }
            } else {
                return ptr;
            }
        }
    } else {
        return -1;
    }
};

const unescape = (str) => {
    let pos = str.indexOf('\\');
    if (pos === -1) {
        return str;
    } else {
        while (pos < str.length && pos > -1) {
            let _str = (pos > 0 ? str.slice(0, pos) : '') + (pos < str.length - 1 ? str.slice(pos + 1, str.length) : '');
            str = _str;
            while (pos < str.length && str[pos] === '\\') {
                pos++;
            };
            if (pos < str.length - 1) {
                pos = str.indexOf('\\', pos);
            }
        }
        return str;
    }
};

const proc = (str) => {
    let tks = [];
    let ptr = 0;
    while (ptr > -1 && ptr < str.length) {
        let next = next_sep(str, ptr);
        if (next.i === -1) {
            if (ptr <= str.length - 1) {
                tks.push(str.substr(ptr));
            }
            return tks;
        } else if (next.sep !== '"' && next.sep !== '\'') {
            tks.push(str.substr(ptr, next.i - ptr));
            ptr = next.i;
            while (ptr < str.length && (str[ptr] === ' ' || str[ptr] === '\t')) {
                ptr++;
            }
        } else {
            let qi = skip_spaces(str, next.i + 1, next.sep);
            if (qi > -1) {
                if (qi > next.i + 1) {
                    let tk = str.substr(next.i + 1, qi - next.i - 1);
                    tks.push(unescape(tk));
                }
                ptr = qi + 1;
            } else {
                if (next.i + 1 < str.length - 1) {
                    let tk = str.substr(next.i + 1);
                    tks.push(unescape(tk));
                }
                return tks;
            }
        }
    }
    return tks;
};

module.exports = {
    proc: proc
};