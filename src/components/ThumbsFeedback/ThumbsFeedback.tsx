import styles from "./ThumbsFeedback.module.css";
import React, { FormEvent, useState, useEffect } from "react";
import { useLocation } from "@docusaurus/router";
import Icon from "../Icon/Icon";
import Button from "../Button/Button";
import { GitHubIssueLink } from "@site/src/components/GitHubIssueLink";
import { trackEvent } from "@site/src/utils/analytics";
import { isValidCommentLength, containsPII } from "@site/src/utils/validations";

const MAX_COMMENT_LENGTH: number = 100;

enum FeedbackType {
  UP = "up",
  DOWN = "down",
}

const ThumbsFeedback = (): JSX.Element => {
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [comment, setComment] = useState<string>("");
  const [showButtons, setShowButtons] = useState<boolean>(true);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSidebarScrollable, setIsSidebarScrollable] = useState<boolean>(true);
  const location = useLocation();

  // Reset feedback form state when navigating to a different page
  useEffect(() => {
    setShowButtons(true);
    setIsSubmitted(false);
    setFeedback(null);
    setComment("");
  }, [location.pathname]);

  // Currently feedback will be hidden if sidebar is scrollable AND within 350 of the bottom as this is the height when the textarea is active
  // Can plan to implement this better going forward
  useEffect(() => {
    const checkSidebarScrollable = (): void => {
      const tocDesktop: Element | null = document.querySelector(
        ".theme-doc-toc-desktop",
      );
      if (tocDesktop) {
        const isScrollable: boolean =
          tocDesktop.scrollHeight > tocDesktop.clientHeight;
        const viewportHeight: number = window.innerHeight;
        const tocRect = tocDesktop.getBoundingClientRect();
        const spaceBelow: number = viewportHeight - tocRect.bottom;
        const wouldOverflowWithTextArea: boolean = spaceBelow < 300;

        setIsSidebarScrollable(isScrollable || wouldOverflowWithTextArea);
      }
    };
    checkSidebarScrollable();

    window.addEventListener("resize", checkSidebarScrollable);
    const timer = setTimeout(checkSidebarScrollable, 100);

    return (): void => {
      window.removeEventListener("resize", checkSidebarScrollable);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  const handleFeedbackClick = async (
    feedbackValue: FeedbackType,
  ): Promise<void> => {
    setFeedback(feedbackValue);
    setShowButtons(false);

    trackEvent({
      event_name: `docs_feedback_thumbs_${feedbackValue}`,
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!isValidCommentLength(comment, MAX_COMMENT_LENGTH)) {
      return;
    }

    const trimmedComment = comment.trim();

    if (!containsPII(trimmedComment)) {
      trackEvent({
        event_name: `docs_feedback_comment_thumbs_${feedback}`,
        custom_parameters: {
          comment_text: trimmedComment,
        },
      });
    }

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return <p>Thank you for your feedback.</p>;
  }

  if (isSidebarScrollable) {
    return null;
  }

  return (
    <div className={styles.thumbsFeedback}>
      <form onSubmit={handleSubmit}>
        <p id="feedback" className={styles.feedbackTitle}>
          Was this page helpful?
        </p>
        {showButtons ? (
          <div className={styles.svgContainer}>
            <span
              className={styles.thumbsUp}
              style={{ cursor: "pointer" }}
              onClick={() => handleFeedbackClick(FeedbackType.UP)}
              tabIndex={0}
              role="button"
              aria-label="Thumbs up"
            >
              <Icon name="thumbsUp" size="md" />
            </span>
            <span
              className={styles.thumbsDown}
              style={{ cursor: "pointer" }}
              onClick={() => handleFeedbackClick(FeedbackType.DOWN)}
              tabIndex={0}
              role="button"
              aria-label="Thumbs down"
            >
              <Icon name="thumbsDown" size="md" />
            </span>
          </div>
        ) : (
          <div>
            <textarea
              id="comment"
              name="comment"
              value={comment}
              placeholder="Any additional comments..."
              onChange={(e) => setComment(e.target.value)}
              className={`${styles.commentTextarea} ${comment.length > MAX_COMMENT_LENGTH ? styles.error : ""}`}
            />
            <div
              className={`${styles.characterCount} ${comment.length > MAX_COMMENT_LENGTH ? styles.error : ""}`}
            >
              ({comment.length}/{MAX_COMMENT_LENGTH}) characters allowed
            </div>
            <div className={styles.submitButton}>
              <Button
                type="submit"
                as="button"
                variant="primary"
                disabled={comment.length > MAX_COMMENT_LENGTH}
              >
                Submit
              </Button>
              <p className={styles.feedbackTitle}> or </p>
              <div className={styles.githubLinkWrapper}>
                <GitHubIssueLink pathname={location.pathname} />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ThumbsFeedback;
