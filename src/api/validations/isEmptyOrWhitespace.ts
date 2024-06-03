export default function isEmptyOrWhitespace(str: string) {
    return !str || !str.trim();
}