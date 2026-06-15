import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within, expect } from "storybook/test";
import { useRef, useState } from "react";
import FAQSidebar from "./FAQSidebar";
import FAQPageContext, { type FAQSection } from "./FAQPageContext";

const sections: FAQSection[] = [
  { id: "zero-trust-access", title: "Zero Trust Access", icon: "lock" },
  { id: "machine-id", title: "Machine ID", icon: "robot" },
  { id: "infrastructure", title: "Infrastructure", icon: "server" },
];

const FAQSidebarMock: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("initial query");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <FAQPageContext.Provider
      value={{
        registerSection: () => {},
        searchQuery,
        setSearchQuery,
        matchCount: 0,
        setMatchCount: () => {},
        searchInputRef,
      }}
    >
      <input
        ref={searchInputRef}
        type="search"
        aria-label="Search FAQs"
        defaultValue="initial query"
      />
      <div aria-label="Current query">{searchQuery}</div>
      {/* Section headings the sidebar observes/links to. */}
      {sections.map((section) => (
        <h2 key={section.id} id={section.id}>
          {section.title}
        </h2>
      ))}

      <FAQSidebar sections={sections} />
    </FAQPageContext.Provider>
  );
};

const meta: Meta<typeof FAQSidebar> = {
  title: "components/FAQSidebar",
  component: FAQSidebar,
};

export default meta;
type Story = StoryObj<typeof FAQSidebar>;

export const Default: Story = {
  render: () => <FAQSidebarMock />,
};

// Toggling the dropdown expands/collapses the sidebar navigation links.
export const TogglesDropdown: Story = {
  render: () => <FAQSidebarMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { expanded: false });

    await step("Dropdown is initially collapsed", async () => {
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    });

    await step("Clicking the dropdown toggle expands it", async () => {
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
    });

    await step("Clicking the dropdown toggle again collapses it", async () => {
      // Brief pause to visually distinguish the expanded state before collapsing again.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    });
  },
};

// Selecting a sidebar item marks it active and clears the FAQ search query and input field.
export const SelectingItemMarksItActiveAndClearsSearch: Story = {
  render: () => <FAQSidebarMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByLabelText(
      "Search FAQs",
    ) as HTMLInputElement;

    await step("Open the dropdown", async () => {
      await userEvent.click(canvas.getByRole("button", { expanded: false }));
    });

    await step("Click the 'Machine ID' item", async () => {
      await userEvent.click(canvas.getByRole("link", { name: "Machine ID" }));
    });

    await step("The clicked item becomes active", async () => {
      expect(
        canvas.getByRole("button", { name: "Machine ID" }),
      ).toHaveAttribute("aria-expanded", "false");
    });

    await step("The search query and input are cleared", async () => {
      expect(canvas.getByLabelText("Current query")).toHaveTextContent("");
      expect(searchInput.value).toBe("");
    });
  },
};
