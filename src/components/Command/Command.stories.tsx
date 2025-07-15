import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { userEvent, within } from "@storybook/test";
import { replaceClipboardWithCopyBuffer } from "/src/utils/clipboard";
import { collectGtagCalls } from "/src/utils/analytics";
import Command, { CommandLine } from "./Command";

const commandText = "yarn install";

export const SimpleCommand = () => (
  <Command gtag={collectGtagCalls()}>
    <CommandLine data-content="$ ">{commandText}</CommandLine>
  </Command>
);

const meta: Meta<typeof Command> = {
  title: "components/Command",
  component: SimpleCommand,
};

export default meta;
type Story = StoryObj<typeof Command>;

export const CopyButton: Story = {
  render: () => <SimpleCommand />,
  play: async ({ canvasElement, step }) => {
    replaceClipboardWithCopyBuffer();
    const canvas = within(canvasElement);
    await step("Hover and click on copy button", async () => {
      await userEvent.hover(canvas.getByText(commandText));
      await userEvent.click(canvas.getByTestId("copy-button"));
      expect(navigator.clipboard.readText()).toEqual(commandText);
      expect(window.gtagCalls).toHaveLength(1);
      expect(window.gtagCalls[0].params).toEqual({
        label: "code",
        scope: "line",
      });
    });
  },
};
