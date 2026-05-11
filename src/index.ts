export type Token =
  | {
      type: "tag";
      tag: string;
      attributes: Record<string, string>;
    }
  | {
      type: "open";
      escape: boolean;
    }
  | {
      type: "close";
      escape: boolean;
    }
  | {
      type: "text";
      content: string;
    };

enum TokenizerState {
  TAG = "tag",
  AFTER_TAG = "after-tag",
}

export const tokenize = (raw: string): Token[] => {
  const tokens: Token[] = [];

  let state = "tag";
  let i = 0;

  while (i < raw.length) {
    switch (state) {
      case TokenizerState.TAG:
        if (raw[i] === "<") {
          const [end, content] = getRawTag(raw, i + 1);

          if (end === -1) {
            throw new Error("Couldn't find end of tag");
          }

          tokens.push({
            type: "tag",
            tag: "p",
            attributes: {},
          });

          state = TokenizerState.AFTER_TAG;
        }
        break;
      default:
        break;
    }
    i++;
  }

  return tokens;
};

const getRawTag = (raw: string, start: number) => {
  let content = "";

  for (let i = start; i < raw.length; i++) {
    const char = raw[i];

    if (char !== ">") {
      content += char;
      continue;
    }

    return [i + 1, content];
  }

  return [-1, ""];
};

const getTag = (raw: string) => {



}