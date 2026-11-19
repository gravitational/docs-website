import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within, expect, waitFor } from "storybook/test";
import type { ComponentProps } from "react";
import Integrations from "./Integrations";
import snowflakeSvg from "@site/src/components/Icon/teleport-svg/snowflake.svg";

const filters = [
  { name: "Users & Login", id: "users-login" },
  { name: "CI/CD & Automation", id: "ci-cd" },
  { name: "Observability", id: "observability" },
];

const integrations = [
  { tags: ["users-login"], title: "AWS CLI", href: "#aws-cli" },
  { tags: ["users-login"], title: "Azure CLI", href: "#azure-cli" },
  { tags: ["users-login"], title: "GitHub", href: "#github" },
  { tags: ["ci-cd"], title: "Ansible", href: "#ansible" },
  { tags: ["ci-cd"], title: "Argo CD", href: "#argo-cd" },
  { tags: ["ci-cd"], title: "GitHub Actions", href: "#github-actions" },
].map((integration) => ({ ...integration, iconComponent: snowflakeSvg }));

type IntegrationsProps = ComponentProps<typeof Integrations>;

const meta: Meta<typeof Integrations> = {
  title: "components/Integrations",
  component: Integrations,
  args: {
    title: "All integrations",
    layout: "row-condensed",
    noBackgroundColor: true,
    desktopColumnsCount: 3,
    integrations: integrations as IntegrationsProps["integrations"],
  },
};

export default meta;
type Story = StoryObj<typeof Integrations>;

export const Default: Story = {};

export const WithSearchAndFilters: Story = {
  args: {
    enableSearch: true,
    filters,
  },
};

const groupHeadings = (canvas: ReturnType<typeof within>) =>
  canvas
    .queryAllByRole("heading", { level: 3 })
    .map((h: HTMLElement) => h.textContent);

// Integrations are grouped by filter, and empty groups are not shown.
// Selecting a filter only shows the matching group.

export const SelectingAFilterShowsOnlyThatGroup: Story = {
  args: WithSearchAndFilters.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("All non-empty groups are shown initially", async () => {
      expect(groupHeadings(canvas)).toEqual(
        expect.arrayContaining(["Users & Login", "CI/CD & Automation"]),
      );
      expect(groupHeadings(canvas)).not.toContain("Observability");
      expect(canvas.getAllByText("3 integrations")).toHaveLength(2);
    });

    await step("Selecting a filter shows only that group", async () => {
      await userEvent.selectOptions(
        canvas.getByLabelText("Filter integrations by category"),
        "ci-cd",
      );
      expect(
        canvas.queryByRole("heading", {
          name: "Users & Login",
        }),
      ).toBeNull();
      expect(
        canvas.queryByRole("heading", {
          name: "CI/CD & Automation",
        }),
      ).toBeVisible();
      expect(canvas.getByText("Ansible")).toBeVisible();
    });

    await step("Selecting an empty filter shows the empty state", async () => {
      await userEvent.selectOptions(
        canvas.getByLabelText("Filter integrations by category"),
        "observability",
      );
      expect(canvas.getByRole("status")).toHaveTextContent(
        "No integrations found.",
      );
    });
  },
};

// Searching narrows down the integrations within each group, and clearing
// the search restores them.
export const SearchingFiltersIntegrations: Story = {
  args: WithSearchAndFilters.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(
      "Search integrations",
    ) as HTMLInputElement;

    await step("Typing a query narrows down the results", async () => {
      await userEvent.type(input, "github");
      await waitFor(() => {
        expect(canvas.queryByText("Ansible")).toBeNull();
      });
      expect(canvas.getByText("GitHub")).toBeVisible();
      expect(canvas.getByText("GitHub Actions")).toBeVisible();
    });

    await step("A query without matches shows the empty state", async () => {
      await userEvent.clear(input);
      await userEvent.type(input, "nonexistent");
      await waitFor(() => {
        expect(canvas.getByRole("status")).toHaveTextContent(
          "No integrations found for “nonexistent”.",
        );
      });
    });

    await step("Clearing the search restores all integrations", async () => {
      await userEvent.click(canvas.getByLabelText("Clear integrations search"));
      expect(input.value).toBe("");
      expect(canvas.getByText("Ansible")).toBeVisible();
      expect(canvas.getByText("AWS CLI")).toBeVisible();
    });
  },
};
