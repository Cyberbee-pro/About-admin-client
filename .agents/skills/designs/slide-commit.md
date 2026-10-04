

SLIDE COMMIT:

## Integrate the <SlideCommit /> component from React Bits

You are helping integrate an open-source React component into an existing application.

### Component: SlideCommit
### Variant: JavaScript + CSS
### Dependencies: motion @hugeicons/react @hugeicons/core-free-icons

---

### Usage Example
```jsx
import SlideCommit from './SlideCommit';

<SlideCommit
  label="Slide to Auth"
  doneLabel="Auth Success"
  errorLabel="Auth failed"
  onConfirm={() => api.pay(order)}
  onDone={() => console.log('paid')}
  onError={reason => console.log(reason)}
  trackColor="#b59bce"
  handleColor="#0308df"
  successColor="#22c55e"
  dangerColor="#3B82F6"
  width={280}
  height={56}
  radius={28}
  speed={50}
  returnBounce={0.38}
  landingDip={0.046}
  holdMs={1500}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | ReactNode | "Slide to pay" | The instruction centred in the pill; the capsule wipes it as you drag. |
| doneLabel | ReactNode | "Paid" | The words beside the check once confirmed. |
| errorLabel | ReactNode | "Payment failed" | Replaces the instruction, in the danger colour, after a rejected promise. |
| onConfirm | () => void | Promise<unknown> | - | Called when the handle reaches the end. Return a promise to show the spinner; it unfurls on resolve and springs home on reject. |
| onDone | () => void | - | Called when the done pill unfurls. |
| onError | (reason: unknown) => void | - | Called with the rejection reason; the component swallows it otherwise. |
| trackColor | string | "#262626" | The pill behind the handle. |
| handleColor | string | "#f5f5f5" | The handle and the ground it paints; the arrow colour is picked to read on it. |
| successColor | string | "#22c55e" | Fill of the done pill. |
| dangerColor | string | "#e5484d" | Tint of the handle and error label after a reject. |
| width | number | 280 | Track width in pixels; the travel scales with it. |
| height | number | 56 | Track height in pixels; the handle is 8px smaller. |
| radius | number | 28 | Track corner radius; the handle corner is 4px smaller so the two stay concentric. |
| speed | number | 50 | How fast the unfurl and the return take over once you let go. |
| returnBounce | number | 0.38 | Energy left when the handle returns to the wall: 0 stops dead, 0.38 fills the 8% squash. |
| landingDip | number | 0.026 | How much the track dips as the done pill lands. 0 removes it. |
| holdMs | number | 1500 | How long the done pill stands before it closes back. 0 keeps it until the component remounts. |
| disabled | boolean | false | Dims the control and ignores input. |
| icon | ReactNode | undefined | Replaces the arrow in the handle. |
| className | string | "" | Extra classes for the root element. |

### Full Component Source
```jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, Tick02Icon } from '@hugeicons/core-free-icons';

import './SlideCommit.css';

const PAD = 4;
const SQUASH_MAX = 0.08;
const SQUASH_DIV = 110;
const SWELL = 1.03;
const MIN_PENDING = 300;
const EASE_OUT = [0.23, 1, 0.32, 1];
const SHAKE = [0, -5, 5, -3, 3, -1, 0];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const onColor = hex => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(ch => ch + ch).join('') : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return yiq >= 128 ? '#111111' : '#ffffff';
};
const velocityOf = hist => {
  if (hist.length < 2) return 0;
  const [t0, x0] = hist[0];
  const [t1, x1] = hist[hist.length - 1];
  return ((x1 - x0) / Math.max(1, t1 - t0)) * 1000;
};
const finePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

