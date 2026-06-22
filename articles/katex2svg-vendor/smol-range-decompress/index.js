/**
 * Decompress a previously-compressed set of non-negative integers back into a set of inclusive ranges.
 *
 * @param data The data to decompress. This can be either a {@link Uint8Array} or a base64-encoded string.
 * @param onRange Callback that will be called with every decoded range.
 */
export const decompress = (data, onRange) => {
    const getByte = typeof data == 'string' ?
        (data = atob(data), (i) => (data.charCodeAt(i) || 0)) :
        (i) => data[i] ?? 0;
    const readBits = (bitOffset) => {
        const byteOffset = bitOffset >>> 3;
        const shift = bitOffset & 7;
        let word = ((getByte(byteOffset) << 24) |
            (getByte(byteOffset + 1) << 16) |
            (getByte(byteOffset + 2) << 8) |
            getByte(byteOffset + 3));
        if (shift) {
            word = (word << shift) | ((getByte(byteOffset + 4)) >>> (8 - shift));
        }
        return word >>> 0;
    };
    const bitLength = data.length << 3;
    let bitOffset = 0;
    let pos = 0;
    // This is conceptually null or non-null. We reserve 0 as the "nullish" value since it's falsy and a number. Since a
    // run may legitimately start at position 0, we add 1 when decoding and subtract 1 when emitting.
    let currentRunStart = 0;
    let symbolIsOne = false;
    const endRange = () => {
        if (currentRunStart) {
            onRange(currentRunStart - 1, pos - 1);
            currentRunStart = 0;
        }
    };
    // Elias gamma decoding: there are log2(n) leading zeroes, followed by n (which is log2(n) + 1 bits long)
    let leadingZeros;
    while ((leadingZeros = Math.clz32(readBits(bitOffset))) < bitLength - bitOffset) {
        const dist = readBits(bitOffset + leadingZeros) >>> (31 - leadingZeros);
        bitOffset += (leadingZeros * 2) + 1;
        if (dist > 1) {
            if (symbolIsOne) {
                if (!currentRunStart)
                    currentRunStart = pos + 1;
            }
            else {
                endRange();
            }
            pos += dist - 1;
        }
        if (!symbolIsOne) {
            if (!currentRunStart)
                currentRunStart = pos + 1;
        }
        else {
            endRange();
        }
        pos++;
        // Toggle symbolIsOne when dist == 1
        symbolIsOne = (symbolIsOne != (dist == 1));
    }
    endRange();
};
