import {
	type ParseState,
	NodeType,
	FlowBlockNode,
	CharacterCodes,
	EmptyNodeBlock,
	FlowChild,
	ErrorMessages,
	Characters,
} from "../types.js";

import {
	checkpoint,
	clean,
	extract,
	grab,
	isEndOfFile,
	rewind,
	skipEscaped,
} from "../utilities/parser.js";

import { ParseError } from "../errors.js";

import { parseNode } from "./parseNode.js";

export const parseFlow = (
	state: ParseState,
): FlowBlockNode | EmptyNodeBlock => {
	const children: FlowChild[] = [];
	let nodeStart = checkpoint(state);

	const openIndex = nodeStart - 1;
	let closed = false;

	while (!isEndOfFile(state)) {
		const code = grab(state);

		if (code === CharacterCodes.Backslash) {
			skipEscaped(state);
			continue;
		}

		if (code === CharacterCodes.LessThan) {
			if (checkpoint(state) - 1 - nodeStart > 0) {
				children.push({
					type: NodeType.TEXT,
					content: clean(
						extract(state, nodeStart, checkpoint(state) - 1),
					),
				});
			}

			rewind(state);
			const node = parseNode(state);

			if (node !== null) {
				children.push(node);
			}

			nodeStart = checkpoint(state);
			continue;
		}

		if (code === CharacterCodes.CurlyBraceClose) {
			if (checkpoint(state) - 1 - nodeStart > 0) {
				children.push({
					type: NodeType.TEXT,
					content: clean(
						extract(state, nodeStart, checkpoint(state) - 1),
					),
				});
			}

			closed = true;
			break;
		}
	}

	if (!closed) {
		throw new ParseError({
			code: ErrorMessages.UNEXPECTED_END_OF_FILE,
			source: state.raw,
			index: openIndex,
			label: "unclosed flow block",
			hint: `flow block is missing its closing \`${Characters.CurlyBraceClose}\``,
		});
	}

	if (children.length === 0) {
		return {
			type: NodeType.EMPTY,
		};
	}

	return {
		type: NodeType.FLOW,
		children,
	};
};
