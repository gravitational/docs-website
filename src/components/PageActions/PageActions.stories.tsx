import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within, waitFor } from "storybook/test";
import { expect } from "storybook/test";
import React, { useState } from "react";
import PageActions from "./PageActions";
import ThumbsFeedbackContext from "../ThumbsFeedback/context";
import { FeedbackType } from "../ThumbsFeedback/types";
import { collectEvents } from "@site/src/utils/analytics";
import ExclusivityContext from "../ExclusivityBanner/context";

// Need to wrap PageActions with the ThumbsFeedbackContext provider since the inner ThumbsFeedback uses the context
const WithFeedbackContext: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  return (
    <ThumbsFeedbackContext.Provider
      value={{ feedback, setFeedback, isSubmitted, setIsSubmitted }}
    >
      {children}
    </ThumbsFeedbackContext.Provider>
  );
};

const meta: Meta<typeof PageActions> = {
  title: "components/PageActions",
  component: PageActions,
};

export default meta;
type Story = StoryObj<typeof PageActions>;

export const InitialState: Story = {
  render: () => (
    <WithFeedbackContext>
      <PageActions pathname="/test" emitEvent={collectEvents()} />
    </WithFeedbackContext>
  ),
};

export const CopyForLLMClick: Story = {
  render: () => (
    <WithFeedbackContext>
      <PageActions pathname="/test" emitEvent={collectEvents()} />
    </WithFeedbackContext>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click 'Copy for LLM' button", async () => {
      await userEvent.hover(canvas.getByText("Build with Agents"));
      await waitFor(() =>
        expect(canvas.getByTestId("dropdown-menu")).toHaveStyle(
          "visibility: visible",
        ),
      );
      await userEvent.click(canvas.getByText("Copy for LLM"));
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "copy_page_as_markdown",
      });
    });
  },
};

export const ViewAsMarkdownClick: Story = {
  render: () => (
    <WithFeedbackContext>
      <ExclusivityContext.Provider
        value={{
          skillsForPage: [
            {
              name: "test-skill",
              readableName: "Test Skill",
              description: "This is a test skill.",
              installCommand: "npx skills add test-skill-url",
              rawSourceUrl:
                "https://github.com/gravitational/teleport/tree/master/skills/test-skill/SKILL.md",
            },
          ],
        }}
      >
        <PageActions pathname="/test" emitEvent={collectEvents()} />
      </ExclusivityContext.Provider>
    </WithFeedbackContext>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click 'View as Markdown' button", async () => {
      await userEvent.hover(canvas.getByText("Build with Agents"));
      await waitFor(() =>
        expect(canvas.getByTestId("dropdown-menu")).toHaveStyle(
          "visibility: visible",
        ),
      );
      await userEvent.click(canvas.getByText("View as Markdown"));
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "view_page_as_markdown",
      });
    });
  },
};

export const DropdownModalOpens: Story = {
  render: () => (
    <WithFeedbackContext>
      <ExclusivityContext.Provider
        value={{
          skillsForPage: [
            {
              name: "test-skill",
              readableName: "Test Skill",
              description: "This is a test skill.",
              installCommand: "npx skills add test-skill-url",
              rawSourceUrl:
                "https://github.com/gravitational/teleport/tree/master/skills/test-skill/SKILL.md",
            },
          ],
        }}
      >
        <PageActions pathname="/test" emitEvent={collectEvents()} />
      </ExclusivityContext.Provider>
    </WithFeedbackContext>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click 'Install Skills' button to open modal", async () => {
      await userEvent.hover(canvas.getByText("Build with Agents"));
      await waitFor(() =>
        expect(canvas.getByTestId("dropdown-menu")).toHaveStyle(
          "visibility: visible",
        ),
      );
      await userEvent.click(canvas.getByText("Install Skills"));
      expect(
        canvas.getByText("npx skills add test-skill-url"),
      ).toBeInTheDocument();
    });
  },
};

export const DropdownModalClosesWhenClickingOutside: Story = {
  render: () => (
    <WithFeedbackContext>
      <ExclusivityContext.Provider
        value={{
          skillsForPage: [
            {
              name: "test-skill",
              readableName: "Test Skill",
              description: "This is a test skill.",
              installCommand: "npx skills add test-skill-url",
              rawSourceUrl:
                "https://github.com/gravitational/teleport/tree/master/skills/test-skill/SKILL.md",
            },
          ],
        }}
      >
        <PageActions pathname="/test" emitEvent={collectEvents()} />
        <button>Click outside of the dropdown</button>
      </ExclusivityContext.Provider>
    </WithFeedbackContext>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step(
      "Click 'Install Skills' button to open modal, then click outside to close it",
      async () => {
        await userEvent.hover(canvas.getByText("Build with Agents"));
        await waitFor(() =>
          expect(canvas.getByTestId("dropdown-menu")).toHaveStyle(
            "visibility: visible",
          ),
        );
        await userEvent.click(canvas.getByText("Install Skills"));
        await waitFor(() =>
          expect(
            canvas.getByText("npx skills add test-skill-url"),
          ).toBeInTheDocument(),
        );

        await userEvent.click(
          canvas.getByText("Click outside of the dropdown"),
        );
        await waitFor(() =>
          expect(
            canvas.queryByText("npx skills add test-skill-url"),
          ).not.toBeInTheDocument(),
        );
      },
    );
  },
};
