import { useState, useRef, useEffect } from 'react';
import SimpleTreeNode from './SimpleTreeNode';

const Minimap = ({ treeData, viewState, containerRef, contentRef, isDarkMode, layout }) => {
  const miniTreeRef = useRef(null);
  const [ratios, setRatios] = useState({ x: 1, y: 1 });
  const [miniSize, setMiniSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      if (!contentRef.current || !miniTreeRef.current || !containerRef.current) return;
      
      const mainW = contentRef.current.offsetWidth;
      const mainH = contentRef.current.offsetHeight;
      const miniW = miniTreeRef.current.offsetWidth;
      const miniH = miniTreeRef.current.offsetHeight;
      
      setMiniSize({ w: miniW, h: miniH });

      if (mainW > 0 && mainH > 0) {
        setRatios({
          x: miniW / mainW,
          y: miniH / mainH
        });
      }
    };

    const observer = new ResizeObserver(update);
    if (contentRef.current) observer.observe(contentRef.current);
    if (miniTreeRef.current) observer.observe(miniTreeRef.current);
    
    requestAnimationFrame(update);

    return () => observer.disconnect();
  }, [treeData]);

  const containerW = containerRef.current ? containerRef.current.clientWidth : 0;
  const containerH = containerRef.current ? containerRef.current.clientHeight : 0;

  const vpX = (-viewState.x / viewState.scale) * ratios.x;
  const vpY = (-viewState.y / viewState.scale) * ratios.y;
  const vpW = (containerW / viewState.scale) * ratios.x;
  const vpH = (containerH / viewState.scale) * ratios.y;

  const MAX_W = 200;
  const MAX_H = 150;
  const fitScale = Math.min(1, Math.min(MAX_W / Math.max(1, miniSize.w), MAX_H / Math.max(1, miniSize.h)));

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: miniSize.w * fitScale,
      height: miniSize.h * fitScale,
      background: isDarkMode ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255,255,255,0.95)',
      border: isDarkMode ? '1px solid #555' : '1px solid #ccc',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      zIndex: 150,
      overflow: 'hidden',
      pointerEvents: 'none',
      borderRadius: '4px'
    }}>
      <div style={{
        transform: `scale(${fitScale})`,
        transformOrigin: '0 0',
        width: miniSize.w,
        height: miniSize.h,
        position: 'relative'
      }}>
        <div ref={miniTreeRef} className={`tree ${layout === 'vertical' ? 'vertical' : ''} mini-tree`} style={{ padding: '20px', width: 'fit-content' }}>
           <ul>
              {treeData.map(root => <SimpleTreeNode key={root.id} node={root} isDarkMode={isDarkMode} />)}
           </ul>
        </div>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${vpX}px, ${vpY}px)`,
          width: vpW,
          height: vpH,
          border: '2px solid #2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.2)'
        }} />
      </div>
    </div>
  );
};

export default Minimap;