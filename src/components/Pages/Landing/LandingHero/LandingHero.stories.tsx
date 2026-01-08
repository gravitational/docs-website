import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import LandingHero from "./LandingHero";
import ExclusivityContext from "/src/components/ExclusivityBanner/context";
import { collectEvents } from "/src/utils/analytics";

const meta: Meta<typeof LandingHero> = {
  title: "components/Pages/LandingHero",
  component: LandingHero,
};

export default meta;
type Story = StoryObj<typeof LandingHero>;

export const WithoutExclusivity: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ exclusiveFeature: null }}>
      <LandingHero title="Welcome to Teleport" emitEvent={collectEvents()}>
        <p>Secure access to your infrastructure</p>
      </LandingHero>
    </ExclusivityContext.Provider>
  ),
};

export const WithExclusivity: Story = {
  render: () => (
    <ExclusivityContext.Provider value={{ exclusiveFeature: "Desktop Access" }}>
      <LandingHero title="Desktop Access">
        <p>Secure remote desktop access with Teleport</p>
      </LandingHero>
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
      <LandingHero title="Machine ID" emitEvent={collectEvents()}>
        <p>Identity-based access for machines and workloads</p>
      </LandingHero>
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
