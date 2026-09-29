import { describe, expect, it } from "vitest";
import { isValidElement } from "react";
import { jsx, jsxs } from "./jsx-runtime-shim";

describe("automatic JSX runtime shim", () => {
  it("keeps an automatic-runtime key out of the rendered children", () => {
    const element = jsx("p", { children: "The answer is visible." }, "message-1");

    expect(isValidElement(element)).toBe(true);
    expect(element.key).toBe("message-1");
    expect(element.props.children).toBe("The answer is visible.");
  });

  it("preserves multiple children and the key", () => {
    const element = jsxs("p", { children: ["Research ", "answer"] }, "answer-1");

    expect(element.key).toBe("answer-1");
    expect(element.props.children).toEqual(["Research ", "answer"]);
  });
});
