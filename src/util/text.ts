
/** Convert whatever text into a string containing only words in camelCase. */
export function camelize(text: string) {
    let count = 0;
    return text
        .replace(/'/, '') // Don't word-break on single quotes
        .replace(/[\u00BF-\u1FFF\u2C00-\uD7FF\w]+/g, word => {
            return (count++ === 0 ? word[0].toLowerCase() : word[0].toUpperCase()) + word.slice(1).toLowerCase();
        })
        .replace(/[^\u00BF-\u1FFF\u2C00-\uD7FF\w]+/g, '');
}

/** Convert any number of words into Title Case. */
export function titleCase(text: string) {
    return text.split(/\s+/)
        .map((word) => word.length ? word[0].toUpperCase() + word.substr(1) : '')
        .join(' ');
}
