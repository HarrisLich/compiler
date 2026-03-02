/**
 * Node kind when adding to the tree: branch (has children) or leaf.
 */
export type TreeKind = "branch" | "leaf";

/**
 * A node in the tree. Root node has parent === null.
 */
export interface TreeNode {
  name: string;
  children: TreeNode[];
  parent: TreeNode | null;
}
