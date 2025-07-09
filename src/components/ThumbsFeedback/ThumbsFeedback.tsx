import styles from './ThumbsFeedback.module.css';
import React, { FormEvent, useState, useEffect } from "react";
import { useLocation } from '@docusaurus/router';
import Icon from "../Icon/Icon";
import Button from "../Button/Button";
import {GitHubIssueLink} from "@site/src/components/GitHubIssueLink";
import { trackEvent } from '@site/src/utils/analytics';

const MAX_COMMENT_LENGTH: number = 500;

interface FeedbackData {
  feedback: string | null;
  comment: string;
  url: string;
}

const isValidComment = (input: string): boolean => {
  const trimmed = input.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_COMMENT_LENGTH;
};

const ThumbsFeedback = (): JSX.Element => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [comment, setComment] = useState<string>("");
  const [showButtons, setShowButtons] = useState<boolean>(true);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSidebarScrollable, setIsSidebarScrollable] = useState<boolean>(false);  
  const location = useLocation();

  if (isSubmitted) {
    return <p>Thank you for your feedback.</p>;
  }

  const forwardData = async (data: FeedbackData): Promise<void> => {
    const JSONdata = JSON.stringify(data);
    // Adjust endpoint to work with your Docusaurus setup
    const endpoint = "/api/feedback/";

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONdata,
    };

    try {
      const response = await fetch(endpoint, options);
      const result = await response.json();
      
      // Send feedback to posthog
      // void sendDocsFeedback(feedback, comment);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Reset state on page navigation
  useEffect(() => {
    setShowButtons(true);
    setIsSubmitted(false);
    setFeedback(null);
    setComment("");
  }, [location.pathname]);

  // Check if sidebar is scrollable
  useEffect(() => {
    const checkSidebarScrollable = (): void => {
      const tocDesktop: Element | null = document.querySelector('.theme-doc-toc-desktop');
      if (tocDesktop) {
        const isScrollable: boolean = tocDesktop.scrollHeight > tocDesktop.clientHeight;
        setIsSidebarScrollable(isScrollable);
      }
    };

    checkSidebarScrollable();
    window.addEventListener('resize', checkSidebarScrollable);
    const timer = setTimeout(checkSidebarScrollable, 100);

    return (): void => {
      window.removeEventListener('resize', checkSidebarScrollable);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!isValidComment(comment)) {
      // Optionally show an error to the user
      return;
    }

    const trimmedComment = comment.trim();

    // Send comment submission to Google Analytics
    trackEvent({
      event_name: 'feedback_comment_submit',
      event_category: 'engagement',
      event_label: `comment_${feedback}`,
      custom_parameters: {
        feedback_type: feedback,
        has_comment: trimmedComment.length > 0,
        comment_length: trimmedComment.length
      }
    });

    const data: FeedbackData = {
      feedback,
      comment: trimmedComment,
      url: window.location.pathname,
    };
    console.log(data)
    // await forwardData(data);
    setIsSubmitted(true);
  };

  const handleFeedbackClick = async (feedbackValue: string): Promise<void> => {
    setFeedback(feedbackValue);
    setShowButtons(false);
    
    // Send thumb click to Google Analytics
    trackEvent({
      event_name: 'feedback_thumb_click',
      event_category: 'engagement',
      event_label: `thumb_${feedbackValue}`,
      custom_parameters: {
        feedback_type: feedbackValue
      }
    });
    
    const data: FeedbackData = {
      feedback: feedbackValue,
      comment: "",
      url: window.location.pathname,
    };

    // await forwardData(data);
  };

  const shouldShowFeedback: boolean = !isSidebarScrollable;

  return (
    <div className={styles.thumbsFeedback}>
      <form onSubmit={handleSubmit}>
        <div id="feedbackContainer" className={styles.feedbackForm}>
          {shouldShowFeedback && (
            <p id="feedback" className={styles.feedbackTitle}>
              Was this page helpful?
            </p>
          )}
          {shouldShowFeedback && showButtons ? (
            <div className={styles.svgContainer}>
              <span
                className={styles.thumbsUp}
                style={{ cursor: "pointer" }}
                onClick={() => handleFeedbackClick("yes")}
                tabIndex={0}
                role="button"
                aria-label="Thumbs up"
              >
                <Icon name="thumbsUp" size="md" />
              </span>
              <span
                className={styles.thumbsDown}
                style={{ cursor: "pointer" }}
                onClick={() => handleFeedbackClick("no")}
                tabIndex={0}
                role="button"
                aria-label="Thumbs down"
              >
                <Icon name="thumbsDown" size="md" />
              </span>
            </div>
          ) : shouldShowFeedback ? (
            <div>
              <div className={styles.buttonContainer}>
                <textarea
                  id="comment"
                  name="comment"
                  value={comment}
                  placeholder="Any additional comments..."
                  onChange={(e) => setComment(e.target.value)}
                  className={`${styles.commentTextarea} ${comment.length > MAX_COMMENT_LENGTH ? styles.error : ''}`}
                />
                <div className={`${styles.characterCount} ${comment.length > MAX_COMMENT_LENGTH ? styles.error : ''}`}>
                  Max 500 characters ({comment.length}/{MAX_COMMENT_LENGTH})
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
                    <GitHubIssueLink pathname={location.pathname}/>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default ThumbsFeedback;