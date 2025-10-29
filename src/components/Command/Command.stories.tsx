import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { userEvent, within } from "@storybook/test";
import { replaceClipboardWithCopyBuffer } from "/src/utils/clipboard";
import { collectEvents } from "/src/utils/analytics";
import Command, { CommandLine } from "./Command";

const commandText = "yarn install";

export const SimpleCommand = () => (
  <Command emitEvent={collectEvents()}>
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
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
      	event: "code_copy_button",
        label: "code",
        scope: "line",
      });
    });
  },
};
