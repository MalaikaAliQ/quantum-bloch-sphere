import { useEffect, useRef, useCallback } from 'react';
import katex from 'katex';

/**
 * Renders a KaTeX math expression inline or as a block.
 */
export default function KaTeXBlock({ math, display = true, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && math) {
      try {
        katex.render(math, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
        });
      } catch (e) {
        if (ref.current) ref.current.textContent = math;
      }
    }
  }, [math, display]);

  return <span ref={ref} className={className} />;
}

/**
 * Renders inline KaTeX math within a larger text block by replacing $...$ patterns.
 */
export function KaTeXInline({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !children) return;
    const text = typeof children === 'string' ? children : '';
    // Replace $...$ with rendered KaTeX spans
    const parts = text.split(/(\$[^$]+\$)/g);
    ref.current.innerHTML = '';
    parts.forEach(part => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const span = document.createElement('span');
        try {
          katex.render(part.slice(1, -1), span, { displayMode: false, throwOnError: false });
        } catch { span.textContent = part; }
        ref.current.appendChild(span);
      } else {
        ref.current.appendChild(document.createTextNode(part));
      }
    });
  }, [children]);

  return <span ref={ref} className={className} />;
}
