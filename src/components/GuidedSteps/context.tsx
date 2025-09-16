import {
  createContext,
  useState,
  useMemo,
  useCallback,
  ReactElement,
  useEffect,
  useRef,
  MutableRefObject,
} from "react";
import { useGuidedSteps } from "./utils";
import {
  StepProps as Step,
  FileProps as File,
  CodeBlockHandle,
} from "./types";

interface GuidedStepsContextValue {
  steps: Step[];
  files: File[];
  activeStepId: string | null;
  activeFileName?: string | null;
  codeBlockRefs: MutableRefObject<Map<string, CodeBlockHandle>>;
  stepRefs: MutableRefObject<HTMLElement[]>;
  setActiveStepId?: (id: string | null) => void;
  setActiveFileName?: (name: string | null) => void;
  setCodeBlockRef?: (stepId: string, ref: any) => void;
}

const GuidedStepsContext = createContext<GuidedStepsContextValue>(null);

const GuidedStepsProvider: React.FC<{ children: ReactElement }> = ({
  children,
}) => {
  const { steps, files } = useGuidedSteps({
    children: children.props.children,
  });
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const codeBlockRefs = useRef<Map<string, CodeBlockHandle>>(new Map());
  const stepRefs = useRef<HTMLElement[]>([]);

  const setCodeBlockRef = useCallback((stepId: string, ref: any) => {
    codeBlockRefs.current.set(stepId, ref);
  }, []);

  useEffect(() => {
    if (files.length > 0 && !activeFileName) {
      setActiveFileName(files[0].name);
    }
  }, [files]);

  const value = useMemo<GuidedStepsContextValue>(
    () => ({
      steps,
      files,
      activeStepId,
      activeFileName,
      codeBlockRefs,
      stepRefs,
      setActiveStepId,
      setActiveFileName,
      setCodeBlockRef,
    }),
    [steps, files, activeStepId, activeFileName, codeBlockRefs]
  );

  return (
    <GuidedStepsContext.Provider value={value}>
      {children}
    </GuidedStepsContext.Provider>
  );
};

export default GuidedStepsProvider;
export { GuidedStepsContext };
