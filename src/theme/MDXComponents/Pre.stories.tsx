import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import { default as Pre } from "./Pre";
import { replaceClipboardWithCopyBuffer } from "/src/utils/clipboard";
import { Var } from "/src/components/Variables/Var";
import { VarsProvider } from "/src/components/Variables/context";
import { collectGtagCalls } from "/src/utils/gtag";

export const SimplePre = () => (
  <Pre gtag={collectGtagCalls()}>
    <code className="hljs language-yaml">
      <span className="hljs-attr">key1:</span>{" "}
      <span className="hljs-string">value</span>
      {"\n"}
      <span className="hljs-attr">key2:</span>{" "}
      <span className="hljs-string">value</span>
      {"\n"}
      <span className="hljs-attr">key3:</span>
      {"\n "}
      <span className="hljs-bullet">-</span>{" "}
      <span className="hljs-string">value</span>
      {"\n "}
      <span className="hljs-bullet">-</span>{" "}
      <span className="hljs-string">value2</span>
      {"\n "}
      <span className="hljs-bullet">-</span>{" "}
      <span className="hljs-string">value3</span>
    </code>
  </Pre>
);

const meta: Meta<typeof Pre> = {
  title: "components/MDX/Pre",
  component: SimplePre,
};
export default meta;
type Story = StoryObj<typeof Pre>;

export const CopySimplePre: Story = {
  render: () => {
    return <SimplePre />;
  },
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();
    const canvas = within(canvasElement);

    await step("Copy the content", async () => {
      await userEvent.hover(canvas.getByText("value3"));
      await userEvent.click(canvas.getByTestId("copy-button-all"));
      expect(navigator.clipboard.readText()).toEqual(
        `key1: value
key2: value
key3:
 - value
 - value2
 - value3`,
      );
    });
  },
};

export const CopyVarInPre: Story = {
  render: () => {
    return (
      <VarsProvider>
        <Pre gtag={collectGtagCalls()}>
          <code className="hljs language-yaml">
            <span className="hljs-attr">key1:</span>{" "}
            <span className="hljs-string">value</span>
            {"\n"}
            <span className="hljs-attr">key2:</span> <Var name="value" />
            {"\n"}
            <span className="hljs-attr">key3:</span>
            {"\n "}
            <span className="hljs-bullet">-</span>{" "}
            <span className="hljs-string">value</span>
            {"\n "}
            <span className="hljs-bullet">-</span>{" "}
            <span className="hljs-string">value2</span>
            {"\n "}
            <span className="hljs-bullet">-</span>{" "}
            <span className="hljs-string">value3</span>
          </code>
        </Pre>
      </VarsProvider>
    );
  },
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();
    const canvas = within(canvasElement);

    await step("Enter a variable value", async () => {
      await userEvent.type(canvas.getByTestId("var-input"), "my-value");
    });

    await step("Copy the content", async () => {
      await userEvent.hover(canvas.getByText("value3"));
      await userEvent.click(canvas.getByTestId("copy-button-all"));
      expect(navigator.clipboard.readText()).toEqual(
        `key1: value
key2: my-value
key3:
 - value
 - value2
 - value3`,
      );
      expect(window.gtagCalls).toHaveLength(1);
      expect(window.gtagCalls[0].params).toEqual({
        label: "yaml",
        // Snippet-level copy button, rather than the copy button for a code
        // line
        scope: "snippet",
      });
    });
  },
};
