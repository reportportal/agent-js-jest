// https://www.npmjs.com/package/ansi-regex
function ansiRegex({ onlyFirst = false } = {}) {
    const pattern = [
        // eslint-disable-next-line max-len
        '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
        '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
    ].join('|');

    return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

// https://www.npmjs.com/package/strip-ansi
function stripAnsi(string) {
    if (typeof string !== 'string') {
        throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
    }

    return string.replace(ansiRegex(), '');
}

module.exports = {
    stripAnsi,
};
