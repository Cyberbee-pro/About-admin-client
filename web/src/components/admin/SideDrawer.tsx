"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isBlockingClose?: boolean;
  onBeforeClose?: () => boolean;
  onExitComplete?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  className?: string;
  panelClassName?: string;
  hazardStripe?: boolean;
  dataAscii?: string;
}

export type DrawerAnimationState = "closed" | "opening" | "open" | "closing";

export const DURATION_OPEN_MS = 280;
export const DURATION_CLOSE_MS = 280;
export const DURATION_REDUCED_MS = 100;
export const EASING_OPEN = "cubic-bezier(0.22, 1, 0.36, 1)";
export const EASING_CLOSE = "cubic-bezier(0.4, 0, 1, 1)";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * Deterministic state machine controller for side drawer animations.
 * Coordinates open, closing exit animations, fallback timers, reduced motion,
 * close-blocking during operations, and focus restoration.
 */
export class DrawerAnimationController {
  state: DrawerAnimationState = "closed";
  prefersReducedMotion = false;
  isBlockingClose = false;
  fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  triggerElement: { focus: () => void } | null = null;
  bodyStyle: { overflow: string } = { overflow: "" };

  onStateChange?: (state: DrawerAnimationState) => void;
  onClose?: () => void;
  onExitComplete?: () => void;
  onBeforeClose?: () => boolean;

  constructor(options?: {
    isOpen?: boolean;
    prefersReducedMotion?: boolean;
    isBlockingClose?: boolean;
    onClose?: () => void;
    onBeforeClose?: () => boolean;
    onExitComplete?: () => void;
    onStateChange?: (state: DrawerAnimationState) => void;
  }) {
    if (options?.isOpen) {
      this.state = "open";
    }
    this.prefersReducedMotion = options?.prefersReducedMotion ?? false;
    this.isBlockingClose = options?.isBlockingClose ?? false;
    this.onClose = options?.onClose;
    this.onBeforeClose = options?.onBeforeClose;
    this.onExitComplete = options?.onExitComplete;
    this.onStateChange = options?.onStateChange;
  }

  open(trigger?: { focus: () => void } | null) {
    if (trigger) {
      this.triggerElement = trigger;
    }
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.bodyStyle.overflow = "hidden";
    this.setState("open");
  }

  requestClose(): boolean {
    if (this.isBlockingClose) {
      return false; // Close blocked (e.g. save in progress)
    }
    if (this.state === "closing" || this.state === "closed") {
      return false;
    }
    if (this.onBeforeClose && !this.onBeforeClose()) {
      return false; // Discard confirm rejected
    }
    this.startClosing();
    return true;
  }

  startClosing() {
    this.setState("closing");
    const duration = this.prefersReducedMotion
      ? DURATION_REDUCED_MS + 20
      : DURATION_CLOSE_MS + 50;

    this.fallbackTimer = setTimeout(() => {
      this.finishClose();
    }, duration);
  }

  finishClose() {
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.bodyStyle.overflow = "";
    this.setState("closed");
    this.onExitComplete?.();
    this.onClose?.();

    if (this.triggerElement) {
      try {
        this.triggerElement.focus();
      } catch {
        // Safe fallback
      }
    }
  }

  handleTransitionEnd(propertyName: string) {
    if (this.state !== "closing") return;
    if (this.prefersReducedMotion && propertyName === "opacity") {
      this.finishClose();
    } else if (!this.prefersReducedMotion && propertyName === "transform") {
      this.finishClose();
    }
  }

  private setState(newState: DrawerAnimationState) {
    this.state = newState;
    this.onStateChange?.(newState);
  }
}

/**
 * Shared administrative side edit drawer component providing:
 * - Slide-in and slide-out hardware-accelerated animations (transform and opacity only)
 * - Coordinated dimmed backdrop fade-in and fade-out
 * - prefers-reduced-motion support (short fade without sliding, with fallback timer)
 * - Esc key & backdrop-click dismissal with unsaved changes verification and save-blocking
 * - Focus trapping while open and focus restoration to triggering element on exit
 * - Page scroll locking while open and cleanup upon exit completion
 * - Non-interactive exit state (pointer-events: none, inert, aria-hidden)
 * - Hazard stripe band footer matching wireframe design
 */
