export {};

// Augments the `Data` interface in @types/unist to add an index signature,
// resolving a type mismatch caused by @types/mdast bundling its own copy of
// @types/unist whose `Data` already has [key: string]: unknown. Without this,
// unist-util-visit's Node<Data> parameter is incompatible with nodes typed
// against the top-level @types/unist package.
declare module "unist" {
  interface Data {
    [key: string]: unknown;
  }
}