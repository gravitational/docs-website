/**
 * Utility functions for extracting and processing GuidedSteps component children.
 * 
 * This module provides functions to:
 * - Extract Steps and Files from the component tree
 * - Extract CodeBlocks from Files
 * - Sanitize children for display in left (instructions) and right (code) columns
 * - Type guard functions to identify different component types
 */

import React, { Children, isValidElement, type ReactElement } from "react";
import {
  CodeBlockProps,
  FileProps as File,
  GuidedStepsProps,
  StepProps,
} from "./types";

/**
 * Extracts Step components from GuidedSteps children.
 * 
 * This function filters the children to find all Step components and returns
 * their props in a normalized format. Steps represent instruction items that
 * appear in the left column of the GuidedSteps layout.
 * 
 * @param children - The children of the GuidedSteps component
 * @returns Array of Step props objects containing id, index, and children
 */
export const extractSteps = (children: GuidedStepsProps["children"]) => {
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

/**
 * Extracts File components from GuidedSteps children.
 * 
 * This function filters the children to find all File components and returns
 * their props in a normalized format. Files represent code files that appear
 * in the right column of the GuidedSteps layout, with tabs for switching
 * between different files.
 * 
 * @param children - The children of the GuidedSteps component
 * @returns Array of File props objects containing name, icon, stepIds, and children
 */
export const extractFiles = (children: GuidedStepsProps["children"]) => {
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

/**
 * Extracts CodeBlock components from a File component.
 * 
 * Each File can contain multiple CodeBlocks, each linked to a specific Step
 * via the stepId prop. This function extracts all CodeBlocks and their associated
 * stepIds for mapping instructions to code.
 * 
 * @param child - A File component prop object
 * @returns Array of objects containing stepId and code children
 */
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

/**
 * Sanitizes children for display in the left column (instructions).
 * 
 * This function:
 * - Filters out File components (they go in the right column)
 * - Adds index props to StepSection components for numbering
 * - Adds index props to Step components for ref tracking
 * - Preserves other content like headings, paragraphs, etc.
 * 
 * @param children - The children of the GuidedSteps component
 * @returns Array of React elements suitable for the left column
 */
export const sanitizeLeftColumnChildren = (
  children: GuidedStepsProps["children"]
) => {
  let stepSectionIndex = 0;
  let stepIndex = 0;
  return (Children.toArray(children)
    .map((child) => {
      if (!child || (isValidElement(child) && !isFile(child))) {
        // If it's a StepSection, add the index prop in order to number the sections
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

        // if it's a Step, add the index prop in order to keep track of the step refs
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

/**
 * Sanitizes children for display in the right column (code files).
 * 
 * This function:
 * - Filters to keep only File components
 * - Extracts stepIds from CodeBlocks within each File
 * - Adds stepIds as a prop to each File for linking to Steps
 * 
 * @param children - The children of the GuidedSteps component
 * @returns Array of File components with stepIds populated
 */
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

/**
 * Type guard functions to identify different component types.
 * 
 * These functions safely check if a React element is a specific GuidedSteps
 * component type by checking its props and displayName.
 */

/**
 * Checks if a component is a Step component.
 * 
 * @param component - A React element to check
 * @returns true if the component is a Step
 */
const isStep = (
  component: ReactElement<unknown>
): component is ReactElement<StepProps> => {
  const { props, type } = component;
  return (
    !!props &&
    typeof props === "object" &&
    "children" in props &&
    "id" in props &&
    (type as React.ComponentType<any>).displayName === "Step"
  );
};

/**
 * Checks if a component is a File component.
 * 
 * @param component - A React element to check
 * @returns true if the component is a File
 */
const isFile = (
  component: ReactElement<unknown>
): component is ReactElement<File> => {
  const { props, type } = component;
  return (
    !!props &&
    typeof props === "object" &&
    "children" in props &&
    "name" in props &&
    (type as React.ComponentType<any>).displayName === "File"
  );
};

/**
 * Checks if a component is a StepSection component.
 * 
 * @param component - A React element to check
 * @returns true if the component is a StepSection
 */
const isStepSection = (
  component: ReactElement<unknown>
): component is ReactElement<{ index?: number; children: React.ReactNode }> => {
  const { type } = component;
  return (type as React.ComponentType<any>).displayName === "StepSection";
};

/**
 * Checks if a component is a CodeBlock component.
 * 
 * @param component - A React element to check
 * @returns true if the component is a CodeBlock
 */
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
