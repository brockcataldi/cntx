import {
	type ParseState,
	NodeType,
	Quote,
	LiteralBlockNode,
	CharacterCodes,
	ErrorMessages,
} from "../types.js";

import {
	checkpoint,
	decodeEscaped,
	extract,
	grab,
	isEndOfFile,
	skipEscapeSequence,
} from "../utilities/parser.js";

import { ParseError } from "../errors.js";

export const parseFence = (
	state: ParseState,
	quote: number,
): LiteralBlockNode => {
	let start = checkpoint(state);
	const fenceStart = start - 3;
	let count = 0;
	let last = false;

	while (!isEndOfFile(state)) {
		const code = grab(state);

		if (code === CharacterCodes.Backslash) {
			skipEscapeSequence(state, quote);
			continue;
		}

		if (code === quote) {
			if (last === false && count === 0) {
				last = true;
			}

			if (last === true && count + 1 === 3) {
				return {
					type: NodeType.LITERAL,
					quote: String.fromCharCode(quote) as Quote,
					content: decodeEscaped(
						extract(state, start, checkpoint(state) - 3),
						quote,
					),
				};
			}

			count++;
			continue;
		}

		last = false;
		count = 0;
	}

	const fenceChar = String.fromCharCode(quote);

	throw new ParseError({
		code: ErrorMessages.UNEXPECTED_END_OF_FILE,
		source: state.raw,
		index: fenceStart,
		length: 3,
		label: "unclosed literal fence",
		hint: `literal block is missing its closing \`${fenceChar.repeat(3)}\` fence`,
	});
};
