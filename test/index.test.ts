import { describe, expect, it } from "vitest";

import { tokenize } from "../src/index.js";

describe("tokenize", () => {
  it("simple p tag", () => {
    expect(tokenize(`<p>"Hello World"`)).toBe([
      {
        type: "tag",
        tag: "p",
        attributes: {},
      },
      {
        type: "open",
        escape: true,
      },
      {
        type: "text",
        content: "Hello World",
      },
      {
        type: "close",
        escape: true,
      },
    ]);
  });
});
