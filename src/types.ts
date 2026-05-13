export type ParseState = {
	raw: string;
	cursor: number;
};

export enum NodeType {
	DOCUMENT = "document",
	ELEMENT = "element",
	FLOW = "flow",
	TEXT = "text",
	LITERAL = "literal",
	EMPTY = "empty",
}

export type TextBlockNode = {
	type: NodeType.TEXT;
	content: string;
};

export type FlowQuote = '"' | "'" | "`";
export type FlowChild = ElementNode | TextBlockNode;

export type FlowBlockNode = {
	type: NodeType.FLOW;
	quote: FlowQuote;
	children: FlowChild[];
};

export type LiteralFence = '"""' | "'''" | "```";
export type LiteralBlockNode = {
	type: NodeType.LITERAL;
	fence: LiteralFence;
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

export type ElementNode = {
	type: NodeType.ELEMENT;
	tag: Tag;
	block: FlowBlockNode | LiteralBlockNode | EmptyNodeBlock;
};
