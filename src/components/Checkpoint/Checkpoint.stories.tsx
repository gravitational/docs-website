import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { expect } from "@storybook/test";
import Checkpoint from "./Checkpoint";
import { collectEvents } from "/src/utils/analytics";

const meta: Meta<typeof Checkpoint> = {
  title: "components/Checkpoint",
  component: Checkpoint,
};

export default meta;
type Story = StoryObj<typeof Checkpoint>;

export const InitialState: Story = {
  render: () => (
    <Checkpoint
      title="Test Configuration"
      description="Verify that your setup is working correctly."
      emitEvent={collectEvents()}
    />
  ),
};

export const PositiveFeedbackFlow: Story = {
  render: () => (
    <Checkpoint
      title="Test Configuration"
      description="Verify that your setup is working correctly."
      emitEvent={collectEvents()}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click positive feedback button", async () => {
      await userEvent.click(canvas.getByText("Yes, it is working"));
      expect(
        canvas.getByText("That's great! What can we do to improve?")
      ).toBeInTheDocument();
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "docs_checkpoint_feedback_positive",
        checkpoint_title: "Test Configuration",
      });
    });

    await step("Enter feedback comment", async () => {
      const textarea = canvas.getByPlaceholderText(
        "Could you share more about your experience?"
      );
      await userEvent.type(textarea, "Great documentation!");
      expect(textarea).toHaveValue("Great documentation!");
    });

    await step("Submit feedback", async () => {
      await userEvent.click(canvas.getByText("Submit"));
      expect(
        canvas.getByText("Thank you. Your feedback has been submitted.")
      ).toBeInTheDocument();
      expect(window.events).toHaveLength(2);
      expect(window.events[1]).toEqual({
        event: "docs_checkpoint_feedback_comment_positive",
        checkpoint_title: "Test Configuration",
        comment_text: "Great documentation!",
      });
    });
  },
};

export const NegativeFeedbackFlow: Story = {
  render: () => (
    <Checkpoint
      title="Database Connection"
      description="Check if you can connect to the database."
      emitEvent={collectEvents()}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click negative feedback button", async () => {
      await userEvent.click(canvas.getByText("No, it didn't work"));
      expect(
        canvas.getByText("Thanks for letting us know!")
      ).toBeInTheDocument();
      expect(
        canvas.getByText("Here are some troubleshooting tips:")
      ).toBeInTheDocument();
      expect(
        canvas.getByText("Ensure your internet connection is stable.")
      ).toBeInTheDocument();
      expect(window.events).toHaveLength(1);
      expect(window.events[0]).toEqual({
        event: "docs_checkpoint_feedback_negative",
        checkpoint_title: "Database Connection",
      });
    });

    await step("Verify troubleshooting links are present", async () => {
      const slackLink = canvas.getByText("Slack community");
      const supportLink = canvas.getByText("customer support");
      expect(slackLink).toHaveAttribute(
        "href",
        "https://goteleport.com/community-slack/"
      );
      expect(supportLink).toHaveAttribute(
        "href",
        "https://support.goteleport.com/hc/en-us"
      );
    });

    await step("Enter feedback comment", async () => {
      const textarea = canvas.getByPlaceholderText(
        "Could you share more about your experience?"
      );
      await userEvent.type(textarea, "Connection timeout error");
      expect(textarea).toHaveValue("Connection timeout error");
    });

    await step("Submit feedback", async () => {
      await userEvent.click(canvas.getByText("Submit"));
      expect(
        canvas.getByText("Thank you. Your feedback has been submitted.")
      ).toBeInTheDocument();
      expect(window.events).toHaveLength(2);
      expect(window.events[1]).toEqual({
        event: "docs_checkpoint_feedback_comment_negative",
        checkpoint_title: "Database Connection",
        comment_text: "Connection timeout error",
      });
    });
  },
};

export const CancelFeedback: Story = {
  render: () => (
    <Checkpoint
      title="API Response"
      description="Check if you are receiving an API response."
      emitEvent={collectEvents()}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click positive feedback and enter comment", async () => {
      await userEvent.click(canvas.getByText("Yes, it is working"));
      const textarea = canvas.getByPlaceholderText(
        "Could you share more about your experience?"
      );
      await userEvent.type(textarea, "Works perfectly");
    });

    await step("Cancel the feedback", async () => {
      await userEvent.click(canvas.getByText("Cancel"));
      expect(canvas.getByText("Yes, it is working")).toBeInTheDocument();
      expect(canvas.getByText("No, it didn't work")).toBeInTheDocument();
      expect(
        canvas.queryByPlaceholderText(
          "Could you share more about your experience?"
        )
      ).not.toBeInTheDocument();
    });
  },
};

export const CustomTroubleshootingContent: Story = {
  render: () => (
    <Checkpoint
      title="Custom Troubleshooting"
      description="This is a Checkpoint with custom troubleshooting tips."
      emitEvent={collectEvents()}
    >
      <div>
        <p>Custom troubleshooting steps:</p>
        <ul>
          <li>Check your API key is valid</li>
          <li>Verify network connectivity</li>
          <li>Review the logs for errors</li>
        </ul>
      </div>
    </Checkpoint>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Click negative feedback button", async () => {
      await userEvent.click(canvas.getByText("No, it didn't work"));
      expect(
        canvas.getByText("Custom troubleshooting steps:")
      ).toBeInTheDocument();
      expect(
        canvas.getByText("Check your API key is valid")
      ).toBeInTheDocument();
      expect(
        canvas.getByText("Verify network connectivity")
      ).toBeInTheDocument();
      expect(
        canvas.getByText("Review the logs for errors")
      ).toBeInTheDocument();
      // Default troubleshooting tip should not be shown
      expect(
        canvas.queryByText("Ensure your internet connection is stable.")
      ).not.toBeInTheDocument();
    });
  },
};

export const WithoutDescription: Story = {
  render: () => (
    <Checkpoint title="Simple Checkpoint" emitEvent={collectEvents()} />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify checkpoint renders without description", async () => {
      expect(
        canvas.getByText("Checkpoint: Simple Checkpoint")
      ).toBeInTheDocument();
      expect(canvas.getByText("Yes, it is working")).toBeInTheDocument();
      expect(canvas.getByText("No, it didn't work")).toBeInTheDocument();
    });
  },
};
