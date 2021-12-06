
/** Encoding alphabet for link IDs. Avoids ambiguous chars (lL1I0Oo). */
const alphabet = 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv';

/**
 * A link identifier encoding a date and an ordinal into a short, random-looking
 * string, e.g. 'iWy3'
 */
export class LinkId {
    private constructor(
        /** Text representing the link. */
        public readonly text: string,
        /** Date of original creation. */
        public readonly date: Date,
        /** Numeric offset within date. */
        public readonly ordinal: number
    ) { }

    /**
     * Given a text like "iWy3", return the corresponding {@link LinkId}.
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

    /**
     * Return a generated {@link LinkId}.
     *
     * @param ordinal Numeric offset within the date (0-99). Greater than 99 spills into date+1.
     * @param date Date to encode in the link (default: today).
     */
    static encode(ordinal: number, date: Date = new Date()) {
        const days = Math.floor(date.getTime() / 8.64e7);
        return new LinkId(LinkId.endcodeToString(days * 100 + ordinal), date, ordinal);
    }

    private static decodeToInt(text: string) {
        const digits: number[] = [];
        let lastDigit = 7;
        for (let i = 0; i < text.length; i++) {
            digits.unshift((alphabet.indexOf(text.charAt(i)) - lastDigit +
                alphabet.length) % alphabet.length);
            lastDigit = (lastDigit + digits[0]) % alphabet.length;
        }
        let value;
        for (value = 0;
             digits.length !== 0;
             value = value * alphabet.length + digits.shift()!) { // eslint-disable-line @typescript-eslint/no-non-null-assertion
            // Empty loop
            true;
        }
        return value;
    }


    private static endcodeToString(value: number) {
        let lastDigit = 7;
        let linkId = "";
        while (value !== 0) {
            const digit = value % alphabet.length;
            linkId = linkId + alphabet[(digit + lastDigit) % alphabet.length];
            lastDigit += digit;
            value = Math.floor(value / alphabet.length);
        }
        return linkId;
    }

    public equals(other: LinkId): boolean {
        return this.text === other.text;
    }

    public toString(): string {
        return this.text + "/" + this.date.toISOString().slice(0, 10) + "#" + this.ordinal;
    }
}
