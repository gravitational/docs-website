import React, {
  Children,
  isValidElement,
  useMemo,
  type ReactElement,
} from "react";
import {
  CodeBlockProps,
  FileProps as File,
  GuidedStepsProps,
  StepProps,
} from "./types";

// Extract the instruction steps which are displayed on the left column.
const extractSteps = (children: GuidedStepsProps["children"]) => {
  return (
    (Children.toArray(children)
      .filter((child) => child !== "/n")
      .map((child) => {
        if (!child || (isValidElement(child) && isStep(child))) {
          return child;
        }
        return null;
      })
      ?.filter(Boolean) ?? []) as ReactElement<StepProps>[]
  ).map(({ props: { id, index, children } }) => {
    return {
      id,
      index,
      children,
    };
  });
};

// Extract the code files which are displayed on the right column.
const extractFiles = (children: GuidedStepsProps["children"]) => {
  return sanitizeRightColumnChildren(children).map(
    ({ props: { name, icon, stepIds, children } }) => {
      return {
        name,
        icon,
        stepIds,
        children,
      };
    }
  );
};

// Extract the code blocks from a File component in order to map them to the instruction steps.
export const extractCodeBlocksFromFile = (child: File) => {
  return (
    (Children.toArray(child.children)
      .filter((child) => child !== "/n")
      .map((child) => {
        if (!child || (isValidElement(child) && isCodeBlock(child))) {
          return child;
        }
        return null;
      })
      ?.filter(Boolean) ?? []) as ReactElement<CodeBlockProps>[]
  ).map(({ props: { stepId, children } }) => {
    return {
      stepId,
      children,
    };
  });
};

export const useGuidedSteps = (props: GuidedStepsProps) => {
  const { children } = props;
  return useMemo(() => {
    const steps = extractSteps(children);
    const files = extractFiles(children);
    return { steps, files };
  }, [children]);
};

export const sanitizeLeftColumnChildren = (
  children: GuidedStepsProps["children"]
) => {
  let stepSectionIndex = 0;
  let stepIndex = 0;
  return (Children.toArray(children)
    .map((child) => {
      if (!child || (isValidElement(child) && !isFile(child))) {
        // If it's a StepSection, add the index prop
        if (child && isValidElement(child) && isStepSection(child)) {
          stepSectionIndex++;
          return React.cloneElement(
            child as ReactElement<{
              index?: number;
              children: React.ReactNode;
            }>,
            { index: stepSectionIndex }
          );
        }

        // if it's a Step, add the index prop
        if (child && isValidElement(child) && isStep(child)) {
          const indexedStep = React.cloneElement(
            child as ReactElement<StepProps>,
            {
              index: stepIndex,
            }
          );
          stepIndex++;
          return indexedStep;
        }
        return child;
      }
    })
    ?.filter(Boolean) ?? []) as ReactElement[];
};

export const sanitizeRightColumnChildren = (
  children: GuidedStepsProps["children"]
) => {
  return (Children.toArray(children)
    .map((child) => {
      if (child && isValidElement(child) && isFile(child)) {
        const stepIds: Array<string> = [];
        const codeBlocks = extractCodeBlocksFromFile(child.props);
        codeBlocks.forEach(({ stepId }) => {
          stepIds.push(stepId);
        });
        return React.cloneElement(
          child as ReactElement<{
            name: string;
            icon?: string;
            stepIds?: Array<string>;
            children: React.ReactNode;
          }>,
          { stepIds }
        );
      }
    })
    ?.filter(Boolean) ?? []) as ReactElement[];
};

const isStep = (
  component: ReactElement<unknown>
): component is ReactElement<StepProps> => {
  const { props, type } = component;
  return (
    !!props &&
    typeof props === "object" &&
    "children" in props &&
    "id" in props &&
    (type as React.ComponentType<any>).name === "Step"
  );
};

const isFile = (
  component: ReactElement<unknown>
): component is ReactElement<File> => {
  const { props, type } = component;
  return (
    !!props &&
    typeof props === "object" &&
    "children" in props &&
    "name" in props &&
    (type as React.ComponentType<any>).name === "FileComponent"
  );
};

const isStepSection = (
  component: ReactElement<unknown>
): component is ReactElement<{ index?: number; children: React.ReactNode }> => {
  const { type } = component;
  return (type as React.ComponentType<any>).name === "StepSection";
};

const isCodeBlock = (
  component: ReactElement<unknown>
): component is ReactElement<{ stepId: string; children: React.ReactNode }> => {
  const { props, type } = component;
  return (
    !!props &&
    typeof props === "object" &&
    "children" in props &&
    "stepId" in props &&
    (type as React.ComponentType<any>).displayName === "CodeBlock"
  );
};
