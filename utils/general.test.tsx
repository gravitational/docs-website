import { toCopyContent } from "./general";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";

describe("toCopyContent", () => {
  test("concatenates content as newslines", () => {
    render(
      <div className={"hljs"}>
        <span>This is some text.</span>
        <span>This is more text.</span>
        <span>This is even more text.</span>
      </div>,
    );
    const hljsDiv = screen.getByTestId("hljsDiv");
    const expected = `This is some text.
This is more text.
This is even more text.`;

    const actual = toCopyContent(hljsDiv, ["hljs"]);
    expect(actual).toEqual(expected);
  });
});
