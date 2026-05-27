import { ErrorMessages } from "./types.js";

export type ParseErrorOptions = {
	code: ErrorMessages;
	source: string;
	index: number;
	length?: number | undefined;
	hint?: string | undefined;
	label?: string | undefined;
};

export type SourceLocation = {
	line: number;
	column: number;
};

const TAB_WIDTH = 4;
const MAX_LINE_DISPLAY_WIDTH = 200;

export class ParseError extends Error {
	public readonly code: ErrorMessages;
	public readonly source: string;
	public readonly index: number;
	public readonly length: number;
	public readonly line: number;
	public readonly column: number;
	public readonly hint: string | undefined;
	public readonly label: string | undefined;

	constructor(options: ParseErrorOptions) {
		const source = options.source;
		const index = clamp(options.index, 0, source.length);
		const length = Math.max(1, options.length ?? 1);
		const { line, column } = locate(source, index);

		super(
			formatMessage({
				code: options.code,
				source,
				index,
				length,
				line,
				column,
				hint: options.hint,
				label: options.label,
			}),
		);

		this.name = "ParseError";
		this.code = options.code;
		this.source = source;
		this.index = index;
		this.length = length;
		this.line = line;
		this.column = column;
		this.hint = options.hint;
		this.label = options.label;
	}
}

export const isParseError = (value: unknown): value is ParseError => {
	return value instanceof ParseError;
};

export const reposition = (
	error: ParseError,
	overrides: {
		source?: string;
		index?: number;
		length?: number;
		hint?: string;
		label?: string;
	},
): ParseError => {
	return new ParseError({
		code: error.code,
		source: overrides.source ?? error.source,
		index: overrides.index ?? error.index,
		length: overrides.length ?? error.length,
		hint: overrides.hint ?? error.hint,
		label: overrides.label ?? error.label,
	});
};

const clamp = (value: number, min: number, max: number): number => {
	if (value < min) return min;
	if (value > max) return max;
	return value;
};

export const locate = (source: string, index: number): SourceLocation => {
	let line = 1;
	let lineStart = 0;

	for (let i = 0; i < index; i++) {
		if (source.charCodeAt(i) === 10) {
			line++;
			lineStart = i + 1;
		}
	}

	return { line, column: index - lineStart + 1 };
};

const lineBounds = (
	source: string,
	index: number,
): { start: number; end: number } => {
	let start = index;
	while (start > 0 && source.charCodeAt(start - 1) !== 10) {
		start--;
	}

	let end = index;
	while (end < source.length && source.charCodeAt(end) !== 10) {
		end++;
	}

	return { start, end };
};

const expandTabs = (line: string): { text: string; widths: number[] } => {
	let text = "";
	const widths: number[] = [];

	for (let i = 0; i < line.length; i++) {
		const code = line.charCodeAt(i);

		if (code === 9) {
			const spaces = TAB_WIDTH - (text.length % TAB_WIDTH);
			text += " ".repeat(spaces);
			widths.push(spaces);
			continue;
		}

		text += line[i];
		widths.push(1);
	}

	return { text, widths };
};

const displayColumn = (widths: number[], column: number): number => {
	let display = 0;

	for (let i = 0; i < column - 1 && i < widths.length; i++) {
		display += widths[i] ?? 1;
	}

	return display;
};

const displaySpan = (
	widths: number[],
	column: number,
	length: number,
): number => {
	const start = column - 1;
	const end = Math.min(widths.length, start + length);

	let span = 0;
	for (let i = start; i < end; i++) {
		span += widths[i] ?? 1;
	}

	return Math.max(1, span);
};

type FormatOptions = {
	code: ErrorMessages;
	source: string;
	index: number;
	length: number;
	line: number;
	column: number;
	hint: string | undefined;
	label: string | undefined;
};

const formatMessage = (options: FormatOptions): string => {
	const { code, source, index, length, line, column, hint, label } = options;

	if (source.length === 0) {
		const lines = [`error: ${code}`];
		if (hint) lines.push(`  = help: ${hint}`);
		return lines.join("\n");
	}

	const bounds = lineBounds(source, index);
	const rawLine = source.slice(bounds.start, bounds.end);
	const { text, widths } = expandTabs(rawLine);

	const displayLine =
		text.length > MAX_LINE_DISPLAY_WIDTH
			? text.slice(0, MAX_LINE_DISPLAY_WIDTH) + "..."
			: text;

	const gutterWidth = String(line).length;
	const gutterPad = " ".repeat(gutterWidth);

	const caretOffset = displayColumn(widths, column);
	const caretLength = displaySpan(widths, column, length);
	const caretPad = " ".repeat(caretOffset);
	const carets = "^".repeat(caretLength);
	const caretLabel = label ? ` ${label}` : "";

	const lines = [
		`error: ${code}`,
		`${gutterPad} --> ${line}:${column}`,
		`${gutterPad} |`,
		`${line} | ${displayLine}`,
		`${gutterPad} | ${caretPad}${carets}${caretLabel}`,
	];

	if (hint) {
		lines.push(`${gutterPad} |`);
		lines.push(`${gutterPad} = help: ${hint}`);
	}

	return lines.join("\n");
};
