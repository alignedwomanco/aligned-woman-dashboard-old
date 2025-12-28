import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCw, Move } from "lucide-react";

export default function ImageCropper({ image, onCrop, onCancel }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      drawImage();
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    if (imageLoaded) {
      drawImage();
    }
  }, [zoom, rotation, position, imageLoaded]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;

    const ctx = canvas.getContext("2d");
    const img = imgRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom and position
    const scale = zoom;
    ctx.scale(scale, scale);
    ctx.translate(position.x, position.y);

    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    // Restore context
    ctx.restore();

    // Draw crop circle
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 150, 0, 2 * Math.PI);
    ctx.stroke();

    // Darken outside area
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 150, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement("canvas");
    const cropSize = 300; // Output size
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const cropCtx = cropCanvas.getContext("2d");

    const img = imgRef.current;
    const scale = zoom;

    // Save context
    cropCtx.save();

    // Move to center
    cropCtx.translate(cropSize / 2, cropSize / 2);

    // Apply rotation
    cropCtx.rotate((rotation * Math.PI) / 180);

    // Apply zoom and position
    cropCtx.scale(scale, scale);
    cropCtx.translate(position.x, position.y);

    // Draw image
    cropCtx.drawImage(img, -img.width / 2, -img.height / 2);

    cropCtx.restore();

    // Convert to blob and call onCrop
    cropCanvas.toBlob((blob) => {
      onCrop(blob);
    }, "image/jpeg", 0.95);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop & Adjust Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas */}
          <div className="flex justify-center bg-gray-100 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="border border-gray-300 rounded-lg cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Zoom</label>
                <div className="flex items-center gap-2">
                  <ZoomOut className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{zoom.toFixed(1)}x</span>
                  <ZoomIn className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(val) => setZoom(val[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="[&>span:first-child]:bg-[var(--theme-secondary,#5B2E84)]"
              />
            </div>

            {/* Rotation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Rotation</label>
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{rotation}°</span>
                </div>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(val) => setRotation(val[0])}
                min={0}
                max={360}
                step={1}
                className="[&>span:first-child]:bg-[var(--theme-secondary,#5B2E84)]"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Move className="w-4 h-4" />
              <span>Click and drag on the image to reposition</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCrop}
              className="flex-1 text-white"
              style={{ backgroundColor: 'var(--theme-secondary, #5B2E84)' }}
            >
              Apply & Upload
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}