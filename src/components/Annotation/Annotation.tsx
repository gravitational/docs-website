import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Annotation.module.css";
import { useWindowSize } from "@docusaurus/theme-common";
import cn from "classnames";
import { set } from "date-fns";

// Annotations are meant for RFD documents only
const Annotation: React.FC<{
  title?: string;
  text: string;
  children: React.ReactNode;
}> = ({ title, text, children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [annotationContainer, setAnnotationContainer] =
    useState<HTMLElement | null>(null);
  const [initialVerticalOffset, setInitialVerticalOffset] = useState(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const markRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  const windowSize = useWindowSize();
  const isMobile = windowSize === "mobile";

  const isHighlighted = isHovered || isActive;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsActive((prev) => !prev);
  };

  useEffect(() => {
    setAnnotationContainer(document.getElementById("annotations"));
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside both marker and text
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

  useLayoutEffect(() => {
    const handleSetInitialVerticalOffset = () => {
      if (!markRef.current || !annotationContainer) return;

      const markRect = markRef.current.getBoundingClientRect();
      const textRect = textRef.current?.getBoundingClientRect();
      let offset =
        markRef.current.offsetTop - annotationContainer.offsetTop - 8;
      if (isMobile) offset = markRect.top - textRect.height - 8;
      const headerHeight = parseInt(
        document.documentElement.style.getPropertyValue("--ifm-navbar-height"),
      );
      // Adjust offset if it would go off-screen on mobile
      if (isMobile && offset + textRect.height > window.innerHeight) {
        offset = window.innerHeight - textRect.height - 16;
      }

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

  // Listen for position changes in other annotations
  useLayoutEffect(() => {
    if (!annotationContainer) return;

    const observer = new MutationObserver((mutations) => {
      // Skip if we're currently updating to prevent cascading loops
      if (isUpdatingRef.current) return;

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

    observer.observe(annotationContainer, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [annotationContainer]);

  const verticalOffsetValue = useMemo(() => {
    if (!markRef.current || !annotationContainer) return;
    let desiredOffset =
      markRef.current.offsetTop - annotationContainer.offsetTop - 58; // 58px to account for annotation text height

    // Only check for overlaps if textRef is available (after initial render)
    if (textRef.current) {
      // find the preceding annotation element
      const precedingAnnotation = textRef.current
        .previousElementSibling as HTMLDivElement;

      if (precedingAnnotation) {
        const precedingBottom =
          precedingAnnotation.offsetTop + precedingAnnotation.offsetHeight;

        // If our position would overlap, move below the preceding annotation
        if (
          desiredOffset - precedingBottom < 400 ||
          precedingBottom >= desiredOffset
        ) {
          desiredOffset = precedingBottom + 8;
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
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onClick={handleClick}
      >
        {children}
        {isMobile && (
          <div
            ref={textRef}
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
            {text}
          </div>
        )}
      </mark>
      {!isMobile &&
        annotationContainer &&
        createPortal(
          <div
            ref={textRef}
            className={cn(styles.annotationText, {
              [styles.annotationTextHovered]: isHighlighted,
            })}
            style={{ top: `${verticalOffsetValue}px` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
          >
            {title && <div className={styles.annotationTitle}>{title}</div>}
            {text}
          </div>,
          annotationContainer,
        )}
    </>
  );
};

export default Annotation;
