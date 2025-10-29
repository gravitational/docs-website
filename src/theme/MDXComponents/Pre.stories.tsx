import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import { default as Pre } from "./Pre";
import { replaceClipboardWithCopyBuffer } from "/src/utils/clipboard";
import { Var } from "/src/components/Variables/Var";
import { VarsProvider } from "/src/components/Variables/context";
import { PositionProvider } from "/src/components/PositionProvider";
import { collectEvents } from "/src/utils/analytics";

export const SimplePre = () => (
  <Pre emitEvent={collectEvents()}>
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
        <Pre emitEvent={collectEvents()}>
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
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
      	event: "code_copy_button",
        label: "yaml",
        // Snippet-level copy button, rather than the copy button for a code
        // line
        scope: "snippet",
      });
    });
  },
};

export const CopyVarWithThreePres: Story = {
  render: () => {
    return (
      <PositionProvider>
        <VarsProvider>
          <Pre emitEvent={collectEvents()}>
            <code className="hljs language-text">
              <span className="hljs-string">Some text</span>
            </code>
          </Pre>
          <Pre emitEvent={collectEvents()}>
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
          <Pre emitEvent={collectEvents()}>
            <code className="hljs language-yaml">
              <span className="hljs-attr">key4:</span>{" "}
              <span className="hljs-string">value</span>
              {"\n"}
              <span className="hljs-attr">key5:</span> <Var name="value" />
              {"\n"}
              <span className="hljs-attr">key6:</span>
              {"\n "}
              <span className="hljs-bullet">-</span>{" "}
              <span className="hljs-string">value4</span>
              {"\n "}
              <span className="hljs-bullet">-</span>{" "}
              <span className="hljs-string">value5</span>
              {"\n "}
              <span className="hljs-bullet">-</span>{" "}
              <span className="hljs-string">value6</span>
            </code>
          </Pre>
        </VarsProvider>
      </PositionProvider>
    );
  },
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();
    const canvas = within(canvasElement);

    await step("Copy the content", async () => {
      await userEvent.hover(canvas.getByText("value6"));
      await userEvent.click(canvas.getAllByTestId("copy-button-all")[2]);
      expect(navigator.clipboard.readText()).toEqual(
        `key4: value
key5: value
key6:
 - value4
 - value5
 - value6`,
      );
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
      	event: "code_copy_button",
        label: "yaml",
        // Snippet-level copy button, rather than the copy button for a code
        // line
        scope: "snippet",
        code_snippet_index_on_page: 2,
        code_snippet_count_on_page: 3,
      });
    });
  },
};

export const PreStatsWithTwoCopyButtonClicks: Story = {
  render: () => {
    return (
      <PositionProvider>
        <VarsProvider>
          <Pre emitEvent={collectEvents()}>
            <code className="hljs language-text">
              <span className="hljs-string">Some text</span>
            </code>
          </Pre>
          <Pre emitEvent={collectEvents()}>
            <code className="hljs language-text">
              <span className="hljs-string">More text</span>
            </code>
          </Pre>
        </VarsProvider>
      </PositionProvider>
    );
  },
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();
    const canvas = within(canvasElement);

    await step("Copy the content", async () => {
      await userEvent.hover(canvas.getByText("Some text"));
      await userEvent.click(canvas.getAllByTestId("copy-button-all")[0]);
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
      	event: "code_copy_button",
        label: "text",
        scope: "snippet",
        code_snippet_index_on_page: 0,
        code_snippet_count_on_page: 2,
      });
    });

    await step("Copy the content again", async () => {
      await userEvent.hover(canvas.getByText("Some text"));
      await userEvent.click(canvas.getAllByTestId("copy-button-all")[0]);
      expect(window.events).toHaveLength(2);
      expect(window.events[1]).toEqual({
      	event: "code_copy_button",
        label: "text",
        scope: "snippet",
        code_snippet_index_on_page: 0,
        code_snippet_count_on_page: 2,
      });
    });
  },
};
