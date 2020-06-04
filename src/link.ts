
const alphabet = 'j6EpuN2TkFbJBVSCfhnarZ95W8KARmwUytiqQgcYxsX3D7dM4ePGzHv';

export interface LinkInfo {
    id: string;
    date: Date;        
    ordinal: number;
}

export class Link {    
    private constructor(
        public readonly id: string,
        public readonly date: Date,
        public readonly ordinal: number
    ) { }

    private static decodeToInt(id: string) {
        let digits: number[] = [];
        let lastDigit = 7;
        for (var i = 0; i < id.length; i++) {
            digits.unshift((alphabet.indexOf(id.charAt(i)) - lastDigit +
                alphabet.length) % alphabet.length);
            lastDigit = (lastDigit + digits[0]) % alphabet.length;
        }
        for (var value = 0; digits.length !== 0; value = value * alphabet.length + digits.shift()!) { }
        return value;
    }
  
    static decode(id: string): Link {
        const decoded = Link.decodeToInt(id);
        const ordinal = decoded % 100;
        const date = new Date((Math.floor(decoded / 100) + 1) * 24 * 60 * 60 * 1000);
        return new Link(id, date, ordinal);
    }
    
    private static encodeToId(value: number) {
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

    static create(ordinal: number, date: Date = new Date()) {
        const days = Math.floor(date.getTime() / 8.64e7) - 1;        
        return new Link(Link.encodeToId(days * 100 + ordinal), date, ordinal);
    }
}