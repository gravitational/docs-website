import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { useRef, useState } from "react";
import FAQSearch from "./FAQSearch";
import FAQPageContext from "./FAQPageContext";

const FAQSearchMock: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
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
      <FAQSearch />
      <div aria-label="The current search query">{searchQuery}</div>
    </FAQPageContext.Provider>
  );
};

const meta: Meta<typeof FAQSearch> = {
  title: "components/FAQSearch",
  component: FAQSearch,
};

export default meta;
type Story = StoryObj<typeof FAQSearch>;

export const Default: Story = {
  render: () => <FAQSearchMock />,
};

// Typing in the search input updates the search query in the context after a debounce delay and shows the clear button.
export const TypingUpdatesSearchQuery: Story = {
  render: () => <FAQSearchMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("The clear button is not visible initially", async () => {
      expect(canvas.queryByLabelText("Clear FAQs search")).toBeNull();
    });

    await step(
      "The debounced search query is updated when the user types in the input",
      async () => {
        await userEvent.type(
          canvas.getByLabelText("Search for a question across FAQs"),
          "search term",
        );

        await waitFor(() => {
          expect(
            canvas.getByLabelText("The current search query"),
          ).toHaveTextContent("search term");
        });
      },
    );

    await step("Once a query appears, the clear button shows up", async () => {
      expect(canvas.getByLabelText("Clear FAQs search")).toBeVisible();
    });
  },
};

// The input value and the search query in the context are cleared when the clear button is clicked.
// The clear button is hidden again after clearing.
export const ClearButtonResetsQuery: Story = {
  render: () => <FAQSearchMock />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(
      "Search for a question across FAQs",
    ) as HTMLInputElement;

    await step(
      "Type something in the search input and wait for it to be applied",
      async () => {
        await userEvent.type(input, "something");

        await waitFor(() => {
          expect(
            canvas.getByLabelText("The current search query"),
          ).toHaveTextContent("something");
        });
      },
    );

    await step("Click the clear button", async () => {
      await userEvent.click(canvas.getByLabelText("Clear FAQs search"));

      expect(input.value).toBe("");
      expect(
        canvas.getByLabelText("The current search query"),
      ).toHaveTextContent("");
      expect(canvas.queryByLabelText("Clear FAQs search")).toBeNull();
    });
  },
};
