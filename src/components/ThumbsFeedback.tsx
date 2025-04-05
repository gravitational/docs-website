import React, { useState } from 'react';
import styles from "./ThumbsFeedback.module.css";

const ThumbsFeedback = () => {
  console.log("👍 ThumbsFeedback component rendered"); // <-- Add this line

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
    return <p>Thanks for the feedback!</p>;
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
      <button onClick={() => handleFeedback('up')} aria-label="Thumbs up" style={{ fontSize: '1.5rem' }}>
        👍
      </button>
      <button onClick={() => handleFeedback('down')} aria-label="Thumbs down" style={{ fontSize: '1.5rem' }}>
        👎
      </button>
    </div>
  );
};

export default ThumbsFeedback;

