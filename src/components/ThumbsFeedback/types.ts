enum FeedbackType {
  UP = "up",
  DOWN = "down",
}

interface StoredFeedback {
  path: string;
  expiry: number;
  signal?: FeedbackType;
  commented?: boolean;
}

interface ThumbsFeedbackContextType {
  feedback: FeedbackType | null;
  setFeedback: (feedback: FeedbackType | null) => void;
}

export { FeedbackType, StoredFeedback, ThumbsFeedbackContextType };
