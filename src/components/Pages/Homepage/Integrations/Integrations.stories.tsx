import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within, expect, waitFor } from "storybook/test";
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
  // Shown under "Other": no tags, and a tag that matches none of the filters
  { title: "Untagged", href: "#untagged" },
  { tags: ["unknown"], title: "Unknown tag", href: "#unknown-tag" },
].map((integration) => ({ ...integration, iconComponent: snowflakeSvg }));

const meta: Meta<typeof Integrations> = {
  title: "components/Integrations",
  component: Integrations,
  args: {
    title: "All integrations",
    layout: "row-condensed",
    noBackgroundColor: true,
    desktopColumnsCount: 3,
    integrations,
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

const filterButton = (canvas: ReturnType<typeof within>) =>
  canvas.getByRole("button", { name: /Filter integrations by category/ });

// The dropdown lists the categories with their number of integrations, and
// selecting one shows only the integrations tagged with it.
export const SelectingAFilter: Story = {
  args: WithSearchAndFilters.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("All integrations are shown initially", async () => {
      expect(filterButton(canvas)).toHaveTextContent("All");
      expect(canvas.getByText("AWS CLI")).toBeVisible();
      expect(canvas.getByText("Ansible")).toBeVisible();
    });

    await step("Opening the dropdown lists the categories", async () => {
      await userEvent.click(filterButton(canvas));
      const options = canvas
        .getAllByRole("option")
        .map((option: HTMLElement) => option.textContent);
      // Categories without integrations are not listed, and integrations
      // outside the categories are listed under "Other"
      expect(options).toEqual([
        "All",
        "Users & Login (3)",
        "CI/CD & Automation (3)",
        "Other (2)",
      ]);
    });

    await step("Selecting a category filters the integrations", async () => {
      await userEvent.click(
        canvas.getByRole("option", { name: "CI/CD & Automation (3)" }),
      );
      expect(canvas.queryByRole("listbox")).toBeNull();
      expect(filterButton(canvas)).toHaveTextContent("CI/CD & Automation (3)");
      expect(canvas.queryByText("AWS CLI")).toBeNull();
      expect(canvas.getByText("Ansible")).toBeVisible();
    });

    await step("The search applies within the selected category", async () => {
      await userEvent.type(canvas.getByLabelText("Search integrations"), "aws");
      await waitFor(() => {
        expect(canvas.getByRole("status")).toHaveTextContent(
          "No integrations found for “aws”.",
        );
      });
      // The selected category stays selected, with its count updated
      expect(filterButton(canvas)).toHaveTextContent("CI/CD & Automation (0)");
    });

    await step(
      "Selecting other shows the uncategorized integrations",
      async () => {
        await userEvent.clear(canvas.getByLabelText("Search integrations"));
        await userEvent.click(filterButton(canvas));
        await userEvent.click(
          canvas.getByRole("option", { name: "Other (2)" }),
        );
        expect(canvas.getByText("Untagged")).toBeVisible();
        expect(canvas.getByText("Unknown tag")).toBeVisible();
        expect(canvas.queryByText("Ansible")).toBeNull();
      },
    );
  },
};

// The dropdown can be operated with the keyboard.
export const SelectingAFilterWithKeyboard: Story = {
  args: WithSearchAndFilters.args,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Arrow keys open the list and move the selection", async () => {
      filterButton(canvas).focus();
      await userEvent.keyboard("{ArrowDown}");
      expect(canvas.getByRole("listbox")).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{Enter}");
      expect(canvas.queryByRole("listbox")).toBeNull();
      expect(filterButton(canvas)).toHaveFocus();
      expect(filterButton(canvas)).toHaveTextContent("Users & Login (3)");
      expect(canvas.queryByText("Ansible")).toBeNull();
    });

    await step("Escape closes the list without changing it", async () => {
      await userEvent.keyboard("{ArrowDown}");
      await userEvent.keyboard("{End}");
      await userEvent.keyboard("{Escape}");
      expect(canvas.queryByRole("listbox")).toBeNull();
      expect(filterButton(canvas)).toHaveTextContent("Users & Login (3)");
    });
  },
};

// Searching narrows down the integrations, and clearing the search restores them.
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

    await step("The category counts reflect the search", async () => {
      await userEvent.click(filterButton(canvas));
      expect(
        canvas
          .getAllByRole("option")
          .map((option: HTMLElement) => option.textContent),
      ).toEqual([
        "All",
        "Users & Login (1)",
        "CI/CD & Automation (1)",
        "Other (0)",
      ]);
      await userEvent.keyboard("{Escape}");
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
