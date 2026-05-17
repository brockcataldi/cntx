import { CharacterCodes, firstWhitespaceIndex } from "../utilities.js";

export enum ExtractTagStates {
	TAG = 0,
	ID = 1,
	CLASS = 2,
}

export const extractTag = (
	raw: string,
): [string, string, Record<string, string>] => {
	raw = raw.trim();

	if (!raw) {
		throw new Error("Missing tag");
	}

	const firstChar = raw.charCodeAt(0);

	if (
		firstChar === CharacterCodes.NumberSign ||
		firstChar === CharacterCodes.Period
	) {
		throw new Error("Missing tag");
	}

	const firstSpace = firstWhitespaceIndex(raw);

	let buffer = raw;
	let leftover = "";

	if (firstSpace !== -1) {
		buffer = raw.slice(0, firstSpace);
		leftover = raw.slice(firstSpace + 1).trimStart();
	}

	let state = ExtractTagStates.TAG;
	let id: string | undefined = undefined;
	let classes: string[] = [];
	let tokenCursor = 0;
	let tagEnd = buffer.length;

	const setId = (start: number, end: number) => {
		if (start === end) {
			throw new Error("Empty ID");
		}

		if (id !== undefined) {
			throw new Error("Multiple IDs");
		}

		id = buffer.slice(start, end);
	};

	const appendClass = (start: number, end: number) => {
		if (start === end) {
			throw new Error("Empty Class");
		}

		classes.push(buffer.slice(start, end));
	};

	for (let i = 0; i < buffer.length; i++) {
		const code = buffer.charCodeAt(i);

		switch (state) {

			case ExtractTagStates.TAG:
				if (code === CharacterCodes.NumberSign) {
					tagEnd = i;
					tokenCursor = i + 1;
					state = ExtractTagStates.ID;
					continue;
				}

				if (code === CharacterCodes.Period) {
					tagEnd = i;
					tokenCursor = i + 1;
					state = ExtractTagStates.CLASS;
					continue;
				}
				continue;

			case ExtractTagStates.ID:
				if (code === CharacterCodes.Period) {
					setId(tokenCursor, i);
					tokenCursor = i + 1;
					state = ExtractTagStates.CLASS;
					continue;
				}

				if (code === CharacterCodes.NumberSign) {
					throw new Error("Multiple IDs");
				}

				continue;
			case ExtractTagStates.CLASS:
				if (code === CharacterCodes.Period) {
					appendClass(tokenCursor, i);
					tokenCursor = i + 1;
					continue;
				}

				if (code === CharacterCodes.NumberSign) {
					appendClass(tokenCursor, i);
					tokenCursor = i + 1;
					state = ExtractTagStates.ID;
					continue;
				}
				continue;
		}
	}

	if (state === ExtractTagStates.ID) {
		setId(tokenCursor, buffer.length);
	}

	if (state === ExtractTagStates.CLASS) {
		appendClass(tokenCursor, buffer.length);
	}

	const attributes: Record<string, string> = {};

	if (id !== undefined) {
		attributes.id = id;
	}

	if (classes.length > 0) {
		attributes.class = classes.join(" ");
	}

	return [buffer.slice(0, tagEnd), leftover, attributes];
};
