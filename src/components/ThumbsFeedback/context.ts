import { createContext } from "react";
import { FeedbackType } from "./types";

interface ThumbsFeedbackContextType {
  feedback: FeedbackType | null;
  isSubmitted: boolean;
  setIsSubmitted: (submitted: boolean) => void;
  setFeedback: (feedback: FeedbackType | null) => void;
}

const ThumbsFeedbackContext = createContext<ThumbsFeedbackContextType | null>(
  null
);

export default ThumbsFeedbackContext;
