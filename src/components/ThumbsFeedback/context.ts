import { createContext } from "react";
import { FeedbackType } from "./types";

interface ThumbsFeedbackContextType {
  feedback: FeedbackType | null;
  setFeedback: (feedback: FeedbackType | null) => void;
}

const ThumbsFeedbackContext = createContext<ThumbsFeedbackContextType | null>(null);

export default ThumbsFeedbackContext;