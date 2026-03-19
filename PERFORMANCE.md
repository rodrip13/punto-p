# Análisis de Rendimiento — Punto P

> Fecha: 2026-03-18
> Contexto: React + Vite, interacción en mobile gama baja
> Archivos analizados: `App.tsx`, `useCanvasTransform.ts`, `menuData.ts`

---

## Índice

1. [CRÍTICO — Unthrottled touchmove/mousemove](#1-crítico--unthrottled-touchmovemousemove)
2. [ALTO — Unthrottled wheel events](#2-alto--unthrottled-wheel-events)
3. [ALTO — Animaciones 3D con múltiples propiedades](#3-alto--animaciones-3d-con-múltiples-propiedades)
4. [MEDIO-ALTO — Cálculos del carrito en cada render](#4-medio-alto--cálculos-del-carrito-en-cada-render)
5. [MEDIO-ALTO — getPastaGroups y getSalsas llamadas en cada render](#5-medio-alto--getpastagroups-y-getsalsas-llamadas-en-cada-render)
6. [MEDIO — translate() sin aceleración GPU](#6-medio--translate-sin-aceleración-gpu)
7. [MEDIO — cardDimensions creado como objeto nuevo en cada render](#7-medio--carddimensions-creado-como-objeto-nuevo-en-cada-render)
8. [MEDIO — Filtros CSS grayscale + contrast en imagen](#8-medio--filtros-css-grayscale--contrast-en-imagen)
9. [MEDIO — Gradientes apilados en múltiples capas](#9-medio--gradientes-apilados-en-múltiples-capas)
10. [MEDIO — backdrop-blur en elementos](#10-medio--backdrop-blur-en-elementos)
11. [BAJO — Patrón radial-gradient en todo el viewport](#11-bajo--patrón-radial-gradient-en-todo-el-viewport)
12. [BAJO — perspective: 1200px fuerza GPU layers en todos los hijos](#12-bajo--perspective-1200px-fuerza-gpu-layers-en-todos-los-hijos)
13. [BAJO — transition-* en múltiples botones](#13-bajo--transition--en-múltiples-botones)

---

## 1. CRÍTICO — Unthrottled touchmove/mousemove

**Archivos:** `useCanvasTransform.ts:93-103` (touch), `useCanvasTransform.ts:145-157` (mouse)

### Problema

Cada evento `touchmove` y `mousemove` llama directamente a `setTransform()`, lo que dispara un re-render completo del componente `App`. Durante un arrastre, estos eventos se disparan entre 60 y 120 veces por segundo.

```ts
// useCanvasTransform.ts:99-103
setTransform(prev => ({
  ...prev,
  translateX: prev.translateX + dx,
  translateY: prev.translateY + dy,
}));
```

### Impacto

En un dispositivo de gama baja con un presupuesto de ~16ms por frame, cada re-render completo puede consumir 10-20ms, causando freezes visibles durante cualquier gesto de arrastre.

### Plan

Usar `requestAnimationFrame` como throttle. Acumular el delta en un `ref` y aplicar el `setTransform` solo una vez por frame.

```ts
const rafId = useRef<number>();
const pendingDelta = useRef({ dx: 0, dy: 0 });

// En handleTouchMove:
pendingDelta.current.dx += dx;
pendingDelta.current.dy += dy;

if (!rafId.current) {
  rafId.current = requestAnimationFrame(() => {
    setTransform(prev => ({
      ...prev,
      translateX: prev.translateX + pendingDelta.current.dx,
      translateY: prev.translateY + pendingDelta.current.dy,
    }));
    pendingDelta.current = { dx: 0, dy: 0 };
    rafId.current = undefined;
  });
}
```

| | |
|---|---|
| **Pro** | Limita los re-renders a exactamente 60fps (1 por frame), eliminando el principal cuello de botella |
| **Pro** | `requestAnimationFrame` está sincronizado con el ciclo de repintado del browser → no hay renders "en vano" |
| **Pro** | El delta acumulado garantiza que no se pierda ningún movimiento |
| **Contra** | Introduce una pequeña latencia de hasta ~16ms en el movimiento visual |
| **Contra** | Requiere limpiar el RAF en el `handleTouchEnd` / `handleMouseUp` para evitar un frame huérfano |

---

## 2. ALTO — Unthrottled wheel events

**Archivo:** `useCanvasTransform.ts:112-132`

### Problema

El evento `wheel` llama `setTransform()` en cada tick. Al hacer scroll rápido con el mouse o trackpad, pueden dispararse 30+ eventos en menos de 500ms.

```ts
const handleWheel = useCallback((e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.93 : 1.07;
  setTransform(prev => { ... }); // llamado en cada evento
}, []);
```

### Impacto

Estado fragmentado: el zoom se aplica en muchos pasos pequeños en lugar de uno suavizado, causando jank visual y múltiples re-renders innecesarios.

### Plan

Aplicar el mismo patrón `requestAnimationFrame`, acumulando el factor de escala multiplicativo:

```ts
const rafWheel = useRef<number>();
const pendingScale = useRef(1);

const handleWheel = useCallback((e: WheelEvent) => {
  e.preventDefault();
  pendingScale.current *= e.deltaY > 0 ? 0.93 : 1.07;

  if (!rafWheel.current) {
    rafWheel.current = requestAnimationFrame(() => {
      setTransform(prev => {
        const factor = pendingScale.current;
        pendingScale.current = 1;
        rafWheel.current = undefined;
        // ... aplicar factor acumulado
      });
    });
  }
}, []);
```

| | |
|---|---|
| **Pro** | Reduce re-renders de 30+ a máximo 1 por frame |
| **Pro** | El zoom se siente más suave al acumular el factor en lugar de aplicarlo en pasos |
| **Contra** | Mínima complejidad adicional en el hook |
| **Contra** | En trackpads de alta frecuencia, la acumulación puede provocar un salto de zoom levemente mayor por frame |

---

## 3. ALTO — Animaciones 3D con múltiples propiedades simultáneas

**Archivo:** `App.tsx:143-156`

### Problema

El contenedor principal anima 3 propiedades al mismo tiempo: `rotateY`, `rotateX` y `scale`, con `transformStyle: 'preserve-3d'`. Framer Motion calcula estas interpolaciones en JavaScript cada frame.

```tsx
<motion.div
  animate={{
    rotateY: isFlipped ? 180 : (isOpen ? 0 : -10),
    rotateX: isOpen ? 0 : 5,
    scale: isOpen ? 0.9 : 1
  }}
  transition={{ duration: 1.0, ease: [0.32, 0.72, 0, 1] }}
  style={{ transformStyle: 'preserve-3d' }}
>
```

### Impacto

Las GPUs de gama baja manejan mal `preserve-3d` con múltiples propiedades animadas. Puede causar frame drops durante las transiciones de abrir/cerrar/voltear la carta.

### Plan

Reducir a una sola propiedad animada. El `rotateX` de 5° y el `scale: 0.9` son casi imperceptibles y pueden eliminarse sin afectar la experiencia visual.

```tsx
<motion.div
  animate={{ rotateY: isFlipped ? 180 : 0 }}
  transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
  style={{ transformStyle: 'preserve-3d' }}
>
```

| | |
|---|---|
| **Pro** | Reduce la carga de animación en ~60% al eliminar 2 de 3 propiedades |
| **Pro** | `rotateY` solo puede ser optimizado mejor por el browser como layer compuesta |
| **Contra** | Se pierde el efecto de "isOpen" con `rotateX` y `scale` — la carta se siente menos tridimensional al abrir |
| **Contra** | Cambio visual que puede requerir ajustes en la experiencia de apertura |

---

## 4. MEDIO-ALTO — Cálculos del carrito en cada render

**Archivo:** `App.tsx:19-22`

### Problema

`cartItems`, `cartCount` y `cartTotal` se recalculan en cada render de `App`, aunque el estado `cart` no haya cambiado.

```ts
const cartItems = MENU_ITEMS.filter(item => (cart[item.id] ?? 0) > 0);
const cartCount = cartItems.length;
const cartTotal = cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0);
```

Como `App` se re-renderiza durante el pan/zoom (por el punto 1), estos cálculos corren hasta 120 veces por segundo durante arrastre.

### Plan

Envolver en `useMemo`:

```ts
const cartItems = useMemo(
  () => MENU_ITEMS.filter(item => (cart[item.id] ?? 0) > 0),
  [cart]
);
const cartCount = cartItems.length;
const cartTotal = useMemo(
  () => cartItems.reduce((sum, item) => sum + item.price * cart[item.id], 0),
  [cartItems, cart]
);
```

| | |
|---|---|
| **Pro** | Los cálculos solo corren cuando `cart` cambia, no en cada pan/zoom |
| **Pro** | Cambio mínimo, sin riesgo de romper funcionalidad |
| **Contra** | `useMemo` tiene un overhead de comparación de dependencias — en arrays/objetos se compara por referencia, así que funciona correctamente aquí |
| **Contra** | Con solo 11 items en `MENU_ITEMS`, el impacto absoluto es pequeño; la ganancia es proporcional a la frecuencia de renders |

---

## 5. MEDIO-ALTO — getPastaGroups y getSalsas llamadas en cada render

**Archivo:** `menuData.ts:34-45`, `App.tsx:179, 222`

### Problema

`getPastaGroups()` crea un `new Map`, filtra el array completo, crea nuevos objetos `MenuGroup` y devuelve un nuevo array en cada invocación. `getSalsas()` también filtra y devuelve un nuevo array. Como `MENU_ITEMS` es una constante que nunca cambia, estos resultados son siempre idénticos.

```ts
// App.tsx - llamadas en cada render
{getPastaGroups().map(group => ...)}
{getSalsas().map(item => ...)}
```

### Plan

Pre-calcular al cargar el módulo, reemplazando las funciones con constantes exportadas:

```ts
// menuData.ts
export const PASTA_GROUPS: MenuGroup[] = (() => {
  const map = new Map<string, MenuGroup>();
  MENU_ITEMS.filter(i => i.category === 'pasta').forEach(item => {
    if (!map.has(item.name)) map.set(item.name, { name: item.name, price: item.price, items: [] });
    map.get(item.name)!.items.push(item);
  });
  return Array.from(map.values());
})();

export const SALSAS: MenuItem[] = MENU_ITEMS.filter(i => i.category === 'salsa');
```

```tsx
// App.tsx
{PASTA_GROUPS.map(group => ...)}
{SALSAS.map(item => ...)}
```

| | |
|---|---|
| **Pro** | El cálculo ocurre exactamente una vez en toda la vida de la app, no por render |
| **Pro** | Simplifica el código: elimina las funciones y su lógica |
| **Pro** | Las referencias son estables, lo que mejora la memoización en componentes hijos |
| **Contra** | Si en el futuro el menú fuera dinámico (cargado desde API), habría que volver a las funciones |
| **Contra** | Cambio de API pública del módulo: hay que actualizar los imports en `App.tsx` |

---

## 6. MEDIO — translate() sin aceleración GPU

**Archivo:** `App.tsx:132`

### Problema

El layer transformable usa `translate()` en lugar de `translate3d()`. El browser no promueve automáticamente este elemento a una capa de compositing GPU.

```ts
transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
```

### Plan

Cambiar a `translate3d` añadiendo el eje Z en cero:

```ts
transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale})`,
```

| | |
|---|---|
| **Pro** | Fuerza al browser a crear una GPU compositing layer para este elemento |
| **Pro** | El pan/zoom se procesa enteramente en la GPU sin involucrar el main thread |
| **Pro** | Cambio de una línea, sin riesgo funcional |
| **Contra** | Cada GPU layer ocupa memoria de video — en dispositivos con poca VRAM esto puede ser contraproducente si hay muchas layers |
| **Contra** | En algunos browsers viejos `translate3d` puede causar rendering artifacts con `preserve-3d` anidado |

---

## 7. MEDIO — cardDimensions creado como objeto nuevo en cada render

**Archivo:** `App.tsx:102-108`

### Problema

El objeto `cardDimensions` y `currentDimensions` se crean en cada render. Al ser objetos nuevos, rompen cualquier comparación por referencia en componentes hijos memoizados.

```ts
const cardDimensions = {
  mobile: { width: Math.min(windowWidth - 20, 387), height: 580 },
  desktop: { width: 600, height: 720 },
};
const currentDimensions = isMobileView ? cardDimensions.mobile : cardDimensions.desktop;
```

### Plan

```ts
const currentDimensions = useMemo(() => ({
  width: isMobileView ? Math.min(windowWidth - 20, 387) : 600,
  height: isMobileView ? 580 : 720,
}), [isMobileView, windowWidth]);
```

| | |
|---|---|
| **Pro** | Referencia estable — solo cambia cuando `isMobileView` o `windowWidth` cambian |
| **Pro** | Simplifica: elimina el objeto intermedio `cardDimensions` |
| **Contra** | `useMemo` para un objeto tan pequeño tiene overhead mínimo pero no nulo |
| **Contra** | Impacto bajo: solo importa si `currentDimensions` se pasa como prop a componentes memoizados |

---

## 8. MEDIO — Filtros CSS grayscale + contrast en imagen

**Archivo:** `App.tsx` (cara trasera de la carta)

### Problema

Una imagen usa tres filtros CSS simultáneos: `grayscale`, `contrast-125` y `opacity-60`. Cada filtro es una pasada separada en la GPU.

```tsx
className="w-full h-full object-cover opacity-60 grayscale contrast-125"
```

### Plan

Pre-procesar la imagen con la herramienta de edición de imágenes (Squoosh, Sharp, etc.) aplicando los filtros como parte del asset, y servir la imagen ya procesada.

```tsx
// Imagen ya pre-procesada:
className="w-full h-full object-cover"
```

| | |
|---|---|
| **Pro** | Elimina completamente el costo GPU de los filtros en runtime |
| **Pro** | La imagen pre-procesada puede ser más pequeña en bytes (grayscale = 1 canal) |
| **Contra** | Requiere un paso manual fuera del código |
| **Contra** | Si el diseño cambia, hay que re-procesar el asset |
| **Contra** | Menos flexible: no se puede cambiar la intensidad de los filtros via CSS |

---

## 9. MEDIO — Gradientes apilados en múltiples capas

**Archivo:** `App.tsx` (múltiples ubicaciones)

### Problema

Varios elementos tienen gradientes apilados con 3 color stops (`from-black via-transparent to-black`), que son más costosos que gradientes simples de 2 stops.

```tsx
<div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-90"></div>
<div className="absolute inset-0 bg-black/30"></div>
```

### Plan

Simplificar a gradientes de 2 stops o reemplazar con color sólido con opacidad donde sea posible:

```tsx
<div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
```

| | |
|---|---|
| **Pro** | Gradientes de 2 stops son más rápidos de calcular |
| **Pro** | Elimina divs extra apilados |
| **Contra** | Cambio visual — el efecto con `via-transparent` es diferente al de 2 stops |
| **Contra** | Requiere revisión visual cuidadosa cara a cara con el diseño |

---

## 10. MEDIO — backdrop-blur en elementos

**Archivo:** `App.tsx:335` y otros

### Problema

`backdrop-blur-sm` aplica blur gaussiano a todo el contenido detrás del elemento, lo que requiere una pasada GPU adicional.

```tsx
className="... backdrop-blur-sm ..."
```

### Plan

Reemplazar con fondo sólido semiopaco:

```tsx
className="... bg-black/90 ..." // en lugar de bg-black/70 + backdrop-blur
```

| | |
|---|---|
| **Pro** | Elimina el blur GPU completamente |
| **Contra** | Cambio estético visible — el blur da sensación de "cristal" que se pierde |
| **Contra** | En dispositivos modernos el impacto del blur es bajo ya que se computa en hardware |

---

## 11. BAJO — Patrón radial-gradient en todo el viewport

**Archivo:** `App.tsx:120-126`

### Problema

El fondo canvas usa un `radial-gradient` repetido como grid pattern sobre todo el viewport. Aunque tiene opacidad `0.03`, el cálculo del patrón ocurre en cada repaint.

```tsx
style={{
  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
  backgroundSize: '24px 24px',
}}
```

### Plan

Reemplazar con un SVG pattern o una imagen PNG/WebP del mismo patrón de puntos:

```tsx
style={{
  backgroundImage: 'url(/grid-pattern.webp)',
  backgroundSize: '24px 24px',
}}
```

| | |
|---|---|
| **Pro** | Una imagen se cachea en GPU; el gradiente se recalcula en cada repaint |
| **Contra** | Requiere crear y mantener un asset externo |
| **Contra** | El impacto es bajo (opacidad 0.03) — posiblemente no justifica el esfuerzo |

---

## 12. BAJO — perspective: 1200px fuerza GPU layers en todos los hijos

**Archivo:** `App.tsx:140`

### Problema

`perspective` en un contenedor promueve todos sus hijos al contexto de compositing 3D, aumentando el uso de memoria GPU.

```tsx
<div style={{ perspective: '1200px' }} className="relative z-0">
```

### Impacto

En sí mismo no es crítico, pero combinado con `preserve-3d`, animaciones Framer Motion y `will-change`, aumenta la presión sobre la GPU de gama baja.

### Plan

No hay un reemplazo directo sin afectar el efecto 3D. La mejor opción es evaluar si el efecto de perspectiva es necesario:

- Si se decide simplificar la animación (punto 3), `perspective` podría reducirse o eliminarse.

| | |
|---|---|
| **Pro** | Reducir/eliminar libera memoria GPU |
| **Contra** | Sin `perspective`, el `rotateY` se vería como una transformación 2D plana, perdiendo el efecto de profundidad de la carta |

---

## 13. BAJO — transition-* en múltiples botones

**Archivo:** `App.tsx` — múltiples botones con `transition-colors`, `transition-all`

### Problema

Los botones tienen clases de transición CSS que computan aunque el hover sea raro en mobile (no hay cursor persistente).

### Plan

No se recomienda cambiar esto. Las transiciones CSS se ejecutan en el compositor thread (no en el main thread) y su costo es mínimo. Eliminarlas empeoraría la experiencia en desktop sin beneficio real en mobile.

| | |
|---|---|
| **Pro** | Mínima reducción de carga de compositing |
| **Contra** | Experiencia degradada en desktop |
| **Contra** | El impacto en mobile es prácticamente nulo |

---

## Resumen de Prioridades

| # | Severidad | Archivo | Esfuerzo | Impacto esperado |
|---|-----------|---------|----------|-----------------|
| 1 | CRÍTICO | `useCanvasTransform.ts:93-157` | Medio | Elimina freezes durante drag |
| 2 | ALTO | `useCanvasTransform.ts:112-132` | Bajo | Zoom más suave |
| 3 | ALTO | `App.tsx:143-156` | Bajo | Menos carga GPU en transiciones |
| 4 | MEDIO-ALTO | `App.tsx:19-22` | Mínimo | Elimina cálculos en pan/zoom |
| 5 | MEDIO-ALTO | `menuData.ts:34-45` | Mínimo | Cálculo único al cargar |
| 6 | MEDIO | `App.tsx:132` | Mínimo | GPU compositing en pan/zoom |
| 7 | MEDIO | `App.tsx:102-108` | Mínimo | Referencias estables |
| 8 | MEDIO | Asset de imagen | Fuera del código | Elimina filtros GPU runtime |
| 9 | MEDIO | `App.tsx` varios | Medio | Menos pasadas GPU en render |
| 10 | MEDIO | `App.tsx:335` | Mínimo | Elimina blur GPU |
| 11 | BAJO | `App.tsx:120-126` | Bajo | Patrón cacheado vs calculado |
| 12 | BAJO | `App.tsx:140` | Alto (afecta diseño) | Libera memoria GPU |
| 13 | BAJO | Múltiples | — | No recomendado |

**Puntos 1-7 abordan el ~80% del problema** con cambios puramente en código, sin tocar el diseño visual.
