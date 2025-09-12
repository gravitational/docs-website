import React, { createContext, useState, useMemo } from "react";
import { useGuidedSteps } from "./utils";
import { StepProps as Step, FileProps as File, GuidedStepsProps } from "./types";

interface GuidedStepsContextValue {
  steps: Step[];
  files: File[];
  activeStepId: string | null;
  activeFileName?: string | null;
  setActiveStepId?: (id: string | null) => void;
  setActiveFileName?: (name: string | null) => void;
}

const GuidedStepsContext = createContext<GuidedStepsContextValue>(null);

const GuidedStepsProvider: React.FC<GuidedStepsProps> = ({ children }) => {
  const { steps, files } = useGuidedSteps({ children });
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);

  const value = useMemo<GuidedStepsContextValue>(() => ({
    steps,
    files,
    activeStepId,
    activeFileName,
    setActiveStepId,
    setActiveFileName,
  }), [steps, files, activeStepId, activeFileName]);

  return (
    <GuidedStepsContext.Provider value={value}>
      {children}
    </GuidedStepsContext.Provider>
  );
};

export default GuidedStepsProvider;
export { GuidedStepsContext };