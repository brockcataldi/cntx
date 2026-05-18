export enum CharacterCodes {
	Tab = 9,
	LineFeed = 10,
	VerticalTab = 11,
	FormFeed = 12,
	CarriageReturn = 13,
	Space = 32,
	DoubleQuote = 34,
	NumberSign = 35,
	SingleQuote = 39,
	Hyphen = 45,
	Period = 46,
	LessThan = 60,
	Equals = 61,
	GreaterThan = 62,
	Backslash = 92,
	Backtick = 96,
}

export enum Characters {
	Tab = "\t",
	LineFeed = "\n",
	VerticalTab = "\v",
	FormFeed = "\f",
	CarriageReturn = "\r",
	Space = " ",
	DoubleQuote = '"',
	NumberSign = "#",
	SingleQuote = "'",
	Hyphen = "-",
	Period = ".",
	LessThan = "<",
	Equals = "=",
	GreaterThan = ">",
	Backslash = "\\",
	Backtick = "`",
}

export enum NodeType {
	DOCUMENT = "document",
	ELEMENT = "element",
	FLOW = "flow",
	TEXT = "text",
	LITERAL = "literal",
	EMPTY = "empty",
}

export enum ErrorMessages {
	UNEXPECTED_CHARACTER = "Unexpected character",
	MISSING_TAG_CLOSE = "Missing Tag Close",
	MISSING_TAG = "Missing tag",
	EMPTY_ID = "Empty ID",
	EMPTY_CLASS = "Empty Class",
	MULTIPLE_IDS = "Multiple IDs",
	EQUALS_ATTRIBUTE = "Equals cannot be an attribute",
	MISSING_ATTRIBUTE_OPEN = "Quote must follow equals",
}
export type ParseState = {
	raw: string;
	cursor: number;
};

export type TextBlockNode = {
	type: NodeType.TEXT;
	content: string;
};

export type Quote = '"' | "'" | "`";
export type FlowChild = ElementNode | TextBlockNode;

export type FlowBlockNode = {
	type: NodeType.FLOW;
	quote: Quote;
	children: FlowChild[];
};

export type LiteralBlockNode = {
	type: NodeType.LITERAL;
	quote: Quote;
	content: string;
};

export type EmptyNodeBlock = {
	type: NodeType.EMPTY;
};

export type DocumentNode = {
	type: NodeType.DOCUMENT;
	children: ElementNode[];
};

export type Tag = {
	tag: string;
	attributes: Record<string, string>;
};

export type BlockNode = FlowBlockNode | LiteralBlockNode | EmptyNodeBlock;

export type ElementNode = {
	type: NodeType.ELEMENT;
	tag: Tag;
	block: FlowBlockNode | LiteralBlockNode | EmptyNodeBlock;
};
