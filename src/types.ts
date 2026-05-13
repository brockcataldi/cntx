export type TagToken = {
	type: "tag";
	tag: string;
	attributes: Record<string, string>;
};

export type Token =
	| TagToken
	| {
			type: "open";
	  }
	| {
			type: "close";
	  }
	| {
			type: "text";
			content: string;
	  }
	| {
			type: "literal-open";
	  }
	| {
			type: "literal-close";
	  };

export enum TokenizerState {
	TAG = "tag",
	AFTER_TAG = "after-tag", // looking for either a tag or open
	OPEN = "open",
	AFTER_OPEN = "after-open", // looking for either a tag or close,
	TEXT = "text",
	CLOSE = "close", // looking for a tag
	UNESCAPED_OPEN = "unescaped-open", // doesn't look for tags, just looks for """, I might make it """"
	UNESCAPED_CLOSE = "unescaped-close",
}
