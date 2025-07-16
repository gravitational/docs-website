import { createContext, ReactNode } from "react";

export const PositionContext = createContext(undefined);

class PositionContextVal {
  // prevPositions maps a string key, which represents a kind of component to
  // keep track of (e.g., Pre) to another map, which maps individual items to
  // that item's index within the order of components with the same component
  // key.
  private prevPositions: Map<string, Map<string, number>>;
  // containerPosition indicates the position of the containing element if this
  // is a nested PositionProvider.
  private containerPosition: number;
  // getContainerCount indicates the count of containing elements if this is a
  // nested PositionProvider.
  public getContainerCount: () => number;

  constructor(containerPosition: number, getContainerCount: () => number) {
    this.containerPosition = containerPosition;
    this.getContainerCount = getContainerCount;
    this.prevPositions = new Map();
  }

  // registerPosition tells the context provider that a component with the given
  // unique ID has
  // rendered. The component registers itself with a key, incrementing a
  // number.
  registerPosition(key: string, id: string): number {
    const positionsForKey = this.prevPositions.get(key);
    if (!positionsForKey) {
      const pos = new Map();
      pos.set(id, 0);
      this.prevPositions.set(key, pos);
      return 0;
    }
    const posForID = positionsForKey.get(id);
    if (posForID !== undefined) {
      return posForID;
    }
    const pos = positionsForKey.size;
    positionsForKey.set(id, pos);
    return pos;
  }

  // getItemCount retrieves the latest position recorded for a key without
  // incrementing a counter.
  getItemCount(key: string): number {
    const positionsForKey = this.prevPositions.get(key);
    if (positionsForKey == undefined) {
      return 0;
    }
    return positionsForKey.size;
  }

  getContainerPosition(): number {
    return this.containerPosition;
  }
}

interface PositionProviderProps {
  // containerPosition indicates the position of the containing element if this
  // is a nested PositionProvider.
  containerPosition?: number;
  // getContainerCount indicates the count of the containing element if this
  // is a nested PositionProvider.
  getContainerCount?: () => number;
  children: ReactNode;
}

export const PositionProvider = ({
  children,
  containerPosition,
  getContainerCount,
}: PositionProviderProps) => {
  return (
    <PositionContext.Provider
      value={new PositionContextVal(containerPosition, getContainerCount)}
    >
      {children}
    </PositionContext.Provider>
  );
};
