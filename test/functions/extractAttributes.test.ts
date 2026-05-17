import { describe, expect, it } from "vitest";

import { extractAttributes } from "../../src/functions/extractAttributes";

describe("extractTag", () => {
    describe("basic attribute parsing", () => {
        it("parses a boolean attribute", () => {
            expect(extractAttributes("attribute")).toStrictEqual({
                "attribute": ""
            });
        });

        it("parses a valued attribute with double quotes", () => {
            expect(extractAttributes('key="value"')).toStrictEqual({
                "key": "value"
            });
        });

        it("parses a valued attribute with single quotes", () => {
            expect(extractAttributes("key='value'")).toStrictEqual({
                "key": "value"
            });
        });

        it("parses a valued attribute with single quotes", () => {
            expect(extractAttributes("key=`value`")).toStrictEqual({
                "key": "value"
            });
        });
    });
})