const cn = (...tokens: (string | false | null | undefined)[]): string =>
  tokens.filter(Boolean).join(' ');

export default cn;
