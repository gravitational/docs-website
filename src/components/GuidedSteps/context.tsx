/**
 * Context management for the GuidedSteps component system.
 * 
 * This module provides a React Context that manages shared state across all GuidedSteps
 * components. It handles:
 * - Active step and file tracking
 * - References to DOM elements for scrolling synchronization
 * - Copy button visibility
 * - State updates coordinated across the step/file hierarchy
 */

import {
  createContext,
  useState,
  useMemo,
  useCallback,
  ReactElement,
  useEffect,
  useRef,
  RefObject,
} from "react";
import { useGuidedStepsData } from "./hooks";
import { StepProps as Step, FileProps as File, CodeBlockHandle } from "./types";

/**
 * Shape of the context value provided to all child components.
 * 
 * This context enables communication between Steps, Files, and CodeBlocks,
 * allowing for synchronized highlighting and scrolling.
 */
interface GuidedStepsContextValue {
  steps: Step[];
  files: File[];
  activeStepId: string | null;
  activeFileName?: string;
  /** Map of step IDs to CodeBlock imperative handles for controlling highlights */
  codeBlockRefs: RefObject<Map<string, CodeBlockHandle>>;
  /** Array of Step DOM element refs for intersection observer and scrolling */
  stepRefs: RefObject<HTMLElement[]>;
  fileRefs: RefObject<Map<string, HTMLDivElement | null>>;
  fileTabRefs: RefObject<Map<string, HTMLLIElement | null>>;
  showCopyButton: boolean;
  /** Whether the active file has a file extension (affects UI features) */
  fileNameHasType: boolean;
  setShowCopyButton: (show: boolean) => void;
  setActiveStepId: (id: string | null) => void;
  setActiveFileName: (name: string | null) => void;
  setCodeBlockRef: (stepId: string, ref: any) => void;
  setFileRef: (fileName: string, ref: HTMLDivElement | null) => void;
  setFileTabRef: (fileName: string, ref: HTMLLIElement | null) => void;
}

const GuidedStepsContext = createContext<GuidedStepsContextValue>(null);

/**
 * Provider component that manages and distributes GuidedSteps state.
 * 
 * @param children - The GuidedSteps component tree
 */
const GuidedStepsProvider: React.FC<{
  children: ReactElement<{ children?: React.ReactNode }>;
}> = ({ children }) => {
  // Extract and validate steps and files from the component tree
  const { steps, files } = useGuidedStepsData({
    children: children.props.children,
  });
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [showCopyButton, setShowCopyButton] = useState<boolean>(false);
  const [fileNameHasType, setFileNameHasType] = useState<boolean>(false);

  // Refs for imperative control and DOM access
  const codeBlockRefs = useRef<Map<string, CodeBlockHandle>>(new Map());
  const stepRefs = useRef<HTMLElement[]>([]);
  const fileRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const fileTabRefs = useRef<Map<string, HTMLLIElement | null>>(new Map());

  /**
   * Register a CodeBlock ref for imperative control.
   * Allows parent components to activate/deactivate code blocks.
   */
  const setCodeBlockRef = useCallback((stepId: string, ref: any) => {
    codeBlockRefs.current.set(stepId, ref);
  }, []);

  /**
   * Register a File container element ref.
   * Used for accessing file content (e.g., for copying text).
   */
  const setFileRef = useCallback(
    (fileName: string, ref: HTMLDivElement | null) => {
      fileRefs.current.set(fileName, ref);
    },
    []
  );

  /**
   * Register a File tab element ref.
   * Used for scrolling tabs into view when they become active.
   */
  const setFileTabRef = useCallback(
    (fileName: string, ref: HTMLLIElement | null) => {
      fileTabRefs.current.set(fileName, ref);
    },
    []
  );

  /**
   * Initialize the active file to the first file on mount.
   */
  useEffect(() => {
    if (files.length > 0 && !activeFileName) {
      setActiveFileName(files[0].name);
    }
  }, [files]);

  /**
   * Determine if the active file has a file extension.
   * Files with extensions get download and copy features.
   */
  useEffect(() => {
    if (activeFileName?.split(".").length > 1) {
      setFileNameHasType(true);
    } else {
      setFileNameHasType(false);
    }
  }, [activeFileName]);

  /**
   * Memoize the context value to prevent unnecessary re-renders.
   * Only updates when one of the dependencies changes.
   */
  const value = useMemo<GuidedStepsContextValue>(
    () => ({
      steps,
      files,
      activeStepId,
      activeFileName,
      codeBlockRefs,
      stepRefs,
      fileRefs,
      fileTabRefs,
      showCopyButton,
      fileNameHasType,
      setShowCopyButton,
      setActiveStepId,
      setActiveFileName,
      setCodeBlockRef,
      setFileRef,
      setFileTabRef,
    }),
    [
      steps,
      files,
      activeStepId,
      activeFileName,
      showCopyButton,
      codeBlockRefs,
      fileNameHasType,
    ]
  );

  return (
    <GuidedStepsContext.Provider value={value}>
      {children}
    </GuidedStepsContext.Provider>
  );
};

export default GuidedStepsProvider;
export { GuidedStepsContext };
