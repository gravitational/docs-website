import { Children, isValidElement, useMemo, type ReactElement } from "react";

type GuidedStepItem =
  | ReactElement<GuidedStepItemProps>
  | null
  | false
  | undefined;

export interface GuidedStepsProps {
  children?: GuidedStepItem | GuidedStepItem[];
}

export interface GuidedStepItemProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export interface GuidedStepItemHandle {
  activate: () => void;
  deactivate: () => void;
}

const extractGuidedStepItems = (children: GuidedStepsProps["children"]) => {
  return sanitizeGuidedStepsChildren(children).map(
    ({ props: { id, title, description, children } }) => {
      return {
        id,
        title,
        description,
        children,
      };
    }
  );
};

const useGuidedStepItems = (props: Pick<GuidedStepsProps, "children">) => {
  const { children } = props;
  return useMemo(() => {
    const items = extractGuidedStepItems(children);
    return items;
  }, [children]);
};

export const useGuidedSteps = (props: GuidedStepsProps) => {
  return useGuidedStepItems(props);
};

export const sanitizeGuidedStepsChildren = (
  children: GuidedStepsProps["children"]
) => {
  return (Children.toArray(children)
    .filter((child) => child !== "/n")
    .map((child) => {
      if (!child || (isValidElement(child) && isGuidedStepItem(child))) {
        return child;
      }

      throw new Error(
        "All children of the <GuidedSteps> component must be <GuidedStepItem> components"
      );
    })
    ?.filter(Boolean) ?? []) as ReactElement<GuidedStepItemProps>[];
};

const isGuidedStepItem = (
  component: ReactElement<unknown>
): component is ReactElement<GuidedStepItemProps> => {
  const { props, type } = component;
  return (
    !!props &&
    typeof props === "object" &&
    "children" in props &&
    (type as React.ComponentType<any>).displayName === "GuidedStepItem"
  );
};
