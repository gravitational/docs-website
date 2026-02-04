import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Annotation.module.css";
import { useWindowSize } from "@docusaurus/theme-common";
import cn from "classnames";

// Annotations are meant for RFD documents only
const Annotation: React.FC<{
  title?: string;
  text: string;
  children: React.ReactNode;
}> = ({ title, text, children }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [annotationContainer, setAnnotationContainer] =
    useState<HTMLElement | null>(null);
  const [initialVerticalOffset, setInitialVerticalOffset] = useState<
    number | null
  >(null);
  const [updateTrigger, setUpdateTrigger] = useState<number>(0);
  const markRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const windowSize = useWindowSize();
  const isMobile = windowSize === "mobile";
  const annotationId = useId();

  const annotationGap = 8; // Gap between annotation marker and text

  const isHighlighted = isHovered || isActive;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsActive((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsActive((prev) => !prev);
    }
  };

  useEffect(() => {
    setAnnotationContainer(document.getElementById("annotations"));
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // Close annotation if the user clicks outside of it
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        markRef.current &&
        !markRef.current.contains(target) &&
        textRef.current &&
        !textRef.current.contains(target)
      ) {
        setIsActive(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [isActive]);

  // Set initial vertical offset of annotations
  // Also adjust the position of annotations dynamically on mobile screens
  useLayoutEffect(() => {
    const handleSetInitialVerticalOffset = () => {
      if (!markRef.current || !annotationContainer) return;

      const markRect = markRef.current.getBoundingClientRect();
      const textRect = textRef.current?.getBoundingClientRect();
      let offset =
        markRef.current.offsetTop -
        annotationContainer.offsetTop -
        annotationGap;

      // on mobile, position relative to viewport instead of container
      if (isMobile) offset = markRect.top - textRect.height - annotationGap;

      const headerHeight = parseInt(
        document.documentElement.style.getPropertyValue("--ifm-navbar-height"),
      );
      // pin to the bottom if it would go off-screen on mobile
      if (isMobile && offset + textRect.height > window.innerHeight) {
        offset = window.innerHeight - textRect.height - 16;
      }

      // pin to the top if it would go under the header on mobile
      if (isMobile && offset < headerHeight) {
        offset = headerHeight + 16;
      }

      setInitialVerticalOffset(offset);
    };

    handleSetInitialVerticalOffset();

    window.addEventListener("resize", handleSetInitialVerticalOffset);

    if (isMobile)
      window.addEventListener("scroll", handleSetInitialVerticalOffset);
    return () => {
      window.removeEventListener("resize", handleSetInitialVerticalOffset);
      window.removeEventListener("scroll", handleSetInitialVerticalOffset);
    };
  }, [annotationContainer, isMobile]);

  // Listen for position and size changes in other annotations
  useLayoutEffect(() => {
    if (!annotationContainer) return;

    const mutationObserver = new MutationObserver((mutations) => {
      // Check if any mutation affected annotation positions
      const hasPositionChange = mutations.some((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          const target = mutation.target as HTMLElement;
          // Only trigger if it's a different annotation's position change
          return (
            target !== textRef.current &&
            target.classList.contains(styles.annotationText)
          );
        }
        return false;
      });

      if (hasPositionChange) {
        setUpdateTrigger((prev) => prev + 1);
      }
    });

    // Watch for size changes in annotation elements (expand/collapse) in order to reposition others
    const resizeObserver = new ResizeObserver((entries) => {
      const hasRelevantResize = entries.some((entry) => {
        const target = entry.target as HTMLElement;
        return (
          target !== textRef.current &&
          target.classList.contains(styles.annotationText)
        );
      });

      if (hasRelevantResize) {
        setUpdateTrigger((prev) => prev + 1);
      }
    });

    mutationObserver.observe(annotationContainer, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
    });

    const annotationElements = annotationContainer.querySelectorAll(
      `.${styles.annotationText}`,
    );
    annotationElements.forEach((el) => resizeObserver.observe(el));

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [annotationContainer]);

  const verticalOffsetValue = useMemo(() => {
    if (!markRef.current || !annotationContainer) return;

    const annotationHeight = textRef.current?.getBoundingClientRect().height;
    // Initial desired offset is in line with the mark element
    let desiredOffset =
      markRef.current.offsetTop -
      annotationContainer.offsetTop -
      annotationHeight * 0.25;

    if (textRef.current) {
      // find the preceding annotation element
      const precedingAnnotation = textRef.current
        .previousElementSibling as HTMLDivElement;

      if (precedingAnnotation) {
        const precedingBottom =
          precedingAnnotation.offsetTop + precedingAnnotation.offsetHeight;

        // If the gap between the preceding annotation and the desired offset is less than 200px,
        // position this annotation 8px below the preceding one (group annotations that are close to each other).
        // Also, if the positions of annotations would overlap, move below the preceding annotation
        if (
          desiredOffset - precedingBottom < 200 ||
          precedingBottom >= desiredOffset
        ) {
          desiredOffset = precedingBottom + annotationGap;
        }
      }
    }

    return desiredOffset;
  }, [updateTrigger, initialVerticalOffset, annotationContainer]);

  return (
    <>
      <mark
        ref={markRef}
        className={cn(styles.annotationMarker, {
          [styles.annotationMarkerHovered]: isHighlighted,
          [styles.annotationMarkerMobile]: isMobile,
        })}
        role="button"
        tabIndex={0}
        aria-describedby={annotationId}
        aria-expanded={isActive}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
        {isMobile && (
          <div
            ref={textRef}
            id={annotationId}
            role="tooltip"
            style={{
              top: `${initialVerticalOffset}px`,
              opacity: isActive ? 1 : 0,
              visibility: isActive ? "visible" : "hidden",
            }}
            className={cn(styles.annotationText, styles.annotationTextMobile)}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsActive(false);
            }}
          >
            {title && <div className={styles.annotationTitle}>{title}</div>}
            <div className={styles.annotationTextContent}>{text}</div>
          </div>
        )}
      </mark>
      {!isMobile &&
        annotationContainer &&
        createPortal(
          <div
            ref={textRef}
            id={annotationId}
            role="tooltip"
            className={cn(styles.annotationText, {
              [styles.annotationTextHovered]: isHighlighted,
            })}
            style={{ top: `${verticalOffsetValue}px` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
          >
            {title && <div className={styles.annotationTitle}>{title}</div>}
            <div className={styles.annotationTextContent}>{text}</div>
          </div>,
          annotationContainer,
        )}
    </>
  );
};

export default Annotation;
