import { useState, useCallback, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, BookOpen, X, ZoomIn, ZoomOut, Maximize, Move, Mail, Phone, Check } from 'lucide-react';
import { useCanvasTransform } from './useCanvasTransform';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const { containerRef, transform, isAnimating, zoomIn, zoomOut, resetTransform, fitToScreen, focusOnElement, centerView } = useCanvasTransform();

  const copyToClipboard = useCallback((email: string) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    });
  }, []);

  const handleOpenToggle = () => {
    setIsOpen(!isOpen);
    centerView();
  };

  const handleFlipToggle = () => {
    setIsFlipped(!isFlipped);
    centerView();
  };

  const handlePanelClick = (e: MouseEvent<HTMLDivElement>) => {
    focusOnElement(e.currentTarget);
  };

  const zoomPercent = Math.round(transform.scale * 100);

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
      <div style={{ perspective: '2000px' }} className="relative z-0">
        
        {/* Main Brochure Container */}
        <motion.div
          className="relative w-[240px] h-[520px] sm:w-[300px] sm:h-[650px]"
          animate={{ 
            rotateY: isFlipped ? 180 : (isOpen ? 0 : -10),
            rotateX: isOpen ? 0 : 5,
            scale: isOpen ? 0.9 : 1
          }}
          transition={{ duration: 1.0, ease: [0.32, 0.72, 0, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          
          {/* CENTER PANEL */}
          <div 
            className="absolute inset-0 shadow-2xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Inside Center */}
            <div 
              className="absolute inset-0 bg-stone-50 p-5 sm:p-8 flex flex-col cursor-pointer"
              style={{ backfaceVisibility: 'hidden' }}
              onClick={handlePanelClick}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#ff4040]">Actividades</h2>
              <p className="text-stone-700 flex-1 leading-relaxed text-xs sm:text-base">
                Círculos de mujeres, talleres de autoconocimiento, y ceremonias de paso. Un lugar para reconectar con nuestra esencia.
              </p>
              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />
            </div>
            
            {/* Outside Back (Center panel of the image) */}
            <div 
              className="absolute inset-0 bg-white p-4 sm:p-6 flex flex-col text-[10px] sm:text-sm border-l border-stone-200 cursor-pointer"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              onClick={handlePanelClick}
            >
              <div className="flex justify-center mb-3 sm:mb-6 mt-2 sm:mt-4">
                <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full border-[2px] border-[#6b5b95] flex items-center justify-center relative overflow-hidden bg-white">
                  <img 
                    src="/Relacahupan_logo.png" 
                    alt="RELACAHUPAN Uruguay" 
                    className="w-full h-full object-contain p-1 sm:p-2"
                  />
                </div>
              </div>
              
              <div className="text-stone-800 space-y-2 sm:space-y-4 flex-1">
                <p className="font-medium text-xs sm:text-base">Contacto:</p>
                
                <div>
                  <p className="font-medium leading-tight">RELACAHUPAN Uruguay <span className="font-normal hidden sm:inline">(Red Latinoamericana y del Caribe para la Humanización del Parto y el Nacimiento)</span><span className="font-normal sm:hidden">(Red Latinoamericana...)</span></p>
                  <div className="mt-1.5 text-stone-600 space-y-1 sm:space-y-1.5">
                    <button
                      onClick={() => copyToClipboard('relacahupanuruguaydoulas@gmail.com')}
                      className="flex items-center gap-1.5 w-full text-left group"
                    >
                      <Mail size={12} className="shrink-0 text-stone-400 group-hover:text-[#4a86e8] transition-colors" />
                      <span className="text-[9px] sm:text-xs break-all group-hover:text-[#4a86e8] transition-colors">relacahupanuruguaydoulas@gmail.com</span>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="font-medium leading-tight">Instituto Perinatal del Uruguay (IPU)</p>
                  <div className="mt-1.5 text-stone-600 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] sm:text-xs text-stone-500">Directora: Rosa Rinaldi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="shrink-0 text-stone-400" />
                      <span className="text-[9px] sm:text-xs">099 059 575</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard('institutoperinataldeluruguay@gmail.com')}
                      className="flex items-center gap-1.5 w-full text-left group"
                    >
                      <Mail size={12} className="shrink-0 text-stone-400 group-hover:text-[#4a86e8] transition-colors" />
                      <span className="text-[9px] sm:text-xs break-all group-hover:text-[#4a86e8] transition-colors">institutoperinataldeluruguay@gmail.com</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* IPU Logo */}
              <div className="flex justify-center mt-2 sm:mt-4">
                <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full border-[2px] border-[#6b5b95] flex items-center justify-center overflow-hidden bg-white">
                  <img 
                    src="/ipu_logo.jpg" 
                    alt="Instituto Perinatal del Uruguay" 
                    className="w-full h-full object-contain p-1 sm:p-2"
                  />
                </div>
              </div>
              
              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          </div>

          {/* RIGHT PANEL */}
          <motion.div
            className="absolute top-0 left-full w-full h-full origin-left"
            animate={{ 
              rotateY: isOpen ? 0 : -180,
              z: isOpen ? 0 : 1
            }}
            transition={{ 
              duration: 0.5, 
              ease: "easeInOut",
              delay: isOpen ? 0.4 : 0 // Opens second, closes first
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Inside Right */}
            <div 
              className="absolute inset-0 bg-white p-5 sm:p-8 flex flex-col border-l border-stone-200 cursor-pointer"
              style={{ backfaceVisibility: 'hidden' }}
              onClick={handlePanelClick}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#ff4040]">Participa</h2>
              <p className="text-stone-700 leading-relaxed text-xs sm:text-base">
                Únete a nuestra comunidad y sé parte de este movimiento de transformación.
              </p>
              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/5 pointer-events-none" />
            </div>
            
            {/* Outside Flap (Left panel of the image, Folds in first) */}
            <div 
              className="absolute inset-0 bg-[#ff4040] p-4 sm:p-6 flex flex-col border-r border-red-500/50 text-stone-900 cursor-pointer"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              onClick={handlePanelClick}
            >
              {/* Arched Image */}
              <div className="relative w-full aspect-[2/2.2] sm:aspect-[2/2.8] mt-1 sm:mt-2 mb-3 sm:mb-8">
                <div className="absolute inset-0 border border-white rounded-t-full rounded-b-sm m-1 sm:m-2 z-10 pointer-events-none">
                  {/* Diamonds */}
                  <div className="absolute top-1/2 -left-1.5 w-2 h-2 sm:w-3 sm:h-3 bg-white rotate-45"></div>
                  <div className="absolute top-1/2 -right-1.5 w-2 h-2 sm:w-3 sm:h-3 bg-white rotate-45"></div>
                </div>
                <div className="w-full h-full p-1.5 sm:p-3">
                  <div className="w-full h-full rounded-t-full rounded-b-sm overflow-hidden bg-red-900">
                    <img 
                      src="https://images.unsplash.com/photo-1518893063132-36e46dbe2428?w=400&q=80" 
                      alt="Interior Carpa" 
                      className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

              <h2 className="text-sm sm:text-lg font-medium leading-tight mb-2 sm:mb-4">¿Qué es la Carpa Roja? (El Origen)</h2>
              
              <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-3 text-[10px] sm:text-sm leading-snug">
                <li className="pl-1">
                  <strong>Un espacio ancestral:</strong> Inspirado en las tradiciones del Antiguo Testamento, donde el linaje materno perpetuaba el conocimiento.
                </li>
                <li className="pl-1">
                  <strong>El refugio femenino:</strong> Históricamente, era el lugar donde las mujeres se reunían...
                </li>
              </ul>

              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
            </div>
          </motion.div>

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
              className="absolute inset-0 bg-white p-5 sm:p-8 flex flex-col border-r border-stone-200 cursor-pointer"
              style={{ backfaceVisibility: 'hidden' }}
              onClick={handlePanelClick}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-[#ff4040]">La Experiencia</h2>
              <p className="text-stone-700 leading-relaxed text-xs sm:text-base">
                Un espacio diseñado para conectar, sanar y compartir.
              </p>
              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 pointer-events-none" />
            </div>
            
            {/* Outside Cover (Right panel of the image, Folds in last, visible when closed) */}
            <div 
              className="absolute inset-0 flex flex-col bg-[#ff4040] shadow-2xl overflow-hidden cursor-pointer"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              onClick={handlePanelClick}
            >
              <div className="h-[65%] w-full relative bg-red-900">
                <img 
                  src="/carpa_frente.jpg" 
                  alt="Carpa Roja" 
                  className="w-full h-full object-cover opacity-90 mix-blend-luminosity"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-[#ff4040]/40 mix-blend-overlay"></div>
              </div>
              <div className="h-[35%] w-full flex flex-col items-center justify-center relative px-4">
                {/* Curved arch title */}
                <svg viewBox="0 0 260 80" className="w-[200px] sm:w-[260px] overflow-visible">
                  <defs>
                    <path id="titleArc" d="M 10,70 Q 130,0 250,70" fill="none" />
                  </defs>
                  <text
                    fontSize="44"
                    fontWeight="bold"
                    fill="black"
                    fontFamily="Arial, sans-serif"
                    letterSpacing="-1"
                  >
                    <textPath href="#titleArc" startOffset="50%" textAnchor="middle">
                      La carpa roja
                    </textPath>
                  </text>
                </svg>
                <p className="text-[8px] sm:text-xs text-black/70 uppercase tracking-[0.15em] mt-3 sm:mt-1.5 font-medium text-center leading-tight">
                  Un espacio simbólico de encuentro, sanación y derechos.
                </p>
              </div>
              {/* Inner shadow for fold depth */}
              <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
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

      {/* Zoom Controls — fixed overlay, bottom-right */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-center gap-2">
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
