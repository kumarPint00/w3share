"use client";
import React, { useEffect, useState } from 'react';
import { Box, Skeleton } from '@mui/material';

interface BackgroundRemoverImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  threshold?: number; // 0-255, higher removes more white
  channelDiff?: number; // max difference between RGB channels to qualify as near-white (RGB mode)
  borderRadius?: number | string;
  crop?: boolean; // auto-crop transparent whitespace
  showSkeleton?: boolean; // disable skeleton for tiny inline usages
  /** Treat very light, low-saturation pixels as background (good for off-white / light gray) */
  removeLightNeutral?: boolean;
  lightnessCutoff?: number; // 0-1 lightness threshold when removeLightNeutral enabled (default .9)
  saturationCutoff?: number; // 0-1 saturation threshold (default .18)
  cropPadding?: number; // pixels of padding to keep around cropped subject
}

// Simple client-side white background remover. For best quality, supply a pre-cut transparent image.
export default function BackgroundRemoverImage({
  src,
  alt,
  width = 600,
  height = 600,
  threshold = 245,
  channelDiff = 25,
  borderRadius = 0,
  crop = false,
  showSkeleton = true,
  removeLightNeutral = false,
  lightnessCutoff = 0.9,
  saturationCutoff = 0.18,
  cropPadding = 0,
}: BackgroundRemoverImageProps) {
  const [processed, setProcessed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{w:number;h:number}>({w:width,h:height});

  useEffect(() => {
    let cancelled = false;
    setProcessed(null);
    setError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      try {
        if (cancelled) return;
        let w = img.naturalWidth || width;
        let h = img.naturalHeight || height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unsupported');
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const maxCh = Math.max(r, g, b);
          const minCh = Math.min(r, g, b);
          let makeTransparent = false;
          // Near pure white / neutral test (RGB based)
          if (maxCh >= threshold && maxCh - minCh <= channelDiff) {
            makeTransparent = true;
          }
          if (!makeTransparent && removeLightNeutral) {
            // HSL-based light neutral detection
            const rn = r / 255, gn = g / 255, bn = b / 255;
            const maxV = Math.max(rn, gn, bn);
            const minV = Math.min(rn, gn, bn);
            const diff = maxV - minV;
            const lightness = (maxV + minV) / 2;
            const saturation = diff === 0 ? 0 : diff / (1 - Math.abs(2 * lightness - 1));
            if (lightness >= lightnessCutoff && saturation <= saturationCutoff) {
              makeTransparent = true;
            }
          }
          if (makeTransparent) {
            data[i + 3] = 0; // make transparent
          } else if (data[i + 3] > 0) {
            const px = (i / 4) % w;
            const py = Math.floor((i / 4) / w);
            if (px < minX) minX = px;
            if (py < minY) minY = py;
            if (px > maxX) maxX = px;
            if (py > maxY) maxY = py;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        if (crop && maxX >= 0 && maxY >= 0) {
          const pad = Math.max(0, cropPadding);
          const cropW = maxX - minX + 1;
          const cropH = maxY - minY + 1;
          const sx = Math.max(0, minX - pad);
          const sy = Math.max(0, minY - pad);
          const ex = Math.min(w, maxX + pad + 1);
          const ey = Math.min(h, maxY + pad + 1);
          const finalW = ex - sx;
          const finalH = ey - sy;
          const c2 = document.createElement('canvas');
          c2.width = finalW;
          c2.height = finalH;
          const c2ctx = c2.getContext('2d');
          if (c2ctx) {
            c2ctx.putImageData(ctx.getImageData(sx, sy, finalW, finalH), 0, 0);
            const out2 = c2.toDataURL('image/webp');
            if (!cancelled) { setProcessed(out2); setNaturalSize({w:finalW,h:finalH}); }
          }
        } else {
          const out = canvas.toDataURL('image/webp');
          if (!cancelled) { setProcessed(out); setNaturalSize({w,h}); }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Processing failed');
      }
    };
    img.onerror = () => { if (!cancelled) setError('Image load failed'); };
    return () => { cancelled = true; };
  }, [src, threshold, channelDiff, width, height, crop, removeLightNeutral, lightnessCutoff, saturationCutoff, cropPadding]);

  if (error) {
    return <Box sx={{ width: '100%', textAlign: 'center', fontSize: 12, opacity: 0.7 }}>{alt}</Box>;
  }

  const aspect = naturalSize.w / naturalSize.h;
  const renderedHeight = Math.round((width || naturalSize.w) / aspect);
  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: width, mx: 'auto', lineHeight: 0 }}>
      {!processed && showSkeleton && <Skeleton variant="rectangular" width={width} height={height} sx={{ borderRadius }} />}
      {processed && (
        <Box
          component="img"
          src={processed}
          alt={alt}
          width={width}
          height={renderedHeight}
          sx={{ display: 'block', width: '100%', height: 'auto', borderRadius }}
        />
      )}
    </Box>
  );
}
