export type TreeKind = "branch" | "leaf";

export interface TreeNode {
  name: string;
  children: TreeNode[];
  parent: TreeNode | null;
}
