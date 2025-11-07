const getColorForLabel = (label) => {
  if (!label) return '#a2a2a2';
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
};

const findGraphElementsRecursive = (data, nodes, edges) => {
  if (!data || typeof data !== 'object') return;

  // Nodes
  if (data._id && data._label && !data._src) {
    const nodeId = `${data._id.table}-${data._id.offset}`;
    if (!nodes.has(nodeId)) {
      const properties = { ...data };
      delete properties._id;
      delete properties._label;

      nodes.set(nodeId, {
        id: nodeId,
        label: properties.name || data._label,
        style: { labelText: data.name || data.title, labelFill: '#5f5f5f', fill: getColorForLabel(data._label), stroke: '#11181C', lineWidth: 3, shadowBlur: 12, shadowOffsetX: 2, shadowOffsetY: 4, },
        kuzuData: {
          kuzu_id: data._id,
          label_type: data._label,
          properties: properties,
        }
      });
    }
  // Edges
  } else if (data._id && data._label && data._src && data._dst) {
    const sourceId = `${data._src.table}-${data._src.offset}`;
    const targetId = `${data._dst.table}-${data._dst.offset}`;
    const edgeId = `${data._id.table}-${data._id.offset}`;

    if (!edges.has(edgeId)) {
       const properties = { ...data };
       delete properties._id;
       delete properties._label;
       delete properties._src;
       delete properties._dst;

      edges.set(edgeId, {
        id: edgeId,
        source: sourceId,
        target: targetId,
        label: data._label,
        style: { endArrow: true, stroke: '#5f5f5f', labelFill: '#5f5f5f', labelPlacement: 'center', labelTextBaseline: "bottom", },
        kuzuData: {
            kuzu_id: data._id,
            label_type: data._label,
            properties: properties,
        }
      });
    }
  }

  if (Array.isArray(data)) {
    data.forEach(item => findGraphElementsRecursive(item, nodes, edges));
  } else {
    Object.values(data).forEach(value => findGraphElementsRecursive(value, nodes, edges));
  }
};

export const parseKuzuData = (kuzuResult) => {
  const nodes = new Map();
  const edges = new Map();

  if (!kuzuResult) return { nodes: [], edges: [] };

  findGraphElementsRecursive(kuzuResult, nodes, edges);

  return { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()) };
};