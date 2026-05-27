import {
	type ParseState,
	NodeType,
	LiteralBlockNode,
	CharacterCodes,
	ErrorMessages,
} from "../types.js";

import {
	checkpoint,
	clean,
	extract,
	grab,
	isEndOfFile,
	skipEscaped,
} from "../utilities/parser.js";

import { ParseError } from "../errors.js";

export const parseFence = (state: ParseState): LiteralBlockNode => {
	let start = checkpoint(state);

	const fenceStart = start - 3;
	let closeCount = 0;

	while (!isEndOfFile(state)) {
		const code = grab(state);

		if (code === CharacterCodes.Backslash) {
			skipEscaped(state);
			closeCount = 0;
			continue;
		}

		if (code === CharacterCodes.CurlyBraceClose) {
			closeCount++;

			if (closeCount === 3) {
				return {
					type: NodeType.LITERAL,
					content: clean(
						extract(state, start, checkpoint(state) - 3),
					),
				};
			}

			continue;
		}

		closeCount = 0;
	}

	throw new ParseError({
		code: ErrorMessages.UNEXPECTED_END_OF_FILE,
		source: state.raw,
		index: fenceStart,
		length: 3,
		label: "unclosed literal fence",
		hint: `literal block is missing its closing }}} fence`,
	});
};
