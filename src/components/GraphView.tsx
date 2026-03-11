import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { useNoteStore } from '../stores/noteStore';
import { buildGraphData } from '../lib/utils';

export function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { notes, activeNoteId, setActiveNote } = useNoteStore();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const { nodes, edges } = buildGraphData(notes);
    
    if (cyRef.current) {
      cyRef.current.destroy();
    }
    
    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((node) => ({
          data: { id: node.id, label: node.label }
        })),
        ...edges.map((edge) => ({
          data: { source: edge.source, target: edge.target }
        }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'background-color': '#4a90d9',
            'color': '#fff',
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 40,
            'height': 40
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#666',
            'curve-style': 'bezier'
          }
        },
        {
          selector: ':selected',
          style: {
            'background-color': '#ff6b6b'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        padding: 50
      }
    });
    
    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      setActiveNote(nodeId);
    });
    
    cyRef.current = cy;
    
    return () => {
      cy.destroy();
    };
  }, [notes, setActiveNote]);
  
  useEffect(() => {
    if (cyRef.current && activeNoteId) {
      cyRef.current.elements().removeClass('active');
      cyRef.current.$(`#${activeNoteId}`).addClass('active');
    }
  }, [activeNoteId]);
  
  if (notes.length === 0) {
    return (
      <div className="graph-placeholder">
        <h2>Graph View</h2>
        <p>Create some notes to see them in the graph</p>
      </div>
    );
  }
  
  return (
    <div className="graph-container" ref={containerRef} />
  );
}