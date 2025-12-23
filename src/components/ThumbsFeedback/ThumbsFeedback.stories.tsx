import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import React, { useState, useMemo } from "react";
import ThumbsFeedback from "./ThumbsFeedback";
import ThumbsFeedbackContext from "./context";
import { FeedbackType } from "./types";
import { collectEvents } from "@site/src/utils/analytics";

// Wrapper component that provides the context
const ThumbsFeedbackWrapper: React.FC<{
  pagePosition?: "top" | "bottom";
}> = ({ pagePosition = "bottom" }) => {
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const emitEvent = useMemo(() => collectEvents(), []);

  return (
    <ThumbsFeedbackContext.Provider
      value={{ feedback, setFeedback, isSubmitted, setIsSubmitted }}
    >
      <ThumbsFeedback pagePosition={pagePosition} emitEvent={emitEvent} />
    </ThumbsFeedbackContext.Provider>
  );
};

export const InitialState = () => <ThumbsFeedbackWrapper />;

const meta: Meta<typeof ThumbsFeedback> = {
  title: "components/ThumbsFeedback",
  component: InitialState,
  decorators: [
    (Story) => {
      localStorage.removeItem("feedback_given_paths");
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ThumbsFeedback>;

export const PositiveFeedbackClick: Story = {
  render: () => <ThumbsFeedbackWrapper />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click thumbs up button", async () => {
      await userEvent.click(canvas.getByLabelText("Yes, this page is helpful"));
      expect(
        canvas.getByText("Great! Is there anything we can improve?")
      ).toBeInTheDocument();
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "docs_feedback_thumbs_up",
      });
    });
  },
};

export const PositiveFeedbackSubmit: Story = {
  render: () => <ThumbsFeedbackWrapper />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click thumbs up button", async () => {
      await userEvent.click(canvas.getByLabelText("Yes, this page is helpful"));
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "docs_feedback_thumbs_up",
      });
    });

    await step("Enter feedback comment", async () => {
      const textarea = canvas.getByPlaceholderText(
        "Tell us more about your experience"
      );
      await userEvent.type(textarea, "Great documentation!");
      expect(textarea).toHaveValue("Great documentation!");
    });

    await step("Submit feedback", async () => {
      await userEvent.click(canvas.getByText("Submit"));
      expect(window.events).toHaveLength(2);
      expect(window.events[1]).toEqual({
        event: "docs_feedback_comment_thumbs_up",
        comment_text: "Great documentation!",
      });
    });
  },
};

export const NegativeFeedbackClick: Story = {
  render: () => <ThumbsFeedbackWrapper />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click thumbs down button", async () => {
      await userEvent.click(
        canvas.getByLabelText("No, this page is not helpful")
      );
      expect(
        canvas.getByText("How can we improve this page?")
      ).toBeInTheDocument();
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "docs_feedback_thumbs_down",
      });
    });
  },
};

export const NegativeFeedbackSubmit: Story = {
  render: () => <ThumbsFeedbackWrapper />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click thumbs down button", async () => {
      await userEvent.click(
        canvas.getByLabelText("No, this page is not helpful")
      );
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "docs_feedback_thumbs_down",
      });
    });

    await step("Enter feedback comment", async () => {
      const textarea = canvas.getByPlaceholderText(
        "Tell us more about your experience"
      );
      await userEvent.type(textarea, "Missing examples");
      expect(textarea).toHaveValue("Missing examples");
    });

    await step("Submit feedback", async () => {
      await userEvent.click(canvas.getByText("Submit"));
      expect(window.events).toHaveLength(2);
      expect(window.events[1]).toEqual({
        event: "docs_feedback_comment_thumbs_down",
        comment_text: "Missing examples",
      });
    });
  },
};
