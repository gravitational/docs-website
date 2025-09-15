import React, {
  createContext,
  useState,
  useMemo,
  useCallback,
  ReactElement,
} from "react";
import { useGuidedSteps } from "./utils";
import {
  StepProps as Step,
  FileProps as File,
  GuidedStepsProps,
  CodeBlockHandle,
} from "./types";

interface GuidedStepsContextValue {
  steps: Step[];
  files: File[];
  activeStepId: string | null;
  activeFileName?: string | null;
  codeBlockRefs: React.MutableRefObject<Map<string, CodeBlockHandle>>;
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
  const codeBlockRefs = React.useRef<Map<string, CodeBlockHandle>>(new Map());

  const setCodeBlockRef = useCallback((stepId: string, ref: any) => {
    codeBlockRefs.current.set(stepId, ref);
  }, []);

  const value = useMemo<GuidedStepsContextValue>(
    () => ({
      steps,
      files,
      activeStepId,
      activeFileName,
      codeBlockRefs,
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
