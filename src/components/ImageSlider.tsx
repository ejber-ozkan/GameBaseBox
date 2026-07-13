"use client";

import { useState, useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { isDebugMode, logDebugMessage } from '../lib/tauri-bridge';

interface ImageSliderProps {
  filename: string | null;
  type: 'screenshot' | 'sound' | 'musician';
  alt: string;
  className?: string;
  containerClassName?: string;
  imageClassName?: string;
  fallbackText?: string;
  defer?: boolean;
}

export function ImageSlider({
  filename,
  type,
  alt,
  className = '',
  containerClassName,
  imageClassName,
  fallbackText = 'No Image',
  defer = false,
}: ImageSliderProps) {
  const { settings, findAllVariants } = useSettings();
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!defer);
  const containerRef = useRef<HTMLDivElement>(null);
  const canObserveVisibility = defer && typeof IntersectionObserver !== 'undefined';
  const shouldLoadVariants = isVisible || !defer || !canObserveVisibility;
  const resolvedContainerClassName = containerClassName ?? className;
  const resolvedImageClassName = imageClassName ?? className;

  useEffect(() => {
    if (!canObserveVisibility) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '320px' });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [canObserveVisibility]);

  useEffect(() => {
    async function loadVariants() {
      if (!shouldLoadVariants) return;
      if (!filename) {
        setImages([]);
        return;
      }
      const urls = await findAllVariants(type, filename);
      if (urls.length > 0) {
        setImages(urls);
      } else {
        setImages([]);
        isDebugMode().then(debug => {
          if (debug) {
            logDebugMessage(`[DEBUG WARNING] No images found for game: "${alt}", type: "${type}", filename: "${filename}"`);
          }
        });
      }
      setCurrentIndex(0);
      setHasError(false);
    }
    loadVariants();
  }, [filename, type, findAllVariants, shouldLoadVariants]);
  // Support cycling through images
  useEffect(() => {
    if (!settings.imageCycling || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 3500); // cycle every 3.5s
    return () => clearInterval(timer);
  }, [images.length, settings.imageCycling]);

  if (!filename || images.length === 0 || hasError) {
    return (
      <div ref={containerRef}
        className={`flex items-center justify-center bg-gray-800 text-gray-500 rounded border border-gray-700 ${resolvedContainerClassName}`}
        data-testid="image-fallback"
      >
        <span className="text-xs">{fallbackText}</span>
      </div>
    );
  }

  const isSlide = settings.imageAnimation === 'slide';
  const activeImage = images[currentIndex] ?? null;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${resolvedContainerClassName}`}>
        <div 
            className={`flex w-full h-full transition-all duration-700 ease-in-out ${settings.bigBoxAnimateVertical ? 'flex-col' : ''} ${!isSlide ? 'transition-none' : ''}`}
            style={{ 
                transform: isSlide 
                  ? (settings.bigBoxAnimateVertical ? `translateY(-${currentIndex * 100}%)` : `translateX(-${currentIndex * 100}%)`)
                  : 'none' 
            }}
        >
            {isSlide ? (
              images.map((src, idx) => (
                <div key={`${src}-${idx}`} className="w-full h-full shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local asset and Tauri media URLs are resolved dynamically at runtime */}
                    <img
                        src={src}
                        alt={`${alt} ${idx + 1}`}
                        className={`w-full h-full ${resolvedImageClassName}`}
                        onError={() => {
                            if (images.length === 1) {
                                setHasError(true);
                            } else {
                                setImages(prev => prev.filter((_, i) => i !== idx));
                                setCurrentIndex(prev => prev % (images.length - 1 || 1));
                            }
                        }}
                        loading="eager"
                    />
                </div>
              ))
            ) : activeImage ? (
              <div key={activeImage} className="w-full h-full shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local asset and Tauri media URLs are resolved dynamically at runtime */}
                  <img
                      src={activeImage}
                      alt={`${alt} ${currentIndex + 1}`}
                      className={`w-full h-full ${resolvedImageClassName} animate-in fade-in duration-500`}
                      onError={() => {
                          if (images.length === 1) {
                              setHasError(true);
                          } else {
                              setImages(prev => prev.filter((_, i) => i !== currentIndex));
                              setCurrentIndex(prev => prev % (images.length - 1 || 1));
                          }
                      }}
                      loading="eager"
                  />
              </div>
            ) : null}
        </div>
    </div>
  );
}
