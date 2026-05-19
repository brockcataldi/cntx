import {
	type ParseState,
	Tag,
	ErrorMessages,
	CharacterCodes,
} from "../types.js";

import {
	checkpoint,
	peek,
	peekCode,
	fastForward,
} from "../utilities.js";

import { extractTag } from "./extractTag.js";
import { extractAttributes } from "./extractAttributes.js";
import { findTagEnd } from "./findTagEnd.js";

export const parseTag = (state: ParseState): Tag => {
    const next = peekCode(state);

    if (next !== CharacterCodes.LessThan) {
        throw new Error(ErrorMessages.UNEXPECTED_CHARACTER);
    }

    fastForward(state, 1);

    const end = findTagEnd(state);

    if (end === -1) {
        throw new Error(ErrorMessages.MISSING_TAG_CLOSE);
    }

    const diff = end - checkpoint(state);

    const data = peek(state, diff);

    const [tag, leftover, extractedTagAttributes] = extractTag(data);
    const extractedAttributes = extractAttributes(leftover);

    if ("id" in extractedTagAttributes && "id" in extractedAttributes) {
        throw new Error(ErrorMessages.MULTIPLE_IDS);
    }

    const attributes: Record<string, string> = {
        ...extractedAttributes,
        ...extractedTagAttributes,
    };

    const classAttributes = [];

    if ("class" in extractedTagAttributes) {
        classAttributes.push(extractedTagAttributes.class);
    }

    if ("class" in extractedAttributes) {
        classAttributes.push(extractedAttributes.class);
    }

    const classes = classAttributes.join(" ");

    if (classes !== "") {
        attributes.class = classes;
    }

    fastForward(state, diff + 1);

    return {
        tag,
        attributes,
    };
};