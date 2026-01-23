import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import EnterpriseFeatureWidget from "./EnterpriseFeatureWidget";
import { collectEvents } from "/src/utils/analytics";

const meta: Meta<typeof EnterpriseFeatureWidget> = {
  title: "components/EnterpriseFeatureWidget",
  component: EnterpriseFeatureWidget,
};

export default meta;
type Story = StoryObj<typeof EnterpriseFeatureWidget>;

export const InitialState: Story = {
  render: () => (
    <EnterpriseFeatureWidget
      title="Enterprise feature"
      emitEvent={collectEvents()}
    >
      This feature is only available in Teleport Enterprise.
    </EnterpriseFeatureWidget>
  ),
};

export const SignupLinkClick: Story = {
  render: () => (
    <EnterpriseFeatureWidget
      title="Enterprise feature"
      emitEvent={collectEvents()}
    >
      This feature is only available in Teleport Enterprise.
    </EnterpriseFeatureWidget>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click signup link", async () => {
      const signupLink = canvas.getByText("Try for free");
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute(
        "href",
        "https://goteleport.com/signup/",
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
    <EnterpriseFeatureWidget
      title="Custom Enterprise Title"
      emitEvent={collectEvents()}
    >
      Advanced security features are available in Enterprise.
    </EnterpriseFeatureWidget>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify custom title and click link", async () => {
      expect(canvas.getByText("Custom Enterprise Title")).toBeInTheDocument();

      const signupLink = canvas.getByText("Try for free");
      await userEvent.click(signupLink);

      expect((window as any).events).toHaveLength(1);
      expect((window as any).events[0]).toEqual({
        event: "docs_enterprise_link",
      });
    });
  },
};
