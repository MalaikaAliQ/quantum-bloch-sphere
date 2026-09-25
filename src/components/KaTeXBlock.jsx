import { useEffect, useRef } from 'react';
import katexModule from 'katex';

/**
 * Safely resolves the katex.render function regardless of CJS/ESM bundling environment or CDN global.
 */
export function renderKaTeX(math, element, options = {}) {
  if (!element || !math) return;
  
  try {
    let renderFn = null;
    if (typeof window !== 'undefined' && window.katex && typeof window.katex.render === 'function') {
      renderFn = window.katex.render;
    } else if (katexModule && typeof katexModule.render === 'function') {
      renderFn = katexModule.render;
    } else if (katexModule && katexModule.default && typeof katexModule.default.render === 'function') {
      renderFn = katexModule.default.render;
    }

    if (renderFn) {
      renderFn(math, element, {
        displayMode: options.displayMode ?? true,
        throwOnError: false,
        trust: true,
      });
    } else {
      element.textContent = math;
    }
  } catch (err) {
    element.textContent = math;
  }
}

/**
 * Renders a KaTeX math expression inline or as a block.
 */
export default function KaTeXBlock({ math, display = true, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && math) {
      renderKaTeX(math, ref.current, { displayMode: display });
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
    const parts = text.split(/(\$[^$]+\$)/g);
    ref.current.innerHTML = '';
    parts.forEach(part => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const span = document.createElement('span');
        renderKaTeX(part.slice(1, -1), span, { displayMode: false });
        ref.current.appendChild(span);
      } else {
        ref.current.appendChild(document.createTextNode(part));
      }
    });
  }, [children]);

  return <span ref={ref} className={className} />;
}
