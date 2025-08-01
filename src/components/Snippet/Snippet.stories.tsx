import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";

import { Var } from "../Variables/Var";
import { default as Snippet } from "./Snippet";
import Command, { CommandLine, CommandComment } from "../Command/Command";
import { CodeLine } from "/src/theme/MDXComponents/Code";
import { replaceClipboardWithCopyBuffer } from "/src/utils/clipboard";
import { collectGtagCalls } from "/src/utils/analytics";
import { PositionProvider } from "/src/components/PositionProvider";

export const SimpleCommand = () => (
  <Snippet gtag={collectGtagCalls()}>
    <Command gtag={collectGtagCalls()}>
      <CommandLine data-content="$ ">echo Hello world!</CommandLine>
    </Command>
  </Snippet>
);

const meta: Meta<typeof Snippet> = {
  title: "components/Snippet",
  component: SimpleCommand,
};
export default meta;
type Story = StoryObj<typeof Snippet>;

export const CopyCommandVar: Story = {
  render: () => {
    return (
      <Snippet gtag={collectGtagCalls()}>
        <Command gtag={collectGtagCalls()}>
          <CommandLine data-content="$ ">
            curl https://
            <Var name="example.com" isGlobal={false} description="" />
            /v1/webapi/saml/acs/azure-saml
          </CommandLine>
        </Command>
      </Snippet>
    );
  },
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();
    const canvas = within(canvasElement);

    await step("Copy the content", async () => {
      await userEvent.hover(canvas.getByText("example.com"));
      await userEvent.click(canvas.getByTestId("copy-button"));
      expect(navigator.clipboard.readText()).toEqual(
        "curl https://example.com/v1/webapi/saml/acs/azure-saml",
      );
      await userEvent.click(canvas.getByTestId("copy-button-all"));
      expect(navigator.clipboard.readText()).toEqual(
        "curl https://example.com/v1/webapi/saml/acs/azure-saml",
      );
    });
  },
};

// A code snippet with commands should only copy the commands.
export const CopyCommandVarWithOutput: Story = {
  render: () => {
    return (
      <Snippet gtag={collectGtagCalls()}>
        <Command>
          <CommandLine data-content="$ ">
            curl https://
            <Var name="example.com" isGlobal={false} description="" />
            /v1/webapi/saml/acs/azure-saml
          </CommandLine>
        </Command>
        <CodeLine>
          The output of curling <Var name="example.com" />
        </CodeLine>
      </Snippet>
    );
  },
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();
    const canvas = within(canvasElement);

    await step("Copy the content", async () => {
      await userEvent.click(canvas.getByTestId("copy-button-all"));
      expect(navigator.clipboard.readText()).toEqual(
        "curl https://example.com/v1/webapi/saml/acs/azure-saml",
      );
    });
  },
};

// A code snippet with no commands should copy all content within the snippet.
export const CopyCodeLineVar: Story = {
  render: () => {
    return (
      <PositionProvider>
        <Snippet gtag={collectGtagCalls()}>
          <CodeLine>
            curl https://
            <Var name="example.com" isGlobal={false} description="" />
            /v1/webapi/saml/acs/azure-saml
          </CodeLine>
        </Snippet>
      </PositionProvider>
    );
  },
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();

    const canvas = within(canvasElement);

    await step("Copy the content", async () => {
      await userEvent.hover(canvas.getByText("example.com"));
      await userEvent.click(canvas.getByTestId("copy-button-all"));
      expect(navigator.clipboard.readText()).toEqual(
        "curl https://example.com/v1/webapi/saml/acs/azure-saml",
      );
      expect(window.gtagCalls).toHaveLength(1);
      expect(window.gtagCalls[0].params).toEqual({
        label: "code",
        scope: "snippet",
        code_snippet_index_on_page: 0,
        code_snippet_count_on_page: 1,
      });
    });
  },
};

export const CopyCommandLineStats: Story = {
  render: () => {
    return (
      <PositionProvider>
        <Snippet gtag={collectGtagCalls()}>
          <Command gtag={collectGtagCalls()}>
            <CommandLine data-content="$ ">
              curl https://
              <Var name="sub4.example.com" isGlobal={false} description="" />
              /v1/webapi/saml/acs/azure-saml
            </CommandLine>
          </Command>
        </Snippet>
        <Snippet gtag={collectGtagCalls()}>
          <Command gtag={collectGtagCalls()}>
            <CommandLine data-content="$ ">
              curl https://
              <Var name="sub1.example.com" isGlobal={false} description="" />
              /v1/webapi/saml/acs/azure-saml
            </CommandLine>
          </Command>
          <Command gtag={collectGtagCalls()}>
            <CommandLine data-content="$ ">
              curl https://
              <Var name="sub2.example.com" isGlobal={false} description="" />
              /v1/webapi/saml/acs/azure-saml
            </CommandLine>
          </Command>
          <Command gtag={collectGtagCalls()}>
            <CommandLine data-content="$ ">
              curl https://
              <Var name="sub3.example.com" isGlobal={false} description="" />
              /v1/webapi/saml/acs/azure-saml
            </CommandLine>
          </Command>
        </Snippet>
      </PositionProvider>
    );
  },
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();
    const canvas = within(canvasElement);

    await step("Copy the second command", async () => {
      await userEvent.hover(canvas.getByText("sub2.example.com"));
      await userEvent.click(canvas.getAllByTestId("copy-button")[2]);
      expect(window.gtagCalls).toHaveLength(1);
      expect(window.gtagCalls[0].params).toEqual({
        label: "code",
        scope: "line",
        code_snippet_index_on_page: 1,
        code_snippet_count_on_page: 2,
        line_index_in_snippet: 1,
        line_count_in_snippet: 3,
      });
    });
  },
};
