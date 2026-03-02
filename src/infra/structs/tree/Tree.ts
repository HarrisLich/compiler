//-----------------------------------------
// treeDemo.js
//
// By Alan G. Labouseur, based on the 2009
// work by Michael Ardizzone and Tim Smith.
//-----------------------------------------

import type { TreeNode, TreeKind } from "./Tree.types";

function createNode(name: string, parent: TreeNode | null): TreeNode {
  return {
    name,
    children: [],
    parent,
  };
}

function expand(node: TreeNode, depth: number, result: string[]): void {
  const indent = "-".repeat(depth);
  if (node.children.length === 0) {
    result.push(`${indent}[${node.name}]\n`);
  } else {
    result.push(`${indent}<${node.name}> \n`);
    for (let i = 0; i < node.children.length; i++) {
      expand(node.children[i]!, depth + 1, result);
    }
  }
}

export function Tree(): {
  root: TreeNode | null;
  addNode: (name: string, kind: TreeKind) => void;
  endChildren: () => void;
  toString: () => string;
} {
  let root: TreeNode | null = null;
  let cur: TreeNode | null = null;

  return {
    get root() {
      return root;
    },

    addNode(name: string, kind: TreeKind): void {
      if (root === null) {
        const node = createNode(name, null);
        root = node;
        if (kind === "branch") {
          cur = node;
        }
      } else {
        const parent = cur !== null ? cur : root;
        const node = createNode(name, parent);
        parent.children.push(node);
        if (kind === "branch") {
          cur = node;
        }
      }
    },

    endChildren(): void {
      if (cur !== null && cur.parent !== null) {
        cur = cur.parent;
      }
    },

    toString(): string {
      if (root === null) {
        return "";
      }
      const result: string[] = [];
      expand(root, 0, result);
      return result.join("");
    },
  };
}
