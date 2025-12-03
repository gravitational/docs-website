import { useState } from "react";
import cn from "classnames";
import Icon from "../Icon";
import styles from "./Checkpoint.module.css";
import Button from "../Button";
import Link from "../Link";
import { trackEvent } from "/src/utils/analytics";
import {
  containsPII,
  isValidCommentLength,
  MAX_COMMENT_LENGTH,
} from "/src/utils/validations";

interface CheckpointProps {
  title: string;
  description?: string;
  emitEvent?: (name: string, params: any) => {};
  children?: React.ReactNode;
}

enum FeedbackType {
  UP = "positive",
  DOWN = "negative",
}

const Checkpoint: React.FC<CheckpointProps> = ({
  title,
  description,
  emitEvent,
  children,
}) => {
  const [opinionGiven, setOpinionGiven] = useState<FeedbackType | null>(null);
  const [comment, setComment] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleOpinionGiven = (feedback: FeedbackType) => {
    setOpinionGiven(feedback);

    trackEvent({
      event_name: `docs_checkpoint_feedback_${feedback}`,
      custom_parameters: {
        checkpoint_title: title,
      },
      emitEvent: emitEvent,
    });
  };

  const submitCheckpointFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValidCommentLength(comment, MAX_COMMENT_LENGTH)) {
      return;
    }

    const trimmedComment = comment.trim();

    if (!containsPII(trimmedComment)) {
      trackEvent({
        event_name: `docs_checkpoint_feedback_comment_${opinionGiven}`,
        custom_parameters: {
          checkpoint_title: title,
          comment_text: trimmedComment,
        },
        emitEvent: emitEvent,
      });
    }
  };

  return (
    <div className={styles.checkpoint}>
      <div className={styles.header}>
        <Icon name="flag2" size="md" />
        <p className={styles.heading}>Checkpoint: {title}</p>
      </div>
      <div>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <>
        {submitted && (
          <div className={styles.thankYouMessage}>
            <Icon name="checkCircle" size="md" />{" "}
            <span>Thank you. Your feedback has been submitted.</span>
          </div>
        )}

        {!submitted && opinionGiven && (
          <>
            {opinionGiven === FeedbackType.DOWN && (
              <div>
                <p className={styles.title}>Thanks for letting us know!</p>
                {children ? (
                  children
                ) : (
                  <>
                    <p>Here are some troubleshooting tips:</p>
                    <ul>
                      <li>Ensure your internet connection is stable.</li>
                      <li>
                        Make sure that the feature is supported in your active
                        Teleport edition by checking the{" "}
                        <Link href="https://goteleport.com/feature-matrix/">
                          Teleport feature matrix
                        </Link>
                        .
                      </li>
                      <li>
                        Visit our{" "}
                        <Link href="https://goteleport.com/faq/">FAQ page</Link>{" "}
                        for common issues and their answers.
                      </li>
                    </ul>
                  </>
                )}
                <p>
                  You can reach out to our{" "}
                  <Link href="https://goteleport.com/community-slack/">
                    Slack community
                  </Link>{" "}
                  or{" "}
                  <Link href="https://support.goteleport.com/hc/en-us">
                    customer support
                  </Link>{" "}
                  for help.
                </p>
              </div>
            )}
            <form
              className={styles.feedbackForm}
              onSubmit={submitCheckpointFeedback}
            >
              <label>
                <span className={styles.title}>
                  {opinionGiven === FeedbackType.UP
                    ? "That's great! What can we do to improve?"
                    : "What can we do to improve?"}
                </span>
                <textarea
                  className={styles.textarea}
                  placeholder="Could you share more about your experience?"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
              <div className={styles.formButtons}>
                <Button
                  as="button"
                  type="submit"
                  className={cn(styles.submitButton, {
                    [styles.disabled]: !isValidCommentLength(
                      comment,
                      MAX_COMMENT_LENGTH
                    ),
                  })}
                  disabled={!isValidCommentLength(comment, MAX_COMMENT_LENGTH)}
                >
                  Submit
                </Button>
                <Button
                  as="button"
                  variant="secondary"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setOpinionGiven(null);
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </>
        )}

        {!submitted && !opinionGiven && (
          <div className={styles.buttons}>
            <Button
              as="button"
              variant="success"
              onClick={() => handleOpinionGiven(FeedbackType.UP)}
            >
              Yes, it is working
            </Button>
            <Button
              as="button"
              variant="failure"
              onClick={() => handleOpinionGiven(FeedbackType.DOWN)}
            >
              No, it didn't work
            </Button>
          </div>
        )}
      </>
    </div>
  );
};

export default Checkpoint;
