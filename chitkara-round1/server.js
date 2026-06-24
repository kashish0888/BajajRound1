const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

function buildTree(root, children) {
  const obj = {};

  function dfs(node) {
    const childObj = {};

    (children[node] || []).forEach((c) => {
      childObj[c] = dfs(c);
    });

    return childObj;
  }

  obj[root] = dfs(root);
  return obj;
}

function getDepth(root, children) {
  if (!children[root] || children[root].length === 0) {
    return 1;
  }

  let max = 0;

  for (const child of children[root]) {
    max = Math.max(max, getDepth(child, children));
  }

  return max + 1;
}

function detectCycle(start, children) {
  const visited = new Set();
  const rec = new Set();

  function dfs(node) {
    if (rec.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    rec.add(node);

    for (const child of children[node] || []) {
      if (dfs(child)) return true;
    }

    rec.delete(node);
    return false;
  }

  return dfs(start);
}

app.post("/bfhl", (req, res) => {
  const data = req.body.data || [];

  const invalid_entries = [];
  const duplicate_edges = [];

  const seenEdges = new Set();
  const parentOf = {};
  const children = {};

  const validRegex = /^[A-Z]->[A-Z]$/;

  data.forEach((item) => {
    const edge = item.trim();

    if (!validRegex.test(edge) || edge[0] === edge[3]) {
      invalid_entries.push(item);
      return;
    }

    if (seenEdges.has(edge)) {
      if (!duplicate_edges.includes(edge)) {
        duplicate_edges.push(edge);
      }
      return;
    }

    seenEdges.add(edge);

    const [parent, child] = edge.split("->");

    if (parentOf[child]) {
      return;
    }

    parentOf[child] = parent;

    if (!children[parent]) {
      children[parent] = [];
    }

    children[parent].push(child);
  });

  const nodes = new Set();

  Object.keys(children).forEach((parent) => {
    nodes.add(parent);

    children[parent].forEach((child) => {
      nodes.add(child);
    });
  });

  const roots = [];

  nodes.forEach((node) => {
    if (!parentOf[node]) {
      roots.push(node);
    }
  });

  roots.sort();

  const hierarchies = [];

  let total_trees = 0;
  let total_cycles = 0;
  let largest_tree_root = "";
  let largestDepth = -1;

  roots.forEach((root) => {
    const hasCycle = detectCycle(root, children);

    if (hasCycle) {
      total_cycles++;

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });

      return;
    }

    const depth = getDepth(root, children);

    total_trees++;

    if (
      depth > largestDepth ||
      (depth === largestDepth && root < largest_tree_root)
    ) {
      largestDepth = depth;
      largest_tree_root = root;
    }

    hierarchies.push({
      root,
      tree: buildTree(root, children),
      depth,
    });
  });

  if (roots.length === 0 && nodes.size > 0) {
    total_cycles = 1;

    hierarchies.push({
      root: [...nodes].sort()[0],
      tree: {},
      has_cycle: true,
    });
  }

  res.json({
    user_id: "kashish_24062026",
    email_id: "your-email@example.com",
    college_roll_number: "your-roll-number",
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root,
    },
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});