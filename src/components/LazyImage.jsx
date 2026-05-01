import { useEffect, useRef, useState } from 'react';

/**
 * LazyImage — Optimistic image loading with:
 * 1. Intersection-observer based lazy loading (not loaded until near viewport)
 * 2. Animated shimmer skeleton while loading
 * 3. Smooth opacity fade-in when loaded
 * 4. Fallback emoji if image errors out
 * This prevents the "reload takes time" problem by not fetching images that
 * are off-screen, and showing a skeleton immediately so UI never feels broken.
 */
export default function LazyImage({ src, alt, className = '', fallbackEmoji = '🍰', aspectRatio = '4/3' }) {
  const ref      = useRef(null);
  const [show,   setShow]   = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  useEffect(() => {
    if (!src) { setError(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // start loading 200px before entering viewport
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${!loaded && !error ? 'img-optimistic' : ''} ${className}`}
      style={{ aspectRatio }}
    >
      {error || !src ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-5xl">
          {fallbackEmoji}
        </div>
      ) : show ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.4s ease',
            opacity: loaded ? 1 : 0,
          }}
        />
      ) : null}
    </div>
  );
}
