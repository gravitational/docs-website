import { useLocation } from "@docusaurus/router";
import { trackEvent } from "@site/src/utils/analytics";
import {
  containsPII,
  isValidCommentLength,
  MAX_COMMENT_LENGTH,
} from "@site/src/utils/validations";
import cn from "classnames";
import React, {
  FormEvent,
  JSX,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Button from "../Button/Button";
import Icon from "../Icon/Icon";
import ThumbsFeedbackContext from "./context";
import styles from "./ThumbsFeedback.module.css";
import { FeedbackType, StoredFeedback } from "./types";

const MAX_PATHS_IN_STORAGE = 4;

const checkForExpiredFeedback = (
  itemStr: string,
  currentPath: string
): StoredFeedback[] => {
  let feedbackGivenPaths: StoredFeedback[] = [];
  try {
    const item = JSON.parse(itemStr);

    if (!item || !Array.isArray(item) || item.length === 0)
      return feedbackGivenPaths;

    feedbackGivenPaths = item;

    const now = new Date();

    const foundCurrentPath = feedbackGivenPaths.find(
      (pathItem) => pathItem.path === currentPath
    );

    if (foundCurrentPath && now.getTime() > foundCurrentPath.expiry) {
      // Remove expired path and update storage
      feedbackGivenPaths = feedbackGivenPaths.filter(
        (pathItem) => pathItem.path !== currentPath
      );
      localStorage.setItem(
        "feedback_given_paths",
        JSON.stringify(feedbackGivenPaths)
      );
    }
  } catch (e) {
    localStorage.removeItem("feedback_given_paths");
  }

  return feedbackGivenPaths;
};

const FeedbackForm: React.FC<{
  formActive: "positive" | "negative" | false;
  pagePosition: "top" | "bottom";
  isSubmitted: boolean;
  comment: string;
  feedback: FeedbackType | null;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  setFormActive: React.Dispatch<
    React.SetStateAction<"positive" | "negative" | false>
  >;
  setIsSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  formActive,
  pagePosition,
  isSubmitted,
  comment,
  feedback,
  setComment,
  setFormActive,
  setIsSubmitted,
}) => {
  const [translateX, setTranslateX] = useState<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const translateXRef = useRef(translateX);

  useEffect(() => {
    translateXRef.current = translateX;
  }, [translateX]);

  // If page top position, close the popover when clicking outside
  useEffect(() => {
    if (!formActive || pagePosition === "bottom") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setFormActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSubmitted, formActive]);

  useEffect(() => {
    if (!formActive || !modalRef.current) {
      setTranslateX(0);
      modalRef.current.style.transform = `translate(0, 100%)`;
      return;
    }

    const repositionModal = () => {
      const modalRect = modalRef.current.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();

      if (modalRect.right + 16 > bodyRect.right) {
        const newTranslateX =
          translateXRef.current - (modalRect.right - bodyRect.right) - 48;
        setTranslateX(newTranslateX);
        modalRef.current.style.transform = `translate(${newTranslateX}px, 100%)`;
      }
    };
    repositionModal();
    window.addEventListener("resize", repositionModal);
    return () => window.removeEventListener("resize", repositionModal);
  }, [formActive]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!isValidCommentLength(comment, MAX_COMMENT_LENGTH) || isSubmitted) {
      return;
    }

    const trimmedComment = comment.trim();

    if (!containsPII(trimmedComment)) {
      const currentPath = location.pathname;

      let feedbackGivenPaths: StoredFeedback[] = checkForExpiredFeedback(
        localStorage.getItem("feedback_given_paths"),
        currentPath
      );

      const foundCurrentPath = feedbackGivenPaths.find(
        (pathItem) => pathItem.path === currentPath
      );

      if (foundCurrentPath?.commented && isSubmitted) {
        return;
      } else if (foundCurrentPath) {
        // Update the existing entry to set commented to true
        feedbackGivenPaths = feedbackGivenPaths.map((pathItem) => {
          if (pathItem.path === currentPath) {
            return {
              ...pathItem,
              commented: true,
            };
          }
          return pathItem;
        });
        localStorage.setItem(
          "feedback_given_paths",
          JSON.stringify(feedbackGivenPaths)
        );
        setIsSubmitted(true);
        return;
      }

      // no existing entry, proceed to track event and store new entry

      trackEvent({
        event_name: `docs_feedback_comment_thumbs_${feedback}`,
        custom_parameters: {
          comment_text: trimmedComment,
        },
      });

      const now = new Date();
      // Set expiry to 1 day from now
      now.setDate(now.getDate() + 1);
      const expiry = now.getTime();

      const itemToStore = {
        path: currentPath,
        expiry: expiry,
        signal: feedback,
        commented: true,
      };

      const newFeedbackGivenPaths = [...feedbackGivenPaths, itemToStore];

      localStorage.setItem(
        "feedback_given_paths",
        JSON.stringify(newFeedbackGivenPaths)
      );
    }

    setIsSubmitted(true);
  };

  return (
    <div
      ref={modalRef}
      className={cn(styles.modal, {
        [styles.formActive]: !!formActive,
        [styles.positionBottom]: pagePosition === "bottom",
      })}
    >
      {isSubmitted ? (
        <div className={styles.thankYouMessage}>
          <Icon name="checkRound" size="xs" /> Thank you
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="comment" className={styles.formLabel}>
            {formActive === "positive"
              ? "Great! Is there anything we can improve?"
              : "How can we improve this page?"}
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            value={comment}
            placeholder="Tell us more about your experience"
            onChange={(e) => setComment(e.target.value)}
            className={`${styles.commentTextarea} ${comment.length > MAX_COMMENT_LENGTH ? styles.error : ""}`}
          />
          <div className={styles.buttons}>
            <Button
              as="button"
              type="submit"
              disabled={!isValidCommentLength(comment, MAX_COMMENT_LENGTH)}
            >
              Submit
            </Button>
            <Button as="button" onClick={() => setFormActive(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

const ThumbsFeedback: React.FC<{
  feedbackLabel?: string;
  pagePosition?: "top" | "bottom";
}> = ({
  feedbackLabel = "Is this page helpful?",
  pagePosition = "top",
}): JSX.Element => {
  const { feedback, isSubmitted, setFeedback, setIsSubmitted } = useContext(ThumbsFeedbackContext);
  const [comment, setComment] = useState<string>("");
  const [formActive, setFormActive] = useState<"positive" | "negative" | false>(
    false
  );
  const location = useLocation();

  // Reset feedback form state when navigating to a different page
  useEffect(() => {
    setFormActive(false);
    setIsSubmitted(false);
    setFeedback(null);
    setComment("");

    const currentPath = location.pathname;
    const feedbackGivenPaths = checkForExpiredFeedback(
      localStorage.getItem("feedback_given_paths"),
      currentPath
    );

    const foundCurrentFeedbackPathClick = feedbackGivenPaths.find(
      (pathItem) => pathItem.path === currentPath
    );

    const feedbackCommented = foundCurrentFeedbackPathClick?.commented;

    if (feedbackCommented) {
      setIsSubmitted(true);
    }

    if (foundCurrentFeedbackPathClick) {
      setFeedback(foundCurrentFeedbackPathClick.signal || null);
    }
  }, [location.pathname]);

  const handleFeedbackClick = async (
    feedbackValue: FeedbackType
  ): Promise<void> => {
    const currentPath = location.pathname;
    const itemStr = localStorage.getItem("feedback_given_paths");
    let clickedPaths = checkForExpiredFeedback(itemStr, currentPath);

    const foundCurrentPath = clickedPaths.find(
      (pathItem) => pathItem.path === currentPath
    );

    if (foundCurrentPath && foundCurrentPath.signal === feedbackValue) {
      return;
    } else if (foundCurrentPath) {
      // Remove existing entry for current path to update with new signal
      // Also reset the submission state
      clickedPaths = clickedPaths.filter(
        (pathItem) => pathItem.path !== currentPath
      );
      setIsSubmitted(false);
    }

    setFeedback(feedbackValue);
    setFormActive(false);

    trackEvent({
      event_name: `docs_feedback_thumbs_${feedbackValue}`,
    });

    const now = new Date();
    // Set expiry to 1 day from now
    now.setDate(now.getDate() + 1);
    const expiry = now.getTime();

    const itemToStore = {
      path: currentPath,
      expiry: expiry,
      signal: feedbackValue,
    };

    const newFeedbackThumbsClickedPaths = [...clickedPaths, itemToStore];

    if (newFeedbackThumbsClickedPaths.length > MAX_PATHS_IN_STORAGE) {
      newFeedbackThumbsClickedPaths.splice(
        0,
        newFeedbackThumbsClickedPaths.length - MAX_PATHS_IN_STORAGE
      );
    }

    localStorage.setItem(
      "feedback_given_paths",
      JSON.stringify(newFeedbackThumbsClickedPaths)
    );
  };

  return (
    <div
      className={cn(styles.thumbsFeedback, {
        [styles.positionBottom]: pagePosition === "bottom",
      })}
    >
      <div
        className={cn(styles.feedback, {
          [styles.positionBottom]: pagePosition === "bottom",
        })}
      >
        <span className={styles.feedbackLabel}>{feedbackLabel}</span>
        <div className={styles.thumbs}>
          <button
            className={cn(styles.thumb, {
              [styles.active]: feedback === FeedbackType.UP,
            })}
            aria-label="Yes, this page is helpful"
            onClick={() => {
              handleFeedbackClick(FeedbackType.UP);
              setFormActive("positive");
            }}
          >
            <Icon name="thumbsUp" size="sm" />
            {pagePosition === "bottom" && <span>Yes</span>}
          </button>
          <button
            className={cn(styles.thumb, {
              [styles.active]: feedback === FeedbackType.DOWN,
            })}
            aria-label="No, this page is not helpful"
            onClick={() => {
              handleFeedbackClick(FeedbackType.DOWN);
              setFormActive("negative");
            }}
          >
            <Icon name="thumbsDown" size="sm" />
            {pagePosition === "bottom" && <span>No</span>}
          </button>
          {pagePosition === "top" && (
            <FeedbackForm
              formActive={formActive}
              pagePosition={pagePosition}
              isSubmitted={isSubmitted}
              comment={comment}
              feedback={feedback}
              setComment={setComment}
              setFormActive={setFormActive}
              setIsSubmitted={setIsSubmitted}
            />
          )}
        </div>
      </div>
      {pagePosition === "bottom" && (
        <FeedbackForm
          formActive={formActive}
          pagePosition={pagePosition}
          isSubmitted={isSubmitted}
          comment={comment}
          feedback={feedback}
          setComment={setComment}
          setFormActive={setFormActive}
          setIsSubmitted={setIsSubmitted}
        />
      )}
    </div>
  );
};

export default ThumbsFeedback;
