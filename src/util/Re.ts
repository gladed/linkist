export class Re {
    /** A standalone link ID like `^....^`. */
    public static linkId = /\^[A-Za-z0-9]{4,7}\^/g;
    /** A markdown-delimited link containing a link ID like `[text](^....^)`. */
    public static markdownLink = new RegExp(/\[[^\]]+\]\(/.source + Re.linkId.source + '\\)');
    /** Either a markdown-delimited link or a standalone link ID, globally matched. */
    public static anyLink = new RegExp('(' + Re.markdownLink.source + ')|(' + Re.linkId.source + ')', 'g');
}
