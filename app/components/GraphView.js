'use client';

import React, { useEffect, useRef } from 'react';
import * as G6 from '@antv/g6'; 

const GraphView = ({ data, onElementClick }) => {
  const containerRef = useRef(null);
  const graphRef = useRef(null);

  useEffect(() => {
    if (graphRef.current) return;

    graphRef.current = new G6.Graph({
      container: containerRef.current,
      width: containerRef.current.scrollWidth,
      height: containerRef.current.scrollHeight,
      fitView: true,
      modes: { 
        default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'drag-edge']
      },
      layout: { type: 'force', preventOverlap: true, linkDistance: 120 },
      defaultNode: { type: 'circle', size: 45, labelCfg: { style: { fill: '#fff', fontSize: 11 } } },
      defaultEdge: { 
        labelCfg: { autoRotate: true, style: { fill: '#fff', background: { fill: '#5f5f5f', padding: [2, 5], radius: 2 } } },
        style: { lineWidth: 3 }
      },
    });

    const handleNodeClick = (evt) => {
      const nodeId = evt.target.id;
      const nodeData = graphRef.current.getNodeData(nodeId);
      if (!nodeData) return;
      const element = { id: nodeId, isNode: true, data: nodeData.kuzuData };
      onElementClick(element);
    };

    const handleEdgeClick = (evt) => {
      const edgeId = evt.target.id;
      const edgeData = graphRef.current.getEdgeData(edgeId);
      if (!edgeData) return;
      const element = { id: edgeId, isNode: false, data: edgeData.kuzuData };
      onElementClick(element);
    };
    
    graphRef.current.on('node:click', handleNodeClick);
    graphRef.current.on('edge:click', handleEdgeClick);

    graphRef.current.setData(data);
    graphRef.current.render();

    const handleResize = () => {
      if (graphRef.current) {
        graphRef.current.changeSize(containerRef.current.scrollWidth, containerRef.current.scrollHeight);
        graphRef.current.fitView();
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [onElementClick]);

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.setData(data);
      graphRef.current.render();
    }
  }, [data]);

  return <div ref={containerRef} className="h-full w-full bg-gray-800" />;
};

export default GraphView;