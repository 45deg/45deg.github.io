export const DOCUMENT_KEY = 'shirす.text.v3';
export const FONT_KEY = 'shirす.font-size';

function documentText(data) {
  if (typeof data?.text !== 'string') throw new Error('Invalid document');
  return data.text;
}

// Read legacy data without modifying or removing any old keys.
// Errors propagate so the UI can block accidental overwrites.
export function loadDocument(storage) {
  const saved = storage.getItem(DOCUMENT_KEY);
  if (saved !== null) return documentText(JSON.parse(saved));

  const rawLibrary = storage.getItem('shirす.library.v2');
  if (rawLibrary !== null) {
    const library = JSON.parse(rawLibrary);
    const current = library.documents.find(doc => doc.id === library.currentId)
      || library.documents[0];
    return documentText(current);
  }

  const legacy = JSON.parse(storage.getItem('shirす.document.v1'));
  return legacy === null ? '' : documentText(legacy);
}

export function saveDocument(storage, text) {
  storage.setItem(DOCUMENT_KEY, JSON.stringify({ text }));
}

export function loadFontSize(storage) {
  const value = Number(storage.getItem(FONT_KEY));
  return Number.isInteger(value) && value >= 14 && value <= 28 ? value : 18;
}