const Spinner = ({ size }) => (
  <svg className="slide-commit__spinner" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeOpacity="0.25" />
    <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export default function SlideCommit({
  label = 'Slide to pay',
  doneLabel = 'Paid',
  errorLabel = 'Payment failed',
  onConfirm,
  onDone,
  onError,
  trackColor = '#262626',
  handleColor = '#f5f5f5',
  successColor = '#22c55e',
  dangerColor = '#e5484d',
  width = 280,
  height = 56,
  radius = 28,
  speed = 50,
  returnBounce = 0.38,
  landingDip = 0.026,
  holdMs = 1500,
  disabled = false,
  icon,
  className = ''
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState('idle');
  const [held, setHeld] = useState(false);
  const [hot, setHot] = useState(false);

  const trackRef = useRef(null);
  const capsuleRef = useRef(null);
  const grip = useRef(null);
  const timer = useRef(0);
  const homeTimer = useRef(0);
  const run = useRef(0);
  const unwatch = useRef(null);
  const live = useRef({ move: () => {}, up: () => {} });
  const lastPercent = useRef(0);

  const GRIP = height - PAD * 2;
  const INNER = width - PAD * 2;
  const TRAVEL = Math.max(1, INNER - GRIP);
  const r = clamp(radius, 0, height / 2);
  const gripR = Math.max(0, r - PAD);
  const k = 260 + (clamp(speed, 0, 100) / 100) * 640;
  const mass = 0.9;
  const critical = 2 * Math.sqrt(k * mass);
  const commitSpring = { type: 'spring', stiffness: k, damping: critical, mass };
  const homeSpring = { ...commitSpring, damping: critical * (1 - clamp(returnBounce, 0, 0.5)) };

  const x = useMotionValue(0);
  const anchor = useMotionValue(0);
  const shown = useMotionValue(1);
  const spin = useMotionValue(0);
  const pulse = useMotionValue(1);
  const shake = useMotionValue(0);
  const seen = useTransform(x, v => clamp(v, 0, TRAVEL));
  const edge = useTransform([seen, anchor], ([v, a]) => v + GRIP + clamp(a - v, 0, TRAVEL));
  const clip = useTransform(edge, R => `inset(0 ${INNER - R}px 0 0 round ${gripR}px)`);
  const content = useTransform([seen, edge], ([v, R]) => `translateX(${(v + R) / 2 - INNER / 2}px)`);
  const swell = hot && !held && phase === 'idle' && !reduce ? SWELL : 1;
  const shape = useTransform(x, v => {
    const q = 1 - Math.min(SQUASH_MAX, Math.max(0, -v) / SQUASH_DIV);
    return `scale(${q * swell}, ${swell / q})`;
  });
  const origin = useTransform(seen, v => `${v}px 50%`);
  const say = useTransform(seen, [0, TRAVEL * 0.55], [1, 0]);
  const arrow = useTransform([seen, shown], ([v, on]) => on * clamp(1 - (v - TRAVEL * 0.55) / (TRAVEL * 0.4), 0, 1));
  const trackTransform = useTransform([shake, pulse], ([s, p]) => `translateX(${s}px) scale(${p})`);

  const labelText = typeof label === 'string' ? label : 'Slide to confirm';
  useMotionValueEvent(seen, 'change', v => {
    const percent = Math.round((v / TRAVEL) * 100);
    if (percent === lastPercent.current || !capsuleRef.current) return;
    lastPercent.current = percent;
    capsuleRef.current.setAttribute('aria-valuenow', String(percent));
    capsuleRef.current.setAttribute('aria-valuetext', `${labelText}, ${percent}%`);
  });

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(homeTimer.current);
      unwatch.current?.();
      run.current += 1;
    },
    []
  );

  const local = clientX => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return (clientX - rect.left) / (rect.width / width || 1);
  };

  const goHome = velocity => {
    if (reduce) animate(x, 0, { duration: 0.2, ease: EASE_OUT });
    else animate(x, 0, { ...homeSpring, velocity: Math.min(0, velocity) });
  };

  const settle = () => {
    setPhase('idle');
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (reduce) anchor.set(0);
    else animate(anchor, 0, { type: 'spring', duration: 0.3, bounce: 0 });
  };

  const resolve = viaKey => {
    setPhase('done');
    anchor.set(x.get());
    animate(spin, 0, { duration: 0.12 });
    if (reduce) x.set(0);
    else {
      animate(x, 0, commitSpring);
      if (!viaKey && landingDip > 0) {
        animate(pulse, [1, 1 - landingDip, 1], { duration: 0.46, times: [0, 0.62, 1], ease: EASE_OUT, delay: 0.1 });
      }
    }
    onDone?.();
    if (holdMs > 0) timer.current = setTimeout(settle, holdMs);
  };

  const reject = reason => {
    setPhase('error');
    onError?.(reason);
    animate(spin, 0, { duration: 0.12 });
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (reduce) goHome(0);
    else {
      animate(shake, SHAKE, { duration: 0.45, ease: EASE_OUT });
      homeTimer.current = setTimeout(() => {
        if (!grip.current) goHome(0);
      }, 300);
    }
    timer.current = setTimeout(() => setPhase('idle'), Math.max(holdMs, 1500));
  };

  const commit = viaKey => {
    clearTimeout(timer.current);
    const id = ++run.current;
    x.set(TRAVEL);
    let out;
    try {
      out = onConfirm?.();
    } catch (reason) {
      reject(reason);
      return;
    }
    const pending = out && typeof out.then === 'function' ? out : null;
    if (!pending) {
      animate(shown, 0, { duration: 0.12 });
      resolve(viaKey);
      return;
    }
    setPhase('pending');
    animate(shown, 0, { duration: 0.2 });
    animate(spin, 1, { duration: 0.2 });
    const t0 = performance.now();
    const later = fn => {
      setTimeout(
        () => {
          if (id === run.current) fn();
        },
        Math.max(0, MIN_PENDING - (performance.now() - t0))
      );
    };
    pending.then(
      () => later(() => resolve(viaKey)),
      reason => later(() => reject(reason))
    );
  };

  const down = e => {
    if (disabled || grip.current || phase === 'pending' || phase === 'done' || e.button !== 0) return;
    x.stop();
    grip.current = { id: e.pointerId, grab: null, moved: false, hist: [] };
    setHeld(true);
    try {
      trackRef.current?.setPointerCapture(e.pointerId);
    } catch {}
    unwatch.current?.();
    const onMove = ev => ev.isTrusted && live.current.move(ev);
    const onUp = ev => ev.isTrusted && live.current.up(ev);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    unwatch.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      unwatch.current = null;
    };
  };

  const move = e => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    const at = local(e.clientX);
    if (g.grab === null) {
      g.grab = at - x.get();
      return;
    }
    const next = clamp(at - g.grab, 0, TRAVEL);
    if (Math.abs(next - x.get()) > 0.5) g.moved = true;
    g.hist.push([e.timeStamp, next]);
    if (g.hist.length > 4) g.hist.shift();
    x.set(next);
  };

  const up = e => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    grip.current = null;
    unwatch.current?.();
    try {
      trackRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
    setHeld(false);
    if (x.get() >= TRAVEL) commit(false);
    else if (g.moved) goHome(velocityOf(g.hist));
  };
  live.current = { move, up };

  const onKeyDown = e => {
    if (disabled || phase === 'pending' || phase === 'done') return;
    const step = TRAVEL / 10;
    if (e.key === 'End') {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(TRAVEL, x.get() + step);
      x.set(next);
      if (next >= TRAVEL) commit(true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      x.set(Math.max(0, x.get() - step));
    } else if (e.key === 'Home' || e.key === 'Escape') {
      e.preventDefault();
      if (grip.current) up({ pointerId: grip.current.id });
      else x.set(0);
    }
  };

  const fontSize = clamp(Math.round(height * 0.25), 13, 17);
  const iconSize = Math.round(GRIP * 0.42);
  const done = phase === 'done';

  return (
    <div
      className={`slide-commit${className ? ` ${className}` : ''}`}
      data-phase={phase}
      data-held={held ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      style={{
        width,
        height,
        '--sc-track': trackColor,
        '--sc-ink': handleColor,
        '--sc-ok': successColor,
        '--sc-no': dangerColor,
        '--sc-on-ink': onColor(handleColor),
        '--sc-on-ok': onColor(successColor),
        '--sc-on-no': onColor(dangerColor),
        '--sc-radius': `${r}px`,
        '--sc-grip-r': `${gripR}px`,
        '--sc-pad': `${PAD}px`,
        '--sc-font': `${fontSize}px`
      }}
    >
      <motion.div
        ref={trackRef}
        className="slide-commit__track"
        style={{ transform: trackTransform }}
        onPointerDown={down}
      >
        <motion.span className="slide-commit__label" style={{ opacity: say }} aria-hidden="true">
          <span className="slide-commit__text slide-commit__text--plain">{label}</span>
          <span className="slide-commit__text slide-commit__text--error">{errorLabel}</span>
        </motion.span>
        <motion.div
          ref={capsuleRef}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={labelText}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-busy={phase === 'pending' || undefined}
          aria-disabled={disabled || undefined}
          className="slide-commit__capsule"
          style={{ clipPath: clip, transform: shape, transformOrigin: origin }}
          onPointerEnter={e => {
            if (e.pointerType === 'mouse' && finePointer()) setHot(true);
          }}
          onPointerLeave={() => setHot(false)}
          onKeyDown={onKeyDown}
        >
          <motion.div className="slide-commit__content" style={{ transform: content }}>
            <motion.span className="slide-commit__arrow" style={{ opacity: arrow }} aria-hidden="true">
              {icon ?? <HugeiconsIcon icon={ArrowRight02Icon} size={iconSize} strokeWidth={2} />}
            </motion.span>
            <motion.span className="slide-commit__spin" style={{ opacity: spin }} aria-hidden="true">
              <Spinner size={iconSize} />
            </motion.span>
            <motion.span
              className="slide-commit__done"
              aria-hidden="true"
              initial={false}
              animate={{ opacity: done ? 1 : 0, scale: done || reduce ? 1 : 0.95 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <HugeiconsIcon icon={Tick02Icon} size={Math.round(GRIP * 0.38)} strokeWidth={2.5} />
              {doneLabel}
            </motion.span>
          </motion.div>
        </motion.div>
        <span className="slide-commit__sr" aria-live="polite">
          {phase === 'pending' ? 'Working' : phase === 'done' ? doneLabel : phase === 'error' ? errorLabel : ''}
        </span>
      </motion.div>
    </div>
  );
}

```

### Component CSS
```css
.slide-commit {
  --sc-track: #262626;
  --sc-ink: #f5f5f5;
  --sc-ok: #22c55e;
  --sc-no: #e5484d;
  --sc-on-ink: #111111;
  --sc-on-ok: #111111;
  --sc-on-no: #ffffff;
  --sc-radius: 28px;
  --sc-grip-r: 24px;
  --sc-pad: 4px;
  --sc-font: 14px;

  position: relative;
  display: inline-block;
  vertical-align: middle;
  font-family: inherit;
}

.slide-commit[data-disabled] {
  opacity: 0.55;
  pointer-events: none;
}

.slide-commit__track {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--sc-radius);
  background: var(--sc-track);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}

.slide-commit[data-held] .slide-commit__track {
  cursor: grabbing;
}

.slide-commit[data-phase='pending'] .slide-commit__track,
.slide-commit[data-phase='done'] .slide-commit__track {
  cursor: default;
}

.slide-commit__label {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  font-size: var(--sc-font);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.006em;
  white-space: nowrap;
}

.slide-commit__text {
  grid-area: 1 / 1;
  color: color-mix(in srgb, var(--sc-ink) 45%, transparent);
  transition:
    opacity 200ms ease,
    filter 200ms ease;
}

.slide-commit__text--error {
  color: var(--sc-no);
  opacity: 0;
  filter: blur(2px);
}

.slide-commit[data-phase='error'] .slide-commit__text--plain {
  opacity: 0;
  filter: blur(2px);
}

.slide-commit[data-phase='error'] .slide-commit__text--error {
  opacity: 1;
  filter: none;
}

.slide-commit__capsule {
  position: absolute;
  top: var(--sc-pad);
  left: var(--sc-pad);
  width: calc(100% - var(--sc-pad) * 2);
  height: calc(100% - var(--sc-pad) * 2);
  background: var(--sc-ink);
  color: var(--sc-on-ink);
  outline: none;
  transition:
    background-color 200ms ease,
    color 200ms ease;
}

.slide-commit[data-phase='done'] .slide-commit__capsule {
  background: var(--sc-ok);
  color: var(--sc-on-ok);
}

.slide-commit[data-phase='error'] .slide-commit__capsule {
  background: var(--sc-no);
  color: var(--sc-on-no);
}

.slide-commit__capsule:focus-visible {
  box-shadow: inset 0 0 0 2px var(--sc-track);
}

.slide-commit__content {
  position: absolute;
  inset: 0;
}

.slide-commit__arrow,
.slide-commit__spin,
.slide-commit__done {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  font-size: var(--sc-font);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.006em;
  white-space: nowrap;
}

.slide-commit__arrow svg,
.slide-commit__done svg,
.slide-commit__spinner {
  display: block;
}

.slide-commit__arrow,
.slide-commit__spin {
  transition: filter 200ms ease;
}

.slide-commit[data-phase='pending'] .slide-commit__arrow {
  filter: blur(2px);
}

.slide-commit:not([data-phase='pending']) .slide-commit__spin {
  filter: blur(2px);
}

.slide-commit__spinner {
  animation: slide-commit-spin 1s linear infinite;
  animation-play-state: paused;
}

.slide-commit[data-phase='pending'] .slide-commit__spinner {
  animation-play-state: running;
}

@keyframes slide-commit-spin {
  to {
    transform: rotate(360deg);
  }
}

.slide-commit__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .slide-commit__spinner {
    animation: slide-commit-breathe 1.4s ease-in-out infinite;
    animation-play-state: paused;
  }

  .slide-commit[data-phase='pending'] .slide-commit__spinner {
    animation-play-state: running;
  }

  @keyframes slide-commit-breathe {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
}

```

### Integration Instructions
1. Install any listed dependencies.
2. Copy the component source into the appropriate directory in the project.
3. Import the CSS file alongside the component.
4. Import and render the component using the usage example above as a starting point.
5. Adjust props as needed for the specific use case — refer to the props table for all available options.

### More from React Bits
The full library index, including everything reactbits.dev offers, is at https://reactbits.dev/llms.txt — fetch it if this component is not the right fit or the project needs more pieces.
