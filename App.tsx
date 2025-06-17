import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

/**
 * P33ly PFP Editor - Production Version
 * 
 * Features:
 * - Upload profile pictures (400x400 recommended)
 * - 4 P33ly themed hats with interactive controls
 * - 2 decorative frames with customization
 * - Real-time canvas preview
 * - Mobile-optimized touch interactions
 * - Download as PNG
 */

interface HatSettings {
  scale: number;
  rotation: number;
  positionX: number;
  positionY: number;
}

interface FrameSettings {
  size: number;
  opacity: number;
  rotation: number;
  isAnimating: boolean;
}

type ControlMode = 'move' | 'resize' | 'rotate';

export default function App() {
  // Core state
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [selectedHat, setSelectedHat] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>("frame1");
  
  // Hat settings
  const [hatSettings, setHatSettings] = useState<HatSettings>({
    scale: 1,
    rotation: 0,
    positionX: 0,
    positionY: -20
  });
  
  // Frame settings
  const [frameSettings, setFrameSettings] = useState<FrameSettings>({
    size: 100,
    opacity: 80,
    rotation: 0,
    isAnimating: false
  });
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [controlMode, setControlMode] = useState<ControlMode>('move');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSettings, setInitialSettings] = useState<HatSettings | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Asset loading
  const [hatImages, setHatImages] = useState<{[key: string]: HTMLImageElement}>({});
  const [frameImages, setFrameImages] = useState<{[key: string]: HTMLImageElement}>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // Load assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const loadedHats: {[key: string]: HTMLImageElement} = {};
        const loadedFrames: {[key: string]: HTMLImageElement} = {};
        
        // Load hat images
        for (let i = 1; i <= 4; i++) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = `/hat${i}.png`;
          });
          loadedHats[`hat${i}`] = img;
        }
        
        // Load frame images
        for (let i = 1; i <= 2; i++) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = `/frame${i}.png`;
          });
          loadedFrames[`frame${i}`] = img;
        }
        
        setHatImages(loadedHats);
        setFrameImages(loadedFrames);
        setAssetsLoaded(true);
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };
    
    loadAssets();
  }, []);

  // Canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedImage) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 400, 400);
    
    // Draw main image
    ctx.drawImage(selectedImage, 0, 0, 400, 400);
    
    // Draw frame
    if (selectedFrame && frameImages[selectedFrame]) {
      const frameImg = frameImages[selectedFrame];
      ctx.save();
      
      ctx.globalAlpha = frameSettings.opacity / 100;
      ctx.translate(200, 200);
      
      if (frameSettings.isAnimating) {
        const time = Date.now() * 0.002;
        ctx.rotate(time);
      } else {
        ctx.rotate((frameSettings.rotation * Math.PI) / 180);
      }
      
      const frameSize = (frameSettings.size / 100) * 400;
      ctx.drawImage(frameImg, -frameSize/2, -frameSize/2, frameSize, frameSize);
      ctx.restore();
    }
    
    // Draw hat
    if (selectedHat && hatImages[selectedHat]) {
      const hatImg = hatImages[selectedHat];
      ctx.save();
      
      const hatX = 200 + hatSettings.positionX;
      const hatY = 200 + hatSettings.positionY;
      
      ctx.translate(hatX, hatY);
      ctx.rotate((hatSettings.rotation * Math.PI) / 180);
      
      const hatSize = 120 * hatSettings.scale;
      ctx.drawImage(hatImg, -hatSize/2, -hatSize/2, hatSize, hatSize);
      ctx.restore();
      
      // Draw control buttons when hat is selected
      if (selectedHat) {
        drawControlButtons(ctx, hatX, hatY, hatSize * 0.6);
      }
    }
  }, [selectedImage, selectedHat, selectedFrame, hatSettings, frameSettings, hatImages, frameImages]);

  // Draw control buttons
  const drawControlButtons = (ctx: CanvasRenderingContext2D, hatX: number, hatY: number, hatRadius: number) => {
    const offset = Math.max(hatRadius + 25, 37);
    
    const buttons = [
      { mode: 'move' as ControlMode, x: hatX - offset, y: hatY - offset, color: '#3b82f6' },
      { mode: 'resize' as ControlMode, x: hatX + offset, y: hatY - offset, color: '#f59e0b' },
      { mode: 'rotate' as ControlMode, x: hatX, y: hatY + offset, color: '#10b981' }
    ];
    
    buttons.forEach(button => {
      ctx.beginPath();
      ctx.arc(button.x, button.y, 15, 0, 2 * Math.PI);
      ctx.fillStyle = button.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  // Update canvas when dependencies change
  useEffect(() => {
    if (assetsLoaded) {
      drawCanvas();
    }
  }, [drawCanvas, assetsLoaded]);

  // File upload handling
  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      
      setSelectedImage(img);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }, []);

  // Mouse/touch interaction handlers
  const getMousePos = (e: React.MouseEvent | React.TouchEvent): { x: number, y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: ((clientX - rect.left) / rect.width) * 400,
      y: ((clientY - rect.top) / rect.height) * 400
    };
  };

  const isPointInHat = (x: number, y: number): boolean => {
    if (!selectedHat) return false;
    
    const hatX = 200 + hatSettings.positionX;
    const hatY = 200 + hatSettings.positionY;
    const hatRadius = 60 * hatSettings.scale;
    
    const distance = Math.sqrt((x - hatX) ** 2 + (y - hatY) ** 2);
    return distance <= hatRadius;
  };

  const getControlButtonAt = (x: number, y: number): ControlMode | null => {
    if (!selectedHat) return null;
    
    const hatX = 200 + hatSettings.positionX;
    const hatY = 200 + hatSettings.positionY;
    const hatRadius = 60 * hatSettings.scale;
    const offset = Math.max(hatRadius + 25, 37);
    
    const buttons = [
      { mode: 'move' as ControlMode, x: hatX - offset, y: hatY - offset },
      { mode: 'resize' as ControlMode, x: hatX + offset, y: hatY - offset },
      { mode: 'rotate' as ControlMode, x: hatX, y: hatY + offset }
    ];
    
    for (const button of buttons) {
      const distance = Math.sqrt((x - button.x) ** 2 + (y - button.y) ** 2);
      if (distance <= 15) return button.mode;
    }
    
    return null;
  };

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getMousePos(e);
    
    const controlButton = getControlButtonAt(pos.x, pos.y);
    if (controlButton) {
      setControlMode(controlButton);
      setIsDragging(true);
      setDragStart(pos);
      setInitialSettings({ ...hatSettings });
      return;
    }
    
    if (isPointInHat(pos.x, pos.y)) {
      setControlMode('move');
      setIsDragging(true);
      setDragStart(pos);
      setInitialSettings({ ...hatSettings });
    }
  }, [hatSettings, selectedHat]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !initialSettings) return;
    
    e.preventDefault();
    const pos = getMousePos(e);
    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;
    
    switch (controlMode) {
      case 'move':
        setHatSettings(prev => ({
          ...prev,
          positionX: initialSettings.positionX + deltaX,
          positionY: initialSettings.positionY + deltaY
        }));
        break;
        
      case 'resize':
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const scale = Math.max(0.3, Math.min(10, initialSettings.scale + distance * 0.01));
        setHatSettings(prev => ({ ...prev, scale }));
        break;
        
      case 'rotate':
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        setHatSettings(prev => ({ ...prev, rotation: initialSettings.rotation + angle }));
        break;
    }
  }, [isDragging, dragStart, initialSettings, controlMode]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setInitialSettings(null);
  }, []);

  // Download functionality
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'p33l_pfp.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="app">
      <div className="header">
        <img src="/mascot-header.png" alt="P33LY" className="logo" />
        <h1>P33LY PFP EDITOR</h1>
      </div>

      <div className="main-content">
        {/* Upload Section */}
        <div className="upload-section">
          <h2>Upload Your Profile Picture</h2>
          <div 
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileSelect(Array.from(e.dataTransfer.files));
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {selectedImage ? (
              <div className="upload-preview">
                <img src={selectedImage.src} alt="Preview" />
                <p>Click to change image</p>
              </div>
            ) : (
              <div className="upload-placeholder">
                <p>📸 Drag & drop or click to upload</p>
                <small>Recommended: 400x400px</small>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && handleFileSelect(Array.from(e.target.files))}
            style={{ display: 'none' }}
          />
        </div>

        {/* Hat Selection */}
        <div className="hat-section">
          <h3>Choose Your Hat</h3>
          <div className="hat-grid">
            <div 
              className={`hat-option ${selectedHat === null ? 'selected' : ''}`}
              onClick={() => setSelectedHat(null)}
            >
              <div className="no-hat">No Hat</div>
            </div>
            {Object.keys(hatImages).map(hatKey => (
              <div
                key={hatKey}
                className={`hat-option ${selectedHat === hatKey ? 'selected' : ''}`}
                onClick={() => setSelectedHat(hatKey)}
              >
                <img src={hatImages[hatKey].src} alt={hatKey} />
              </div>
            ))}
          </div>
        </div>

        {/* Frame Selection */}
        <div className="frame-section">
          <h3>Choose Your Frame</h3>
          <div className="frame-grid">
            <div 
              className={`frame-option ${selectedFrame === null ? 'selected' : ''}`}
              onClick={() => setSelectedFrame(null)}
            >
              <div className="no-frame">No Frame</div>
            </div>
            {Object.keys(frameImages).map(frameKey => (
              <div
                key={frameKey}
                className={`frame-option ${selectedFrame === frameKey ? 'selected' : ''}`}
                onClick={() => setSelectedFrame(frameKey)}
              >
                <img src={frameImages[frameKey].src} alt={frameKey} />
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Preview */}
        <div className="canvas-section">
          <h3>Preview & Edit</h3>
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              className="preview-canvas"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onTouchStart={handleCanvasMouseDown}
              onTouchMove={handleCanvasMouseMove}
              onTouchEnd={handleCanvasMouseUp}
            />
            {selectedHat && (
              <div className="canvas-instructions">
                <p>🔵 Move • 🟡 Resize • 🟢 Rotate</p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {(selectedHat || selectedFrame) && (
          <div className="settings-panel">
            <h3>Settings</h3>
            
            {selectedHat && (
              <div className="hat-settings">
                <h4>Hat Settings</h4>
                <div className="setting-group">
                  <label>Size: {Math.round(hatSettings.scale * 100)}%</label>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    value={hatSettings.scale * 100}
                    onChange={(e) => setHatSettings(prev => ({ 
                      ...prev, 
                      scale: parseInt(e.target.value) / 100 
                    }))}
                  />
                </div>
                <div className="setting-group">
                  <label>Rotation: {Math.round(hatSettings.rotation)}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hatSettings.rotation}
                    onChange={(e) => setHatSettings(prev => ({ 
                      ...prev, 
                      rotation: parseInt(e.target.value) 
                    }))}
                  />
                </div>
              </div>
            )}
            
            {selectedFrame && (
              <div className="frame-settings">
                <h4>Frame Settings</h4>
                <div className="setting-group">
                  <label>Size: {frameSettings.size}%</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={frameSettings.size}
                    onChange={(e) => setFrameSettings(prev => ({ 
                      ...prev, 
                      size: parseInt(e.target.value) 
                    }))}
                  />
                </div>
                <div className="setting-group">
                  <label>Opacity: {frameSettings.opacity}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={frameSettings.opacity}
                    onChange={(e) => setFrameSettings(prev => ({ 
                      ...prev, 
                      opacity: parseInt(e.target.value) 
                    }))}
                  />
                </div>
                <div className="setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={frameSettings.isAnimating}
                      onChange={(e) => setFrameSettings(prev => ({ 
                        ...prev, 
                        isAnimating: e.target.checked 
                      }))}
                    />
                    Animated Rotation
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Download Section */}
        <div className="download-section">
          <button 
            className="download-btn"
            onClick={handleDownload}
            disabled={!selectedImage}
          >
            💾 Download P33L PFP
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>Made with ❤️ by P33LY Community</p>
        <div className="social-links">
          <a href="#" target="_blank">Twitter</a>
          <a href="#" target="_blank">Discord</a>
          <a href="#" target="_blank">Instagram</a>
        </div>
      </div>
    </div>
  );
}