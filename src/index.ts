import { type Token, TokenizerState } from "./types.js";
import { parseTag } from "./parseTag.js";

export const tokenize = (raw: string): Token[] => {
	const tokens: Token[] = [];

	let state = TokenizerState.TAG;
	let i = 0;

	while (i < raw.length) {
		switch (state) {
			case TokenizerState.TAG:
				if (raw[i] === "<") {
					const [end, content] = getRawTag(raw, i + 1);

					if (end === -1) {
						throw new Error("Couldn't find end of tag");
					}

					if (content === undefined) {
						throw new Error("Couldn't find end of tag");
					}

					const tag = parseTag(content);

					if (tag === null) {
						throw new Error("Tag Invalid");
					}

					tokens.push(tag);

					state = TokenizerState.AFTER_TAG;
					i = end;
					continue;
				}

				break;

			default:
				break;
		}
		i++;
	}

	return tokens;
};

const getRawTag = (
	raw: string,
	start: number,
): [number, string] | [-1, undefined] => {
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

// I like the idea of single quotes in the tag to match html
// Idk how I feel about quoteless attributes?

