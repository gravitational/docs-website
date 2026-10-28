import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within } from "storybook/test";
import { expect } from "storybook/test";
import Checklist, { ChecklistItem, ChecklistStep } from "./Checklist";

const STORAGE_KEY = "checklist:storybook";

const ChecklistExample = () => (
  <Checklist id="storybook">
    <ChecklistStep
      title="Setup"
      description="Establish recovery, operational ownership, and enrollment standards."
      videoId="9zo1mV2uZKE"
    >
      <ChecklistItem timestamp={42}>
        Update required <a href="#security-contacts">security contacts</a>
      </ChecklistItem>
      <ChecklistItem timestamp={95}>
        Establish a <a href="#break-glass">break-glass access plan</a>
      </ChecklistItem>
    </ChecklistStep>
    <ChecklistStep
      title="Single Sign-On"
      description="Connect your identity provider to Teleport."
      videoId="9zo1mV2uZKE"
    >
      <ChecklistItem timestamp={120}>
        Connect an identity provider
      </ChecklistItem>
      <ChecklistItem>Map SSO groups to Teleport roles</ChecklistItem>
    </ChecklistStep>
    <ChecklistStep title="Infrastructure as Code" videoId="9zo1mV2uZKE">
      <ChecklistItem>Set up the Teleport Terraform provider</ChecklistItem>
      <ChecklistItem>Manage roles with Terraform</ChecklistItem>
    </ChecklistStep>
  </Checklist>
);

const meta: Meta<typeof Checklist> = {
  title: "components/Checklist",
  component: Checklist,
  beforeEach: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
};

export default meta;
type Story = StoryObj<typeof Checklist>;

export const InitialState: Story = {
  render: () => <ChecklistExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Only the first step is opened", async () => {
      expect(canvas.getByRole("button", { name: /1\. Setup/ })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(
        canvas.getByRole("button", { name: /2\. Single Sign-On/ }),
      ).toHaveAttribute("aria-expanded", "false");
      expect(
        canvas.getByRole("button", { name: /3\. Infrastructure as Code/ }),
      ).toHaveAttribute("aria-expanded", "false");
    });

    await step("Collapsed steps still show their description", async () => {
      expect(
        canvas.getByText("Connect your identity provider to Teleport."),
      ).toBeVisible();
    });
  },
};

export const CheckingItemsCompletesStep: Story = {
  render: () => <ChecklistExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const [first, second] = canvas.getAllByRole("checkbox");

    await step("Check the first item", async () => {
      await userEvent.click(first);
      expect(first).toBeChecked();
      expect(first.closest("li")?.className).toMatch(/checked/);
      expect(canvas.getByText("01/02 completed")).toBeInTheDocument();
      expect(
        canvas.getByRole("button", { name: /1\. Setup/ }),
      ).not.toHaveAccessibleName(/Completed/);
    });

    await step("Check the second item to complete the step", async () => {
      await userEvent.click(second);
      expect(canvas.getByText("02/02 completed")).toBeInTheDocument();
      expect(
        canvas.getByRole("button", { name: /1\. Setup/ }),
      ).toHaveAccessibleName(/Completed/);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toEqual([
        "0-0",
        "0-1",
      ]);
    });

    await step("Uncheck an item", async () => {
      await userEvent.click(second);
      expect(second).not.toBeChecked();
      expect(canvas.getByText("01/02 completed")).toBeInTheDocument();
    });
  },
};

export const RestoresProgressFromStorage: Story = {
  render: () => <ChecklistExample />,
  beforeEach: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["0-0", "0-1"]));
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step(
      "Completed step is collapsed and marked as completed",
      async () => {
        const setup = await canvas.findByRole("button", {
          name: /1\. Setup.*Completed/,
        });
        expect(setup).toHaveAttribute("aria-expanded", "false");
      },
    );

    await step("The step after the completed one is opened", async () => {
      const sso = canvas.getByRole("button", { name: /2\. Single Sign-On/ });
      expect(sso).toHaveAttribute("aria-expanded", "true");
      // Scoped to the step, since the previous one may still be collapsing.
      const ssoStep = within(sso.closest("section") as HTMLElement);
      for (const checkbox of ssoStep.getAllByRole("checkbox")) {
        expect(checkbox).not.toBeChecked();
      }
    });
  },
};

export const ToggleSteps: Story = {
  render: () => <ChecklistExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const setup = canvas.getByRole("button", { name: /1\. Setup/ });
    const sso = canvas.getByRole("button", { name: /2\. Single Sign-On/ });

    await step("Open the second step", async () => {
      await userEvent.click(sso);
      expect(sso).toHaveAttribute("aria-expanded", "true");
      expect(setup).toHaveAttribute("aria-expanded", "false");
    });

    await step("Collapse the second step", async () => {
      await userEvent.click(sso);
      expect(sso).toHaveAttribute("aria-expanded", "false");
    });
  },
};

export const PlayFromTimestamp: Story = {
  render: () => <ChecklistExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    let player: HTMLIFrameElement | null = null;

    await step("Load the player at the item's timestamp", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Play video from 0:42" }),
      );
      player = canvasElement.querySelector("iframe");
      expect(player?.getAttribute("src")).toContain("start=42");
      expect(player?.getAttribute("src")).toContain("enablejsapi=1");
    });

    await step("Seek to another timestamp without reloading", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Play video from 1:35" }),
      );
      // The seek is sent to the existing player, so the iframe and its src
      // stay the same.
      expect(canvasElement.querySelector("iframe")).toBe(player);
      expect(player?.getAttribute("src")).toContain("start=42");
    });
  },
};
