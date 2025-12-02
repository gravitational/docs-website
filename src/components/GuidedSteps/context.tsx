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

interface GuidedStepsContextValue {
  steps: Step[];
  files: File[];
  activeStepId: string | null;
  activeFileName?: string;
  codeBlockRefs: RefObject<Map<string, CodeBlockHandle>>;
  stepRefs: RefObject<HTMLElement[]>;
  fileRefs: RefObject<Map<string, HTMLDivElement | null>>;
  showCopyButton: boolean;
  fileNameHasType: boolean;
  setShowCopyButton: (show: boolean) => void;
  setActiveStepId: (id: string | null) => void;
  setActiveFileName: (name: string | null) => void;
  setCodeBlockRef: (stepId: string, ref: any) => void;
  setFileRef: (fileName: string, ref: HTMLDivElement | null) => void;
}

const GuidedStepsContext = createContext<GuidedStepsContextValue>(null);

const GuidedStepsProvider: React.FC<{ children: ReactElement }> = ({
  children,
}) => {
  const { steps, files } = useGuidedStepsData({
    children: children.props.children,
  });
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [showCopyButton, setShowCopyButton] = useState<boolean>(false);
  const [fileNameHasType, setFileNameHasType] = useState<boolean>(false);

  const codeBlockRefs = useRef<Map<string, CodeBlockHandle>>(new Map());
  const stepRefs = useRef<HTMLElement[]>([]);
  const fileRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const setCodeBlockRef = useCallback((stepId: string, ref: any) => {
    codeBlockRefs.current.set(stepId, ref);
  }, []);

  const setFileRef = useCallback(
    (fileName: string, ref: HTMLDivElement | null) => {
      fileRefs.current.set(fileName, ref);
    },
    []
  );

  useEffect(() => {
    if (files.length > 0 && !activeFileName) {
      setActiveFileName(files[0].name);
    }
  }, [files]);

  useEffect(() => {
    if (activeFileName?.split(".").length > 1) {
      setFileNameHasType(true);
    } else {
      setFileNameHasType(false);
    }
  }, [activeFileName]);

  const value = useMemo<GuidedStepsContextValue>(
    () => ({
      steps,
      files,
      activeStepId,
      activeFileName,
      codeBlockRefs,
      stepRefs,
      fileRefs,
      showCopyButton,
      fileNameHasType,
      setFileNameHasType,
      setShowCopyButton,
      setActiveStepId,
      setActiveFileName,
      setCodeBlockRef,
      setFileRef,
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
