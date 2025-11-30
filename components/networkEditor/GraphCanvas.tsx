"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useNetworkStore } from "@/lib/store/networkStore";
import { getEdgeColor } from "@/lib/utils/graph";

export default function GraphCanvas() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectNode,
    selectEdge,
    addEdge: addEdgeToStore,
    updateNodePosition,
  } = useNetworkStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    storeNodes as unknown as Node[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    storeEdges as unknown as Edge[]
  );

  useEffect(() => {
    setNodes(storeNodes as unknown as Node[]);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    const styledEdges = storeEdges.map((edge) => {
      const load = edge.data?.currentLoad || 0;
      const capacity = edge.data?.capacity || 1;
      const color = getEdgeColor(load, capacity);

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: color,
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: color,
        },
        label: edge.data?.distance
          ? `${edge.data.distance}km`
          : undefined,
        labelStyle: {
          fill: color,
          fontWeight: 600,
          fontSize: 12,
        },
        animated: (load / capacity) * 100 > 75,
      };
    });
    setEdges(styledEdges as unknown as Edge[]);
  }, [storeEdges, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const storeNode = storeNodes.find((n) => n.id === node.id);
      if (storeNode) {
        selectNode(storeNode);
      }
    },
    [storeNodes, selectNode]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const storeEdge = storeEdges.find((e) => e.id === edge.id);
      if (storeEdge) {
        selectEdge(storeEdge);
      }
    },
    [storeEdges, selectEdge]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const sourceNode = storeNodes.find((n) => n.id === params.source);
      const targetNode = storeNodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      addEdgeToStore({
        source: params.source,
        target: params.target,
        data: {
          distance: 1,
          resistance: 0.1,
          capacity: 100,
          currentLoad: 0,
          loss: 0,
        },
      });
    },
    [storeNodes, addEdgeToStore]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  const nodeTypes = useMemo(() => ({}), []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        connectionLineStyle={{ stroke: "#6366f1", strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          position="top-right"
          nodeColor={(node) => {
            const storeNode = storeNodes.find((n) => n.id === node.id);
            if (storeNode) {
              return storeNode.style?.background as string || "#22c55e";
            }
            return "#64748b";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}

