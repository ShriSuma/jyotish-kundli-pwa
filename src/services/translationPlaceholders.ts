const TOKEN = /\{\{([^{}]+)\}\}/g;
const MARKER = /⟦(\d+)⟧/g;

export type ProtectedText = {
  text: string;
  tokens: string[];
};

/** Replace i18n interpolation tokens so translators do not corrupt them. */
export const protectPlaceholders = (source: string): ProtectedText => {
  const tokens: string[] = [];
  const text = source.replace(TOKEN, (_, inner: string) => {
    const index = tokens.length;
    tokens.push(inner);
    return `⟦${index}⟧`;
  });
  return { text, tokens };
};

export const restorePlaceholders = (translated: string, tokens: string[]): string =>
  translated.replace(MARKER, (_, index: string) => {
    const token = tokens[Number(index)];
    return token !== undefined ? `{{${token}}}` : _;
  });
