/**
 * Interval tree is an ordered tree data structure to hold intervals.
 *
 * @example
 *
 * var IT = require('path-to-algorithms/src/data-structures/interval-tree');
 * var intervalTree = new IT.IntervalTree();
 *
 * intervalTree.add([0, 100]);
 * intervalTree.add([101, 200]);
 * intervalTree.add([10, 50]);
 * intervalTree.add([120, 220]);
 *
 * console.log(intervalTree.contains(150)); // true
 * console.log(intervalTree.contains(250)); // false
 * console.log(intervalTree.intersects([210, 310])); // true
 * console.log(intervalTree.intersects([310, 320])); // false
 *
 * @module data-structures/interval-tree
 */

class Node {
  public parentNode: Node = null;
  public max: number;
  constructor(
    public interval: [number, number],
    public left?: Node,
    public right?: Node
  ) {
    this.max = interval[1];
  }
}

function addNode(node: Node, child: Node) {
  const end = child.interval[1];
  child.parentNode = node;
  if (node.max < end) {
    while (child) {
      if (child.max < end) {
        child.max = end;
      }
      child = child.parentNode;
    }
  }
}

function intersects(a: [number, number], b: [number, number]) {
  return (
    (a[0] <= b[0] && a[1] >= b[0]) ||
    (a[0] <= b[1] && a[1] >= b[1]) ||
    (b[0] <= a[0] && b[1] >= a[0]) ||
    (b[0] <= a[1] && b[1] >= a[1])
  );
}

export default class IntervalTree {
  public root: Node = null;
  constructor() {}

  add(interval: [number, number], node = this.root) {
    if (!this.root) {
      this.root = new Node(interval);
      return this;
    }
    if (node.interval[0] > interval[0]) {
      if (node.left) {
        this.add(interval, node.left);
      } else {
        addNode(node, (node.left = new Node(interval)));
      }
    } else {
      if (node.right) {
        this.add(interval, node.right);
      } else {
        addNode(node, (node.right = new Node(interval)));
      }
    }
    return this;
  }

  /**
   * Checks or point belongs to at least one intarval from the tree.<br><br>
   * Complexity: O(log N).
   */
  contains(point: Number, node: Node = this.root) {
    if (!node) {
      return false;
    }
    if (node.interval[0] <= point && node.interval[1] >= point) {
      return true;
    }
    return [node.left, node.right].some(child => {
      return child && child.max > point && this.contains(point, child);
    });
  }

  intersects(interval: [number, number], node: Node = this.root) {
    if (!node) {
      return false;
    }
    if (intersects(node.interval, interval)) {
      return true;
    }
    return [node.left, node.right].some(child => {
      return (
        child && child.max >= interval[0] && this.intersects(interval, child)
      );
    });
  }

  /**
   * Remove interval from the tree.
   */
  remove(interval: [number, number], node = this.root) {
    if (!node) {
      return;
    }
    if (node.interval[0] === interval[0] && node.interval[1] === interval[1]) {
      // When left and right children exists
      if (node.left && node.right) {
        let replacement = node.left;
        while (replacement.left) {
          replacement = replacement.left;
        }
        const temp = replacement.interval;
        replacement.interval = node.interval;
        node.interval = temp;
        this.remove(replacement.interval, node);
      } else {
        // When only left or right child exists
        const child = node.right || node.left;
        const parentNode = node.parentNode;
        if (parentNode) {
          if (parentNode.left === node) {
            parentNode.left = child;
          } else {
            parentNode.right = child;
          }
          if (child) {
            child.parentNode = parentNode;
          }
        } else if ((this.root = child)) {
          // last node removed
          this.root.parentNode = null;
        }
      }
      // Adjust the max value
      const p = node.parentNode;
      if (p) {
        let maxNode = this.findMax(p);
        const max = maxNode.interval[1];
        while (maxNode) {
          if (maxNode.max === node.interval[1]) {
            maxNode.max = max;
            maxNode = maxNode.parentNode;
          } else {
            maxNode = null;
          }
        }
      }
    } else {
      // could be optimized
      this.remove(interval, node.left);
      this.remove(interval, node.right);
    }
  }

  /**
   * Returns node with the max endpoint in subtree.
   */
  findMax(node: Node): Node {
    const stack = [node];
    let current: Node;
    let max = -Infinity;
    let maxNode: Node;
    while (stack.length) {
      current = stack.pop();
      if (current.left) {
        stack.push(current.left);
      }
      if (current.right) {
        stack.push(current.right);
      }
      if (current.interval[1] > max) {
        max = current.interval[1];
        maxNode = current;
      }
    }
    return maxNode;
  }
}
