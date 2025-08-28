import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  RefObject,
  useContext,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";

type GuidedStepItem =
  | ReactElement<GuidedStepItemProps>
  | null
  | false
  | undefined;

export interface GuidedStepTabProps {
  title?: string;
  value: any;
  instructions: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  children: GuidedStepItem | GuidedStepItem[];
}

type GuidedStepTab =
  | ReactElement<GuidedStepTabProps>
  | null
  | false
  | undefined;

export interface GuidedStepsProps {
  children?: GuidedStepTab | GuidedStepTab[];
}

export interface GuidedStepItemProps {
  children: React.ReactNode;
}

export interface GuidedStepItemHandle extends HTMLSpanElement {
  activate: () => void;
  deactivate: () => void;
}

export const GuidedStepsItemContext = createContext<RefObject<
  Map<string, GuidedStepItemHandle>
> | null>(null);

export const GuidedStepTabProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const stepsRef = useRef<Map<string, GuidedStepItemHandle>>(new Map());

  return (
    <GuidedStepsContext.Provider value={stepsRef}>
      {children}
    </GuidedStepsContext.Provider>
  );
};

export const useGuidedStepItemsRef = () => {
  const ref = useContext(GuidedStepsContext);
  if (!ref) {
    throw new Error(
      "useGuidedStepItemsRef must be used within a GuidedStepsProvider"
    );
  }
  return ref;
};

export const GuidedStepsContext = createContext<RefObject<
  Map<string, GuidedStepItemHandle>
> | null>(null);

export const GuidedStepsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const stepsRef = useRef<Map<string, GuidedStepItemHandle>>(new Map());

  return (
    <GuidedStepsContext.Provider value={stepsRef}>
      {children}
    </GuidedStepsContext.Provider>
  );
};

const extractGuidedStepTabs = (children: GuidedStepsProps["children"]) => {
  return sanitizeGuidedStepsChildren(children).map(
    ({ props: { value, title } }) => ({
      value,
      title,
    })
  );
};

const useGuidedStepTabs = (props: Pick<GuidedStepsProps, "children">) => {
  const { children } = props;
  return useMemo(() => {
    const tabs = extractGuidedStepTabs(children);
    return tabs;
  }, [children]);
};

export const useGuidedSteps = (props: GuidedStepsProps) => {
  const tabs = useGuidedStepTabs(props);
};

const isGuidedStepTab = (
  component: ReactElement<unknown>
): component is ReactElement<GuidedStepTabProps> => {
  const { props, type } = component;
  return (
    !!props &&
    typeof props === "object" &&
    "value" in props &&
    (type as React.ComponentType<any>).displayName === "GuidedStepTab"
  );
};

export const sanitizeGuidedStepsChildren = (
  children: GuidedStepsProps["children"]
) => {
  return (Children.toArray(children)
    .filter((child) => child !== "/n")
    .map((child) => {
      if (!child || (isValidElement(child) && isGuidedStepTab(child))) {
        return child;
      }

      throw new Error(
        "All children of the <GuidedSteps> component must be <GuidedStepTab> components"
      );
    })
    ?.filter(Boolean) ?? []) as ReactElement<GuidedStepTabProps>[];
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

export const sanitizeGuidedStepTabChildren = (
  children: GuidedStepTabProps["children"]
) => {
  return (Children.toArray(children)
    .filter((child) => child !== "/n")
    .map((child) => {
      if (!child || (isValidElement(child) && isGuidedStepItem(child))) {
        return child;
      }

      throw new Error(
        "All children of the <GuidedStepTab> component must be <GuidedStepItem> components"
      );
    })
    ?.filter(Boolean) ?? []) as ReactElement<GuidedStepItemProps>[];
};