export function SideDrawer({
  isOpen,
  onClose,
  isBlockingClose = false,
  onBeforeClose,
  onExitComplete,
  initialFocusRef,
  children,
  ariaLabelledBy,
  ariaLabel,
  className = "",
  panelClassName = "",
  hazardStripe = true,
  dataAscii = "surface",
}: SideDrawerProps) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [drawerState, setDrawerState] = useState<DrawerAnimationState>(() => {
    if (typeof window === "undefined") {
      return isOpen ? "open" : "closed";
    }
    return isOpen ? "opening" : "closed";
  });

  // Adjust state during render when isOpen prop changes (official React pattern)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (drawerState === "closed") {
        setDrawerState("opening");
      } else if (drawerState === "closing") {
        setDrawerState("open");
      }
    } else {
      if (drawerState === "open" || drawerState === "opening") {
        setDrawerState("closing");
      }
    }
  }

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  const onBeforeCloseRef = useRef(onBeforeClose);
  const onExitCompleteRef = useRef(onExitComplete);

  useEffect(() => {
    onCloseRef.current = onClose;
    onBeforeCloseRef.current = onBeforeClose;
    onExitCompleteRef.current = onExitComplete;
  }, [onClose, onBeforeClose, onExitComplete]);

  // Complete closing and restore state
  const finishClosing = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDrawerState("closed");
    onExitCompleteRef.current?.();
    onCloseRef.current();

    if (triggerElementRef.current && typeof triggerElementRef.current.focus === "function") {
      try {
        triggerElementRef.current.focus();
      } catch {
        // Safe fallback if trigger element detached
      }
    }
  }, []);

  // Handle user-initiated close attempt (Esc or backdrop click)
  const handleCloseAttempt = useCallback(() => {
    if (isBlockingClose) return;
    if (drawerState === "closing" || drawerState === "closed") return;

    if (onBeforeCloseRef.current && !onBeforeCloseRef.current()) {
      return; // Discard confirm was rejected
    }

    setDrawerState("closing");
  }, [isBlockingClose, drawerState]);

  // Animate opening on next animation frame
  useEffect(() => {
    if (drawerState === "opening") {
      let cancelled = false;
      const rafId1 = requestAnimationFrame(() => {
        const rafId2 = requestAnimationFrame(() => {
          if (!cancelled) {
            setDrawerState("open");
          }
        });
        if (cancelled) cancelAnimationFrame(rafId2);
      });

      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId1);
      };
    }
  }, [drawerState]);

  // Fallback timer for closing exit animation
  useEffect(() => {
    if (drawerState === "closing") {
      const duration = prefersReducedMotion
        ? DURATION_REDUCED_MS + 20
        : DURATION_CLOSE_MS + 50;

      closeTimerRef.current = setTimeout(() => {
        finishClosing();
      }, duration);

      return () => {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
      };
    }
  }, [drawerState, prefersReducedMotion, finishClosing]);

  // Focus management: record active trigger and autofocus into drawer
  useEffect(() => {
    if (drawerState === "open" || drawerState === "opening") {
      if (!triggerElementRef.current && typeof document !== "undefined") {
        triggerElementRef.current = document.activeElement as HTMLElement | null;
      }

      const focusTimer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (panelRef.current) {
          const firstInteractive = panelRef.current.querySelector<HTMLElement>(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
          );
          firstInteractive?.focus();
        }
      }, 50);

      return () => clearTimeout(focusTimer);
    }
  }, [drawerState, initialFocusRef]);

  // Focus trap & Escape key handler
  useEffect(() => {
    if (drawerState !== "open") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseAttempt();
        return;
      }

      if (e.key === "Tab") {
        if (!panelRef.current) return;
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !panelRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !panelRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerState, handleCloseAttempt]);

  // Lock page body scroll while open / animating
  useEffect(() => {
    if (drawerState !== "closed" && typeof document !== "undefined") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [drawerState]);

  // Transitionend listener on panel
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== panelRef.current) return;
    if (drawerState === "closing") {
      finishClosing();
    }
  };

  if (drawerState === "closed") {
    return null;
  }

  // Calculate hardware-accelerated transform & opacity inline styles
  const isClosing = drawerState === "closing";
  const isOpening = drawerState === "opening";
  const isOpenState = drawerState === "open";

  const backdropOpacity = isOpenState ? 1 : 0;
  const backdropTransition = prefersReducedMotion
    ? `opacity ${DURATION_REDUCED_MS}ms linear`
    : isClosing
    ? `opacity ${DURATION_CLOSE_MS}ms ${EASING_CLOSE}`
    : isOpening
    ? "none"
    : `opacity ${DURATION_OPEN_MS}ms ${EASING_OPEN}`;

  const panelTransform = prefersReducedMotion
    ? "none"
    : isOpenState
    ? "translateX(0)"
    : "translateX(100%)";

  const panelOpacity = prefersReducedMotion ? (isOpenState ? 1 : 0) : 1;

  const panelTransition = prefersReducedMotion
    ? `opacity ${DURATION_REDUCED_MS}ms linear`
    : isClosing
    ? `transform ${DURATION_CLOSE_MS}ms ${EASING_CLOSE}, opacity ${DURATION_CLOSE_MS}ms ${EASING_CLOSE}`
    : isOpening
    ? "none"
    : `transform ${DURATION_OPEN_MS}ms ${EASING_OPEN}, opacity ${DURATION_OPEN_MS}ms ${EASING_OPEN}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      aria-hidden={isClosing ? "true" : undefined}
      inert={isClosing ? true : undefined}
      className={`fixed inset-0 top-16 left-0 lg:left-64 z-40 flex justify-end ${
        isClosing ? "pointer-events-none select-none" : ""
      } ${className}`}
    >
      {/* Dimmed backdrop covering page; nav stays visible. Clicking dims triggers close */}
      <div
        onClick={isOpenState ? handleCloseAttempt : undefined}
        aria-hidden="true"
        style={{
          opacity: backdropOpacity,
          transition: backdropTransition,
        }}
        className={`fixed inset-0 top-16 left-0 lg:left-64 bg-black/65 backdrop-blur-[2px] cursor-pointer ${
          isClosing ? "pointer-events-none" : ""
        }`}
      />

      {/* Drawer Panel: purple #7B47DC, pinned to right, starts below breadcrumb */}
      <div
        ref={panelRef}
        data-ascii={dataAscii}
        style={{
          transform: panelTransform,
          opacity: panelOpacity,
          transition: panelTransition,
        }}
        onTransitionEnd={handleTransitionEnd}
        className={`relative z-50 w-full max-w-[860px] h-full bg-[#7B47DC] text-white flex flex-col justify-between shadow-2xl overflow-y-auto motion-reduce:transition-none ${panelClassName}`}
      >
        <div className="p-6 sm:p-8 space-y-6 flex-1">{children}</div>

        {/* Hazard Stripe Band along the bottom edge of the drawer */}
        {hazardStripe && (
          <div className="w-full h-8 sm:h-10 shrink-0 overflow-hidden">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: "url('/eva dash/haz_strip.svg')",
                backgroundRepeat: "repeat-x",
                backgroundSize: "contain",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default SideDrawer;
