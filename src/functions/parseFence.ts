import {
	type ParseState,
	NodeType,
	Quote,
	LiteralBlockNode,
    ErrorMessages,
} from "../types.js";

import { checkpoint, extract, grab, isEndOfFile } from "../utilities.js";

export const parseFence = (
	state: ParseState,
	quote: number,
): LiteralBlockNode => {

    let start = checkpoint(state);
    let count = 0;
    let last = false;

    while(!isEndOfFile(state)){
        const code = grab(state);

        if(code === quote){
            if(last === false && count === 0){
                last = true;
            }

            if(last === true && count + 1 === 3){
                return {
                    type: NodeType.LITERAL,
                    quote: String.fromCharCode(quote) as Quote,
                    content: extract(state, start, checkpoint(state) - 3),
                };
            }

            count++;
            continue;
        }

        last = false;
        count = 0;
    }

    throw new Error(ErrorMessages.UNEXPECTED_END_OF_FILE);
};
