import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import EnterpriseFeatureBadge from "./EnterpriseFeatureBadge";
import { collectEvents } from "/src/utils/analytics";

const meta: Meta<typeof EnterpriseFeatureBadge> = {
  title: "components/EnterpriseFeatureBadge",
  component: EnterpriseFeatureBadge,
};

export default meta;
type Story = StoryObj<typeof EnterpriseFeatureBadge>;

export const InitialState: Story = {
  render: () => (
    <EnterpriseFeatureBadge
      message="This is only available in Teleport Enterprise. Don't have an account?"
      emitEvent={collectEvents()}
    >
      <h2>Enterprise Feature</h2>
    </EnterpriseFeatureBadge>
  ),
};

export const BadgeClick: Story = {
  render: () => (
    <EnterpriseFeatureBadge
      message="This is only available in Teleport Enterprise. Don't have an account?"
      emitEvent={collectEvents()}
    >
      <h2>Enterprise Feature</h2>
    </EnterpriseFeatureBadge>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click badge to open modal", async () => {
      const badge = canvas.getByRole("button");
      await userEvent.click(badge);

      // Wait for modal to appear
      expect(
        canvas.getByText("Teleport Enterprise feature")
      ).toBeInTheDocument();
      expect(
        canvas.getByText(
          "This is only available in Teleport Enterprise. Don't have an account?"
        )
      ).toBeInTheDocument();
    });
  },
};

export const SignupLinkClick: Story = {
  render: () => (
    <EnterpriseFeatureBadge
      message="This is only available in Teleport Enterprise. Don't have an account?"
      emitEvent={collectEvents()}
    >
      <h2>Enterprise Feature</h2>
    </EnterpriseFeatureBadge>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click badge to open modal", async () => {
      const badge = canvas.getByRole("button");
      await userEvent.click(badge);

      expect(
        canvas.getByText("Teleport Enterprise feature")
      ).toBeInTheDocument();
    });

    await step("Click signup link", async () => {
      const signupLink = canvas.getByText("Start free trial");
      expect(signupLink).toBeInTheDocument();

      await userEvent.click(signupLink);

      expect((window as any).events).toHaveLength(1);
      expect((window as any).events[0]).toEqual({
        event: "docs_enterprise_link",
      });
    });
  },
};

export const CustomMessage: Story = {
  render: () => (
    <EnterpriseFeatureBadge
      message="Advanced features require Teleport Enterprise subscription."
      emitEvent={collectEvents()}
    >
      <h3>Advanced Security</h3>
    </EnterpriseFeatureBadge>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click badge and verify custom message", async () => {
      const badge = canvas.getByRole("button");
      await userEvent.click(badge);

      expect(
        canvas.getByText(
          "Advanced features require Teleport Enterprise subscription."
        )
      ).toBeInTheDocument();

      const signupLink = canvas.getByText("Start free trial");
      await userEvent.click(signupLink);

      expect((window as any).events).toHaveLength(1);
      expect((window as any).events[0]).toEqual({
        event: "docs_enterprise_link",
      });
    });
  },
};
