import { ReactElement } from "react";
import { IconName } from "../Icon";

type Step = ReactElement<StepProps> | null | false | undefined;

type File = ReactElement<FileProps> | null | false | undefined;

interface GuidedStepsProps {
  children?: React.ReactNode | Step | Step[] | File | File[];
}

interface CodeBlockProps {
  stepId: string;
  fileName?: string;
  children: React.ReactNode;
}

interface StepProps {
  id: string;
  index: number;
  children: React.ReactNode;
}

interface FileProps {
  name: string;
  icon?: IconName;
  stepIds?: Array<string>;
  children:
    | React.ReactNode
    | React.ReactElement<CodeBlockProps>
    | React.ReactElement<CodeBlockProps>[];
}

interface CodeBlockHandle {
  activate: () => void;
  deactivate: () => void;
}

export {
  Step,
  File,
  GuidedStepsProps,
  CodeBlockProps,
  StepProps,
  FileProps,
  CodeBlockHandle,
};
