/**
 * Custom React hooks for GuidedSteps functionality.
 * 
 * This module provides:
 * - useGuidedStepsData: Extracts and validates steps/files from component children
 * - useGuidedSteps: Implements intersection observer for step highlighting and scroll sync
 */

import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { GuidedStepsProps } from "./types";
import { extractCodeBlocksFromFile, extractFiles, extractSteps } from "./utils";
import { GuidedStepsContext } from "./context";

/**
 * Custom hook to extract and validate steps and files from GuidedSteps children.
 * 
 * This hook:
 * - Extracts all Step components from children
 * - Extracts all File components from children
 * - Validates that each step has a corresponding code block
 * - Throws an error if any step lacks a matching code block
 * - Memoizes the result to prevent unnecessary re-computation
 * 
 * @param props - GuidedStepsProps containing children to extract from
 * @returns Object containing arrays of steps and files
 * @throws Error if a step doesn't have a corresponding code block
 */
export const useGuidedStepsData = (props: GuidedStepsProps) => {
  const { children } = props;
  return useMemo(() => {
    const steps = extractSteps(children);
    const files = extractFiles(children);

    const codeBlocks = files.flatMap(extractCodeBlocksFromFile);
    // Ensure that each step has a corresponding code block.
    steps.forEach((step) => {
      const matchingCodeBlock = codeBlocks.find(
        (codeBlock) => codeBlock.stepId === step.id,
      );
      if (!matchingCodeBlock) {
        throw new Error(
          `GuidedSteps: No code block found for step with id "${step.id}". Please ensure that each step has a corresponding code block with a matching stepId.`,
        );
      }
    });
    return { steps, files };
  }, [children]);
};

/**
 * Custom hook that manages step highlighting based on scroll position.
 * 
 * This hook implements an IntersectionObserver to automatically highlight the
 * most visible step as the user scrolls through the instructions. It also handles:
 * - Debouncing to prevent rapid highlight changes
 * - Coordinating with code block highlights in the right column
 * - Preventing observer conflicts when steps are clicked
 * - Reinitializing observer on window resize
 * - Smooth scroll synchronization between steps and code blocks
 * 
 * The hook calculates visibility based on the viewport, accounting for the navbar
 * height and comparing visible pixel area rather than simple intersection ratios
 * to better handle steps of different heights.
 */
export const useGuidedSteps = () => {
  const { activeStepId, codeBlockRefs, stepRefs, setActiveStepId } =
    useContext(GuidedStepsContext);

  const observerRef = useRef<IntersectionObserver | null>(null);
  // Track last time a step was highlighted to implement debouncing
  const lastHighlightTime = useRef<number>(0);
  // Track pending highlight to implement debouncing
  const pendingHighlight = useRef<string | undefined>(undefined);
  // Flag to temporarily ignore intersection events (e.g., during user-initiated scrolls)
  const ignoreIntersection = useRef<boolean>(false);

  useLayoutEffect(() => {
    const debounceDelay = 50; // milliseconds
    let resizeTimeout: NodeJS.Timeout;

    /**
     * Debounces step highlighting to prevent rapid changes.
     * 
     * @param stepId - ID of the step to highlight
     */
    const debounceHighlightedStep = (stepId: string) => {
      if (ignoreIntersection.current) return;

      const now = Date.now();
      pendingHighlight.current = stepId;

      if (now - lastHighlightTime.current > debounceDelay) {
        highlightStep(stepId, true);
        lastHighlightTime.current = now;
        pendingHighlight.current = undefined;
      } else {
        setTimeout(() => {
          if (pendingHighlight.current === stepId) {
            highlightStep(stepId, true);
            lastHighlightTime.current = Date.now();
            pendingHighlight.current = undefined;
          }
        }, debounceDelay);
      }
    };

    const initializeObserver = () => {
      // Disconnect existing observer before creating a new one
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Get navbar height to adjust visible area calculation
      const navHeight =
        parseInt(
          document.documentElement.style.getPropertyValue(
            "--ifm-navbar-height",
          ),
        ) || 117;

      const rootBottomMargin =
        document.body.getBoundingClientRect().height - navHeight * 2;

      const options = {
        rootMargin: `-${navHeight + 16}px 0px -${rootBottomMargin}px 0px`,
        threshold: Array.from({ length: 1000 }, (_, i) => i / 1000),
      };

      // Detect if device is mobile
      const isMobile = window.innerWidth <= 768;

      observerRef.current = new IntersectionObserver((entries) => {
        if (ignoreIntersection.current) return;

        // On mobile, just check if intersecting; on desktop, also check intersection ratio
        const visibleEntries = isMobile
          ? entries.filter((entry) => entry.isIntersecting)
          : entries.filter(
              (entry) => entry.isIntersecting && entry.intersectionRatio > 0.3
            );

        if (visibleEntries.length > 0) {
          // Compare by visible pixel area instead of just intersection ratio
          // to better handle cases where steps have different heights
          const mostVisibleEntry = visibleEntries.reduce((max, entry) =>
            entry.intersectionRect.height > max.intersectionRect.height
              ? entry
              : max,
          );

          debounceHighlightedStep(mostVisibleEntry.target.id);
        }
      }, options);

      // Observe all step elements
      stepRefs.current.forEach((step) => {
        if (observerRef.current) {
          observerRef.current.observe(step);
        }
      });
    };

    /**
     * Handles window resize by reinitializing the observer with updated dimensions.
     * Debounced to avoid excessive reinitializations during resize.
     */
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      ignoreIntersection.current = true;

      resizeTimeout = setTimeout(() => {
        initializeObserver();
        ignoreIntersection.current = false;
      }, 150);
    };

    initializeObserver();

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /**
   * Highlights a step and its corresponding code block.
   * 
   * When triggered by user interaction (click), temporarily disables the
   * intersection observer to prevent conflicts with programmatic scrolling.
   * 
   * @param stepId - ID of the step to highlight
   * @param fromObserver - Whether this was triggered by the intersection observer
   */
  const highlightStep = useCallback(
    (stepId: string, fromObserver = false) => {
      if (stepId === activeStepId) return;
      setActiveStepId(stepId);
      // Deactivate all code blocks, then activate the one for this step
      codeBlockRefs.current.forEach((step) => step.deactivate());
      codeBlockRefs.current.get(stepId)?.activate();

      // Only set the ignore flag if this was triggered with a click (not from observer)
      if (!fromObserver) {
        ignoreIntersection.current = true;

        // Re-enable observer after scroll completes
        setTimeout(() => {
          ignoreIntersection.current = false;
        }, 1000);
      }
    },
    [activeStepId],
  );
};
