
/** Encoding alphabet for link IDs. */
const alphabet = 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv';

/**
 * A link identifier encoding a date and an ordinal into a short, random-looking string.
 */
export class LinkId {
    private constructor(
        /** Text representing the link, e.g. "iwy3" */
        public readonly text: string,
        /** Date of originally creation. */
        public readonly date: Date,
        /** Numeric offset within date. */
        public readonly ordinal: number
    ) { }

    /**
     * Given a text like "iwy3", return the corresponding {@link LinkId}.
     *
     * @param ordinal Numeric offset within the date (0-99).
     * @param date Date to encode in the link (default: today).
     */
    static decode(text: string): LinkId {
        const decoded = LinkId.decodeToInt(text);
        const ordinal = decoded % 100;
        const date = new Date((Math.floor(decoded / 100)) * 24 * 60 * 60 * 1000);
        return new LinkId(text, date, ordinal);
    }

    private static decodeToInt(text: string) {
        let digits: number[] = [];
        let lastDigit = 7;
        for (var i = 0; i < text.length; i++) {
            digits.unshift((alphabet.indexOf(text.charAt(i)) - lastDigit +
                alphabet.length) % alphabet.length);
            lastDigit = (lastDigit + digits[0]) % alphabet.length;
        }
        for (var value = 0; digits.length !== 0; value = value * alphabet.length + digits.shift()!) { }
        return value;
    }

    /**
     * Return a generated {@link LinkId}.
     *
     * @param ordinal Numeric offset within the date (0-99).
     * @param date Date to encode in the link (default: today).
     */
    static create(ordinal: number, date: Date = new Date()) {
        const days = Math.floor(date.getTime() / 8.64e7);
        return new LinkId(LinkId.endcodeToString(days * 100 + ordinal), date, ordinal);
    }

    private static endcodeToString(value: number) {
        let lastDigit = 7;
        let linkId = "";
        while (value !== 0) {
            let digit = value % alphabet.length;
            linkId = linkId + alphabet[(digit + lastDigit) % alphabet.length];
            lastDigit += digit;
            value = Math.floor(value / alphabet.length);
        }
        return linkId;
    }
}