import React, { useCallback, useState, useRef } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  type Node,
  Handle,
  Position,
  NodeProps,
  MarkerType,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { initialNodes, nodeTypes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";

const edgeOptions = {
  type: "smoothstep",
  style: { strokeWidth: 2, stroke: "#333" },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#333",
  },
};

// Custom Node component with right-click menu
const CustomNode = ({ data, id }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [text, setText] = useState(data.text || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setShowMenu(true);
    // Position the menu at the cursor
    if (menuRef.current) {
      menuRef.current.style.left = `${event.clientX}px`;
      menuRef.current.style.top = `${event.clientY}px`;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText);
    if (data.onNodeTextChange) {
      data.onNodeTextChange(id, newText);
    }
  };

  const handleDelete = () => {
    data.onDeleteNode(id);
    setShowMenu(false);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    data.onNodeLabelChange(id, label);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      onContextMenu={handleContextMenu}
      style={{
        padding: 10,
        border: "1px solid #ddd",
        borderRadius: 5,
        background: "white",
      }}
    >
      <Handle type="target" position={Position.Top} />
      {isEditing ? (
        <input
          ref={inputRef}
          value={label}
          onChange={(evt) => setLabel(evt.target.value)}
          onBlur={handleInputBlur}
        />
      ) : (
        <div>{label}</div>
      )}
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Enter additional text..."
        style={{ width: "100%", marginTop: 10, minHeight: 60 }}
      />
      <Handle type="source" position={Position.Bottom} />
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "5px",
            zIndex: 1000,
          }}
        >
          <button onClick={handleEdit}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState("");

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges]
  );

  const handleNodeTextChange = useCallback(
    (nodeId: string, newText: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, text: newText } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const addNode = () => {
    if (nodeName) {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        data: {
          label: nodeName,
          text: "placeholder",
          onNodeLabelChange: handleNodeLabelChange,
          onDeleteNode: handleDeleteNode,
          onNodeTextChange: handleNodeTextChange,
        },
        position: { x: Math.random() * 500, y: Math.random() * 500 },
        type: "customNode",
      };
      setNodes((nds) => nds.concat(newNode));
      setNodeName("");
    }
  };

  const handleNodeLabelChange = (nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  };

  const customNodeTypes = {
    ...nodeTypes,
    customNode: CustomNode,
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
        <input
          type="text"
          value={nodeName}
          onChange={(e) => setNodeName(e.target.value)}
          placeholder="Enter node name"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button
          onClick={addNode}
          style={{
            padding: "5px 10px",
            backgroundColor: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Add Node
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        nodeTypes={customNodeTypes}
        onNodesChange={onNodesChange}
        edges={edges}
        edgeTypes={edgeTypes}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultEdgeOptions={edgeOptions}
        fitView
      >
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}