import React, { useState } from 'react';
import styles from './ThumbsFeedback.module.css';

// Define gtag on window object for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const ThumbsFeedback = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (type: 'up' | 'down') => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'feedback', {
        event_category: 'Thumbs',
        event_label: type,
        value: 1,
      });
    }

    setSubmitted(true);
  };

  if (submitted) {
    return <div className={styles.feedbackMessage}>Thanks for the feedback!</div>;
  }

  return (
    <div className={styles.feedbackForm}>
      <div className={styles.svgContainer}>
        <p className={styles.feedbackTitle}>Was this page helpful?</p>
        <div className={styles.buttonContainer}>
          <button
            onClick={() => handleFeedback('up')}
            aria-label="Thumbs up"
            className={styles.feedbackButton}
          >
            👍
          </button>
          <span className={styles.buttonSeparator}></span>
          <button
            onClick={() => handleFeedback('down')}
            aria-label="Thumbs down"
            className={styles.feedbackButton}
          >
            👎
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThumbsFeedback;

