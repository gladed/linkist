/** Convert whatever text into a string containing only words in camelCase. */
export function camelize(text: string) {
    let count = 0;
    return text.replace(/[\u00BF-\u1FFF\u2C00-\uD7FF\w]+/g, word => {
        return (count++ === 0 ? word[0].toLowerCase() : word[0].toUpperCase()) + word.slice(1);
    }).replace(/[^\u00BF-\u1FFF\u2C00-\uD7FF\w]+/g, '');
}