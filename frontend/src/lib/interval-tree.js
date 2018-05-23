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
  /**
   * Node which describes an interval.
   *
   * @constructor
   * @param {Number} start Start of the interval.
   * @param {Number} end End of the interval.
   * @param {Node} left Left child node.
   * @param {Node} right Right child node.
   */
  constructor(start, end, left, right) {
    /**
     * Node interval.
     * @member {Array}
     */
    this.interval = [start, end];
    /**
     * Max endpoint in subtree which starts from this node.
     * @member {Number}
     */
    this.max = end;
    /**
     * Parent node.
     * @member {Node}
     */
    this.parentNode = null;
    /**
     * Left child node.
     * @member {Node}
     */
    this.left = left;
    /**
     * Right child node.
     * @member {Node}
     */
    this.right = right;
  }
}

function addNode(node, child) {
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

function intersects(a, b) {
  return (
    (a[0] <= b[0] && a[1] >= b[0]) ||
    (a[0] <= b[1] && a[1] >= b[1]) ||
    (b[0] <= a[0] && b[1] >= a[0]) ||
    (b[0] <= a[1] && b[1] >= a[1])
  );
}

export default class IntervalTree {
  /**
   * Interval tree.
   *
   * @public
   * @constructor
   */
  constructor() {
    /**
     * Root node of the tree.
     * @member {Node}
     */
    this.root = null;
  }

  /**
   * Add new interval to the tree.
   * @param {Array} interval Array with start and end points of the interval.
   * @param {Node} node
   * @return {IntervalTree}
   */
  add(interval, node = this.root) {
    if (!this.root) {
      this.root = new Node(interval[0], interval[1]);
      return this;
    }
    if (node.interval[0] > interval[0]) {
      if (node.left) {
        this.add(interval, node.left);
      } else {
        addNode(node, (node.left = new Node(interval[0], interval[1])));
      }
    } else {
      if (node.right) {
        this.add(interval, node.right);
      } else {
        addNode(node, (node.right = new Node(interval[0], interval[1])));
      }
    }
    return this;
  }

  /**
   * Checks or point belongs to at least one intarval from the tree.<br><br>
   * Complexity: O(log N).
   * @param {Number} point Point which should be checked.
   * @param {Node} node
   * @return {Boolean} True if point belongs to one of the intervals.
   */
  contains(point, node = this.root) {
    if (!node) {
      return false;
    }
    if (node.interval[0] <= point && node.interval[1] >= point) {
      return true;
    }
    var result = false;
    var temp;
    ["left", "right"].forEach(function(key) {
      temp = node[key];
      if (temp) {
        if (temp.max > point) {
          result = result || this.contains(point, temp);
        }
      }
    });
    return result;
  }

  /**
   * Checks or interval belongs to at least one intarval from the tree.<br><br>
   * Complexity: O(log N).
   * @param {Array} interval Interval which should be checked.
   * @param {Node} node
   * @return {Boolean} True if interval intersects with one of the intervals.
   */
  intersects(interval, node = this.root) {
    if (!node) {
      return false;
    }
    if (intersects(node.interval, interval)) {
      return true;
    }
    var result = false;
    var temp;
    ["left", "right"].forEach(side => {
      temp = node[side];
      if (temp && temp.max >= interval[0]) {
        result = result || this.intersects(interval, temp);
      }
    });
    return result;
  }

  /**
   * Returns height of the tree.
   * @param {Node} node
   * @return {Number} Height of the tree.
   */
  height(node = this.root) {
    if (!node) {
      return 0;
    }
    return 1 + Math.max(heightHelper(node.left), heightHelper(node.right));
  }
  /**
   * Remove interval from the tree.
   * @param {Array} interval Array with start and end of the interval.
   */
  remove(interval, node = this.root) {
    if (!node) {
      return;
    }
    if (node.interval[0] === interval[0] && node.interval[1] === interval[1]) {
      // When left and right children exists
      if (node.left && node.right) {
        var replacement = node.left;
        while (replacement.left) {
          replacement = replacement.left;
        }
        var temp = replacement.interval;
        replacement.interval = node.interval;
        node.interval = temp;
        this.remove(replacement.interval, node);
      } else {
        // When only left or right child exists
        var side = "left";
        if (node.right) {
          side = "right";
        }
        var parentNode = node.parentNode;
        if (parentNode) {
          if (parentNode.left === node) {
            parentNode.left = node[side];
          } else {
            parentNode.right = node[side];
          }
          if (node[side]) {
            node[side].parentNode = parentNode;
          }
        } else {
          this.root = node[side];
          // last node removed
          if (this.root) {
            this.root.parentNode = null;
          }
        }
      }
      // Adjust the max value
      var p = node.parentNode;
      if (p) {
        var maxNode = this.findMax(p);
        var max = maxNode.interval[1];
        while (maxNode) {
          if (maxNode.max === node.interval[1]) {
            maxNode.max = max;
            maxNode = maxNode.parentNode;
          } else {
            maxNode = false;
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
   * @param {Node} node Root node of subtree.
   * @return {Node} Node with the largest endpoint.
   */
  findMax(node) {
    var stack = [node];
    var current;
    var max = -Infinity;
    var maxNode;
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
