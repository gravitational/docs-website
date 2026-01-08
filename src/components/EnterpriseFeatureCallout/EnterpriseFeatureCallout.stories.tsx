import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import EnterpriseFeatureCallout from "./EnterpriseFeatureCallout";
import { collectEvents } from "/src/utils/analytics";

const meta: Meta<typeof EnterpriseFeatureCallout> = {
  title: "components/EnterpriseFeatureCallout",
  component: EnterpriseFeatureCallout,
};

export default meta;
type Story = StoryObj<typeof EnterpriseFeatureCallout>;

export const InitialState: Story = {
  render: () => (
    <EnterpriseFeatureCallout
      title="Enterprise feature"
      emitEvent={collectEvents()}
    >
      This feature is only available in Teleport Enterprise.
    </EnterpriseFeatureCallout>
  ),
};

export const SignupLinkClick: Story = {
  render: () => (
    <EnterpriseFeatureCallout
      title="Enterprise feature"
      emitEvent={collectEvents()}
    >
      This feature is only available in Teleport Enterprise.
    </EnterpriseFeatureCallout>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click signup link", async () => {
      const signupLink = canvas.getByText("Start a free trial");
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute(
        "href",
        "https://goteleport.com/signup/"
      );

      await userEvent.click(signupLink);

      expect((window as any).events).toHaveLength(1);
      expect((window as any).events[0]).toEqual({
        event: "docs_enterprise_link",
      });
    });
  },
};

export const CustomTitle: Story = {
  render: () => (
    <EnterpriseFeatureCallout
      title="Custom Enterprise Title"
      emitEvent={collectEvents()}
    >
      Advanced security features are available in Enterprise.
    </EnterpriseFeatureCallout>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify custom title and click link", async () => {
      expect(canvas.getByText("Custom Enterprise Title")).toBeInTheDocument();

      const signupLink = canvas.getByText("Start a free trial");
      await userEvent.click(signupLink);

      expect((window as any).events).toHaveLength(1);
      expect((window as any).events[0]).toEqual({
        event: "docs_enterprise_link",
      });
    });
  },
};
