import { useState, useCallback, type MouseEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, BookOpen, X, ZoomIn, ZoomOut, Maximize, Move, Mail, Phone, Check, Globe, AtSign, MapPin } from 'lucide-react';
import { useCanvasTransform } from './useCanvasTransform';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(typeof window !== 'undefined' && window.innerWidth < 640);
  const { containerRef, transform, isAnimating, zoomIn, zoomOut, resetTransform, fitToScreen, focusOnElement, centerView, shiftViewForOpen } = useCanvasTransform();

  // Handle window resize for responsive dimensions
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const copyToClipboard = useCallback((email: string) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    });
  }, []);

  const handleOpenToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    shiftViewForOpen(newIsOpen, isFlipped);
  };

  const handleFlipToggle = () => {
    const newIsFlipped = !isFlipped;
    setIsFlipped(newIsFlipped);
    shiftViewForOpen(isOpen, newIsFlipped);
  };

  const handlePanelClick = (e: MouseEvent<HTMLDivElement>) => {
    focusOnElement(e.currentTarget);
  };

  const zoomPercent = Math.round(transform.scale * 100);

  // Card dimensions configuration
  const cardDimensions = {
    mobile: { width: 340, height: 580 },
    desktop: { width: 600, height: 720 },
  };

  // Use current dimensions based on viewport
  const currentDimensions = isMobileView ? cardDimensions.mobile : cardDimensions.desktop;

  return (
    <div className="min-h-screen bg-stone-200 flex flex-col items-center justify-center font-sans text-stone-800 overflow-hidden relative">
      
      {/* Canvas area — full viewport, handles zoom/pan */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ overflow: 'hidden' }}
      >
        {/* Subtle grid background to convey canvas feel */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Transformable content layer */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: 'center center',
            willChange: 'transform',
            transition: isAnimating ? 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
          }}
        >

      {/* Scene with perspective */}
      <div style={{ perspective: '1200px' }} className="relative z-0">
        
        {/* Main Brochure Container */}
        <motion.div
          className="relative sm:w-fit"
          animate={{ 
            rotateY: isFlipped ? 180 : (isOpen ? 0 : -10),
            rotateX: isOpen ? 0 : 5,
            scale: isOpen ? 0.9 : 1
          }}
          transition={{ duration: 1.0, ease: [0.32, 0.72, 0, 1] }}
          style={{ 
            transformStyle: 'preserve-3d',
            width: `${currentDimensions.width}px`,
            height: `${currentDimensions.height}px`,
          }}
        >
          
          {/* CENTER PANEL */}
          <div 
            className="absolute inset-0 shadow-2xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Inside Center */}
            <div 
              className="absolute inset-0 bg-white p-4 sm:p-8 flex flex-col justify-between cursor-pointer text-gray-800"
              style={{ backfaceVisibility: 'hidden' }}
              onClick={handlePanelClick}
            >
              <h2 className="font-serif text-2xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center uppercase tracking-widest border-b pb-3 sm:pb-3 border-black text-black flex flex-col items-center">
                Menú & Precios
                <span className="block text-[8px] sm:text-[10px] font-sans font-normal normal-case mt-1 sm:mt-1 tracking-normal text-gray-500">
                  Precio por Kilogramo
                </span>
              </h2>
              
              <div className="space-y-4 sm:space-y-6 flex-1">
                <div className="group">
                  <div className="flex items-baseline justify-between mb-0.5 sm:mb-1">
                    <h3 className="font-serif text-sm sm:text-lg font-bold group-hover:underline decoration-1 underline-offset-4 text-black">
                      Ñoquis Rellenos
                    </h3>
                    <div className="flex-grow mx-2 sm:mx-4 border-b border-dotted border-gray-400 h-1"></div>
                    <span className="font-sans text-sm sm:text-base font-semibold text-black">$800</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-snug">
                    Rellenos de muzzarella en masa de rúcula y semillas.
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-snug mb-1 sm:mb-2">
                    Rellenos de muzzarella en masa de espinaca.
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-baseline justify-between mb-0.5 sm:mb-1">
                    <h3 className="font-serif text-sm sm:text-lg font-bold group-hover:underline decoration-1 underline-offset-4 text-black">
                      Ñoquis Clásicos
                    </h3>
                    <div className="flex-grow mx-2 sm:mx-4 border-b border-dotted border-gray-400 h-1"></div>
                    <span className="font-sans text-sm sm:text-base font-semibold text-black">$600</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-snug">
                    Parmesano.
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-snug">
                    Puerro y nuez.
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-snug">
                    Limón y gengibre.
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-snug mb-1 sm:mb-2">
                    Morrón asado.
                  </p>
                </div>

                <div className="group">
                  <div className="flex items-baseline justify-between mb-0.5 sm:mb-1">
                    <h3 className="font-serif text-sm sm:text-lg font-bold group-hover:underline decoration-1 underline-offset-4 text-black">
                      Raviolones
                    </h3>
                    <div className="flex-grow mx-2 sm:mx-4 border-b border-dotted border-gray-400 h-1"></div>
                    <span className="font-sans text-sm sm:text-base font-semibold text-black">$400</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-snug">
                    Rellenos de ricota, espinaca y nuez.
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-light leading-snug mb-1 sm:mb-2">
                    Rellenos de berenjena, tomates secos y albahaca.
                  </p>
                </div>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-dotted border-gray-300">
                  <h3 className="font-serif text-base sm:text-xl font-bold mb-2 sm:mb-3 text-center text-black uppercase tracking-widest py-1 sm:py-1 flex items-center justify-center">
                    Salsas <span className="font-sans text-[9px] sm:text-[10px] font-normal normal-case tracking-normal text-gray-500 ml-1 sm:ml-2 mt-[2px]">(250gr)</span>
                  </h3>
                  <div className="space-y-1 sm:space-y-1 px-1 sm:px-2">
                    <div className="flex items-baseline justify-between text-[11px] sm:text-xs text-gray-600 font-medium">
                      <span>Tomates asados</span>
                      <div className="flex-grow mx-2 sm:mx-3 border-b border-dotted border-gray-300 h-1"></div>
                      <span className="font-bold text-black">$250</span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px] sm:text-xs text-gray-600 font-medium">
                      <span>Crema de morrón</span>
                      <div className="flex-grow mx-2 sm:mx-3 border-b border-dotted border-gray-300 h-1"></div>
                      <span className="font-bold text-black">$280</span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px] sm:text-xs text-gray-600 font-medium">
                      <span>Crema de parmesano</span>
                      <div className="flex-grow mx-2 sm:mx-3 border-b border-dotted border-gray-300 h-1"></div>
                      <span className="font-bold text-black">$320</span>
                    </div>
                  </div>
                </div>


              </div>

              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 flex justify-center gap-4 sm:gap-8">
                <div className="text-center flex flex-col items-center">
                  <Move className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-1 text-gray-400" strokeWidth={1} />
                  <p className="text-[7px] sm:text-[9px] uppercase tracking-wide font-semibold">Delivery</p>
                </div>
                <div className="text-center flex flex-col items-center">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-1 text-gray-400" strokeWidth={1} />
                  <p className="text-[7px] sm:text-[9px] uppercase tracking-wide font-semibold">Take Away</p>
                </div>
                <div className="text-center flex flex-col items-center">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-1 text-gray-400" strokeWidth={1} />
                  <p className="text-[7px] sm:text-[9px] uppercase tracking-wide font-semibold">Efectivo / QR</p>
                </div>
              </div>

              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />
            </div>
            
            {/* Outside Back */}
            <div 
              className="absolute inset-0 bg-[#0f0f0f] flex flex-col justify-between text-gray-100 border-l border-gray-800 cursor-pointer overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              onClick={handlePanelClick}
            >
              {/* Top Contact Section */}
              <div className="flex-1 flex flex-col items-center justify-center text-center p-5 sm:p-8 relative">
                <div className="absolute top-4 left-4 right-4 bottom-4 border border-white opacity-20 pointer-events-none"></div>
                <div className="mb-4 sm:mb-6 relative z-10">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-black rounded-full border-2 border-white flex items-center justify-center shadow-lg overflow-hidden">
                    <img 
                      src="img/punto-p-logo.jpg" 
                      alt="PUNTO P Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl tracking-widest uppercase mb-1">Punto P</h1>
                  <p className="font-serif italic text-xs sm:text-base tracking-wide text-gray-300">Pasteria de Autor</p>
                </div>
                
                <div className="w-12 sm:w-16 h-px bg-white/50 mb-4 sm:mb-6"></div>
                
                <div className="space-y-3 sm:space-y-4 z-10 w-full max-w-xs">
                  <div 
                    className="flex items-center justify-center gap-2 sm:gap-3 group cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={(e) => { e.stopPropagation(); window.open('tel:098895881'); }}
                  >
                    <Phone className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs tracking-widest font-light">098895881</span>
                  </div>
                  <div 
                    className="flex items-center justify-center gap-2 sm:gap-3 group cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={(e) => { e.stopPropagation(); window.open('https://www.puntop.com', '_blank'); }}
                  >
                    <Globe className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs tracking-widest font-light">www.puntop.com</span>
                  </div>
                  <div 
                    className="flex items-center justify-center gap-2 sm:gap-3 group cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={(e) => { e.stopPropagation(); window.open('https://instagram.com/puntoppastas', '_blank'); }}
                  >
                    <AtSign className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs tracking-widest font-light">@puntoppastas</span>
                  </div>
                  <div 
                    className="flex items-center justify-center gap-2 sm:gap-3 group cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard('info@puntop.com'); }}
                  >
                    <Mail className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs tracking-widest font-light">info@puntop.com</span>
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div className="h-48 sm:h-64 relative bg-[#0a0a0a] border-t border-gray-800 flex-shrink-0">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  opacity: 0.3
                }}></div>
                <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                  <div className="absolute left-1/4 h-full w-2 bg-gray-600"></div>
                  <div className="absolute left-1/2 h-full w-3 bg-gray-400 transform -translate-x-1/2"></div>
                  <div className="absolute right-1/4 h-full w-1 bg-gray-600"></div>
                  <div className="absolute top-1/3 w-full h-2 bg-gray-600"></div>
                  <div className="absolute top-2/3 w-full h-3 bg-gray-400 transform -translate-y-1/2"></div>
                </div>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                  <div className="bg-black text-white px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1 shadow-md border border-gray-800">
                    Punto P
                  </div>
                  <MapPin size={32} className="text-white filter drop-shadow-xl" />
                  <div className="w-3 h-1 bg-black/50 rounded-full blur-[2px] mt-[-2px]"></div>
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="inline-block bg-black/90 px-4 sm:px-6 py-2 sm:py-3 shadow-sm backdrop-blur-sm border border-gray-800">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-white">
                      Av. Siempre Viva 1234
                    </p>
                    <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                      Montevideo, Uruguay
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="bg-black py-3 sm:py-4 border-t border-gray-800 flex justify-center px-6 sm:px-8 text-[8px] sm:text-[10px] text-gray-500 tracking-widest flex-shrink-0">
                <p>Desarrollado por <a href="https://rodrip.online" target="_blank" rel="noopener noreferrer" title="Portafolio de RodriP." class="text-white hover:text-white transition-colors"><span class="text-md font-semibold tracking-tighter">Rodri<span class="text-emerald-500">P</span></span></a></p>
              </div>
              
              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          </div>

          {/* LEFT PANEL */}
          <motion.div
            className="absolute top-0 right-full w-full h-full origin-right"
            animate={{ 
              rotateY: isOpen ? 0 : 180,
              z: isOpen ? 0 : 2
            }}
            transition={{ 
              duration: 0.5, 
              ease: "easeInOut",
              delay: isOpen ? 0 : 0.4 // Opens first, closes second
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Inside Left */}
            <div 
              className="absolute inset-0 bg-white p-4 sm:p-10 flex flex-col justify-center border-r border-gray-200 cursor-pointer text-gray-800"
              style={{ backfaceVisibility: 'hidden' }}
              onClick={handlePanelClick}
            >
              <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
                <p className="font-serif italic text-xs sm:text-base text-gray-500 mb-1 sm:mb-2">Esteban Stancov</p>
                <h1 className="font-serif text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-black leading-tight">
                  Artesano<br />de la Pasta
                </h1>
                <div className="h-[2px] w-10 sm:w-16 bg-black mx-auto mb-3 sm:mb-4"></div>
                <p className="font-light text-gray-600 leading-snug sm:leading-relaxed max-w-[250px] mx-auto text-[10px] sm:text-[13px]">
                  Mi pasión es crear pasta fresca con los ingredientes más nobles, respetando las tradiciones y añadiendo mi toque de autor.
                </p>
              </div>
              <div className="mt-auto">
                <div className="bg-[#f4f4f4] p-4 sm:p-6 rounded-sm border border-gray-200 w-full max-w-[280px] mx-auto shadow-sm">
                  <h3 className="font-serif text-base sm:text-xl mb-2 sm:mb-4 text-center text-black">Recomendación del Chef</h3>
                  <div className="flex items-center justify-between border-b border-gray-300 pb-1 sm:pb-2 mb-1 sm:mb-2">
                    <span className="font-medium text-[11px] sm:text-sm text-gray-800">Raviolones</span>
                    <span className="font-bold font-serif text-xs sm:text-base text-black">$400</span>
                  </div>
                  <p className="text-[9px] sm:text-[11px] text-gray-500 italic text-center leading-tight">Bondiola ahumada, morrón y rúcula.</p>
                </div>
              </div>
              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />
            </div>
            
            {/* Outside Cover (Right panel of the image, Folds in last, visible when closed) */}
            <div 
              className="absolute inset-0 flex flex-col bg-black shadow-2xl overflow-hidden cursor-pointer"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              onClick={handlePanelClick}
            >
              {/* Background image with overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="img/punto-p-img3.webp" 
                  alt="Pasta Artesanal" 
                  className="w-full h-full object-cover opacity-60 grayscale contrast-125"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-90"></div>
                <div className="absolute inset-0 bg-black/30"></div>
              </div>
              
              {/* Content container */}
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-8 sm:p-12 text-center">
                
                {/* Top decorative element */}
                <div className="flex flex-col items-center gap-3 mt-1">
                  <span className="uppercase tracking-[0.4em] text-[14px] sm:text-[15px] font-light text-gray-300">Esteban Stancov</span>
                  <div className="w-[1px] h-12 sm:h-14 bg-white/50"></div>
                </div>
                
                {/* Center content */}
                <div className="flex flex-col items-center gap-6 sm:gap-8">
                  {/* Logo circle */}
                  <div className="w-32 h-32 sm:w-40 sm:h-40 relative rounded-full border border-white flex items-center justify-center bg-black overflow-hidden shadow-lg">
                    <div className="absolute inset-1 border border-white/50 rounded-full z-10 pointer-events-none"></div>
                    <img 
                      src="img/punto-p-logo.jpg" 
                      alt="Punto P Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Title and subtitle */}
                  <div className="space-y-2 sm:space-y-3">
                    <h1 className="text-4xl sm:text-5xl tracking-wider text-white font-light">
                      PUNTO P
                    </h1>
                    <p className="italic text-lg sm:text-xl text-gray-300 font-light tracking-wide">
                      Pasteria de autor
                    </p>
                  </div>
                </div>
                
                {/* Bottom decorative and action elements */}
                <div className="space-y-4 sm:space-y-6 flex flex-col items-center w-full">
                  <div className="w-full flex items-center gap-4 opacity-50">
                    <div className="h-[1px] flex-1 bg-white"></div>
                    <span className="text-lg sm:text-xl font-light italic">Especialidad en pastas</span>
                    <div className="h-[1px] flex-1 bg-white"></div>
                  </div>
                  
                  <button className="group relative px-8 sm:px-10 py-3 sm:py-4 overflow-hidden bg-transparent border border-white/30 text-white text-xs sm:text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300 font-light">
                    <span className="relative z-10">Descubre el menú</span>
                  </button>
                  
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-400 font-light">
                    Temporada Otoño
                  </div>
                </div>
              </div>
              
              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
            </div>
          </motion.div>

        </motion.div>
      </div>

        </div>{/* end transformable content layer */}
      </div>{/* end canvas area */}

      {/* Brochure controls — fixed at bottom center, outside transform */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3">
        <button 
          onClick={handleOpenToggle}
          className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all text-stone-700 font-medium active:scale-95 text-sm sm:text-base"
        >
          {isOpen ? <X size={18} /> : <BookOpen size={18} />}
          {isOpen ? 'Cerrar' : 'Abrir'}
        </button>
        
        <button 
          onClick={handleFlipToggle}
          className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-stone-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-medium active:scale-95 text-sm sm:text-base"
        >
          <RotateCcw size={18} className={isFlipped ? "rotate-180 transition-transform" : "transition-transform"} />
          {isFlipped ? 'Portada' : 'Reverso'}
        </button>
      </div>

      {/* Zoom Controls — fixed overlay, bottom-right, desktop only */}
      <div className="fixed bottom-20 right-4 z-50 hidden sm:flex flex-col items-center gap-2">
        {/* Zoom percentage badge */}
        <div className="bg-black/70 text-white text-xs font-mono px-2 py-1 rounded-md mb-1 min-w-[48px] text-center">
          {zoomPercent}%
        </div>

        <div className="flex flex-col bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
          <button
            onClick={zoomIn}
            className="p-3 hover:bg-stone-100 active:bg-stone-200 transition-colors border-b border-stone-100"
            title="Acercar"
          >
            <ZoomIn size={20} className="text-stone-700" />
          </button>
          <button
            onClick={zoomOut}
            className="p-3 hover:bg-stone-100 active:bg-stone-200 transition-colors border-b border-stone-100"
            title="Alejar"
          >
            <ZoomOut size={20} className="text-stone-700" />
          </button>
          <button
            onClick={fitToScreen}
            className="p-3 hover:bg-stone-100 active:bg-stone-200 transition-colors border-b border-stone-100"
            title="Ver completo"
          >
            <Maximize size={20} className="text-stone-700" />
          </button>
          <button
            onClick={resetTransform}
            className="p-3 hover:bg-stone-100 active:bg-stone-200 transition-colors"
            title="Restablecer"
          >
            <RotateCcw size={18} className="text-stone-700" />
          </button>
        </div>
      </div>

      {/* Mobile hint — auto-fades after a few seconds */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 sm:hidden pointer-events-none hint-fade">
        <div className="bg-black/70 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
          <Move size={14} />
          Pellizca para zoom · Arrastra para mover
        </div>
      </div>

      {/* Snackbar — copy confirmation */}
      <div 
        className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 pointer-events-none ${
          copiedEmail ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="bg-stone-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2">
          <Check size={14} className="text-green-400" />
          Email copiado al portapapeles
        </div>
      </div>

    </div>
  );
}
