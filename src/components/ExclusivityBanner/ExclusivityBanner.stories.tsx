import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import ExclusivityBanner from "./ExclusivityBanner";
import ExclusivityContext from "/src/components/ExclusivityBanner/context";
import { collectEvents } from "/src/utils/analytics";

const meta: Meta<typeof ExclusivityBanner> = {
  title: "components/ExclusivityBanner",
  component: ExclusivityBanner,
};

export default meta;
type Story = StoryObj<typeof ExclusivityBanner>;

export const WithoutExclusivity: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ exclusiveFeature: null }}>
      <ExclusivityBanner emitEvent={collectEvents()} />
    </ExclusivityContext.Provider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify exclusivity banner is not shown", async () => {
      expect(
        canvas.queryByText(/is available only with Teleport Enterprise/)
      ).not.toBeInTheDocument();
    });
  },
};

export const WithExclusivity: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ exclusiveFeature: "Desktop Access" }}>
      <ExclusivityBanner emitEvent={collectEvents()} />
    </ExclusivityContext.Provider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify exclusivity banner is shown", async () => {
      expect(
        canvas.getByText(
          "Desktop Access is available only with Teleport Enterprise."
        )
      ).toBeInTheDocument();

      const signupLink = canvas.getByText("Start your free trial.");
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute(
        "href",
        "https://goteleport.com/signup/"
      );
    });
  },
};

export const ExclusivitySignupLinkClick: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ exclusiveFeature: "Machine ID" }}>
      <ExclusivityBanner emitEvent={collectEvents()} />
    </ExclusivityContext.Provider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click signup link in exclusivity banner", async () => {
      const signupLink = canvas.getByText("Start your free trial.");
      expect(signupLink).toBeInTheDocument();

      await userEvent.click(signupLink);

      expect((window as any).events).toHaveLength(1);
      expect((window as any).events[0]).toEqual({
        event: "docs_enterprise_link",
      });
    });
  },
};
