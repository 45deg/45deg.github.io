// Offsets use UTF-16, matching DOM Range and textarea selection positions.
export function createTextBoundaries() {
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  let cachedText = null;
  let characters = [];
  let paragraphs = null;

  function characterBoundaries(text) {
    if (cachedText !== text) {
      cachedText = text;
      characters = [...segmenter.segment(text)].map(part => part.index);
      characters.push(text.length);
      paragraphs = null;
    }
    return characters;
  }

  function paragraphBoundaries(text) {
    characterBoundaries(text);
    if (paragraphs) return paragraphs;
    // Blank lines delimit paragraphs; a single CRLF is one newline.
    const pattern = /(?:\r\n|\r(?!\n)|(?<!\r)\n)(?:[^\S\r\n]*(?:\r\n|\r(?!\n)|(?<!\r)\n))+/g;
    const points = [0, text.length];
    for (const match of text.matchAll(pattern)) {
      points.push(match.index + match[0].length);
    }
    paragraphs = [...new Set(points)].sort((a, b) => a - b);
    return paragraphs;
  }

  function nearest(text, at) {
    return characterBoundaries(text).reduce(
      (best, pos) => Math.abs(pos - at) < Math.abs(best - at) ? pos : best, 0,
    );
  }

  function adjacentParagraph(text, at, direction) {
    const points = paragraphBoundaries(text);
    return direction < 0
      ? points.findLast(pos => pos < at) ?? at
      : points.find(pos => pos > at) ?? at;
  }

  return { characterBoundaries, paragraphBoundaries, nearest, adjacentParagraph };
}

export function orderedRange(start, end) {
  return [Math.min(start, end), Math.max(start, end)];
}
