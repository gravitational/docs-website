import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { userEvent, within } from "storybook/test";
import { expect } from "storybook/test";
import React, { useState } from "react";
import PageActions from "./PageActions";
import ThumbsFeedbackContext from "../ThumbsFeedback/context";
import { FeedbackType } from "../ThumbsFeedback/types";
import { collectEvents } from "/src/utils/analytics";

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
      <PageActions pathname="/test" emitEvent={collectEvents()} />
    </WithFeedbackContext>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click 'View as Markdown' button", async () => {
      await userEvent.click(canvas.getByText("View as Markdown"));
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "view_page_as_markdown",
      });
    });
  },
};
