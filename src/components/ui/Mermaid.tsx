import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
      
      // We need to use mermaid.render for dynamic updates in some cases,
      // but for simple components, clearing and re-checking often works.
      const renderChart = async () => {
        try {
          const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
          if (ref.current) {
            ref.current.innerHTML = '<p class="text-destructive text-sm italic">Failed to render diagram. Check syntax.</p>';
          }
        }
      };
      
      renderChart();
    }
  }, [chart]);

  return <div key={chart} ref={ref} className="mermaid flex justify-center py-4 overflow-x-auto" />;
};

export default Mermaid;
