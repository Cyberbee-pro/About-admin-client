import { test, describe } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  SideDrawer,
  DrawerAnimationController,
  DURATION_OPEN_MS,
  DURATION_CLOSE_MS,
  DURATION_REDUCED_MS,
} from "@/components/admin/SideDrawer";

describe("SideDrawer & DrawerAnimationController Component", () => {
  test("renders full accessible markup with backdrop, purple panel, and hazard stripe band when open", () => {
    const html = renderToString(
      React.createElement(
        SideDrawer,
        {
          isOpen: true,
          onClose: () => {},
          ariaLabelledBy: "test-drawer-heading",
        },
        React.createElement("h2", { id: "test-drawer-heading" }, "Drawer Content")
      )
    );

    assert.ok(html.includes("role=\"dialog\""), "Must have role='dialog'");
    assert.ok(html.includes("aria-modal=\"true\""), "Must have aria-modal='true'");
    assert.ok(html.includes("aria-labelledby=\"test-drawer-heading\""), "Must have aria-labelledby");
    assert.ok(html.includes("bg-[#7B47DC]"), "Must have wireframe purple #7B47DC panel background");
    assert.ok(html.includes("bg-black/65"), "Must have dimmed backdrop");
    assert.ok(html.includes("haz_strip.svg"), "Must render hazard stripe band in drawer");
    assert.ok(html.includes("Drawer Content"), "Must render drawer children");
    assert.ok(html.includes("motion-reduce:transition-none"), "Must support prefers-reduced-motion in class");
  });

  test("returns null when isOpen is false", () => {
    const html = renderToString(
      React.createElement(
        SideDrawer,
        {
          isOpen: false,
          onClose: () => {},
        },
        React.createElement("div", null, "Hidden Content")
      )
    );

    assert.equal(html, "", "Must render null when closed");
  });

  test("drawer stays mounted in closing state until exit finishes, then unmounts", () => {
    let unmounted = false;
    let closedCallbackCalled = false;

    const controller = new DrawerAnimationController({
      isOpen: true,
      onClose: () => {
        closedCallbackCalled = true;
      },
      onExitComplete: () => {
        unmounted = true;
      },
    });

    assert.equal(controller.state, "open", "Initial state must be open");

    // 1. User requests close
    const closed = controller.requestClose();
    assert.equal(closed, true, "requestClose must succeed");
    assert.equal(controller.state, "closing", "Drawer must transition to closing, remaining mounted");
    assert.equal(closedCallbackCalled, false, "onClose must not be called yet while exit animation plays");
    assert.equal(unmounted, false, "Exit must not be finished yet");

    // 2. Transition completes
    controller.handleTransitionEnd("transform");
    assert.equal(controller.state, "closed", "State transitions to closed after animation ends");
    assert.equal(closedCallbackCalled, true, "onClose called after exit finishes");
    assert.equal(unmounted, true, "onExitComplete called to unmount drawer");
  });

  test("unmount fallback fires under reduced motion when CSS transition does not fire", async () => {
    let exitFinished = false;

    const controller = new DrawerAnimationController({
      isOpen: true,
      prefersReducedMotion: true,
      onExitComplete: () => {
        exitFinished = true;
      },
    });

    assert.equal(controller.state, "open");
    controller.requestClose();
    assert.equal(controller.state, "closing");

    // No transitionend event fired (simulating reduced motion environment)
    // Wait for fallback timer (DURATION_REDUCED_MS + 20ms = 120ms)
    await new Promise((resolve) => setTimeout(resolve, DURATION_REDUCED_MS + 30));

    assert.equal(controller.state, "closed", "Fallback timer must transition to closed");
    assert.equal(exitFinished, true, "Fallback timer must complete unmount under reduced motion");
  });

  test("unmount fallback fires under standard motion when transitionend is skipped or interrupted", async () => {
    let exitFinished = false;

    const controller = new DrawerAnimationController({
      isOpen: true,
      prefersReducedMotion: false,
      onExitComplete: () => {
        exitFinished = true;
      },
    });

    controller.requestClose();
    assert.equal(controller.state, "closing");

    // Wait for standard fallback timer (DURATION_CLOSE_MS + 50ms = 330ms)
    await new Promise((resolve) => setTimeout(resolve, DURATION_CLOSE_MS + 70));

    assert.equal(controller.state, "closed", "Standard fallback timer must unmount drawer");
    assert.equal(exitFinished, true, "Exit finished called via timer fallback");
  });

  test("focus returns to trigger element after close completes", () => {
    let triggerFocused = false;
    const fakeTrigger = {
      focus: () => {
        triggerFocused = true;
      },
    };

    const controller = new DrawerAnimationController({
      isOpen: false,
    });

    // Open with triggering element
    controller.open(fakeTrigger);
    assert.equal(controller.state, "open");
    assert.equal(triggerFocused, false, "Trigger not focused while drawer is open");

    // Close and complete transition
    controller.requestClose();
    assert.equal(controller.state, "closing");
    assert.equal(triggerFocused, false, "Trigger not focused while drawer is closing");

    controller.handleTransitionEnd("transform");
    assert.equal(controller.state, "closed");
    assert.equal(triggerFocused, true, "Focus must be restored to trigger element after close finishes");
  });

  test("reopening during the exit animation works without getting stuck", () => {
    let closeCalled = false;

    const controller = new DrawerAnimationController({
      isOpen: true,
      onClose: () => {
        closeCalled = true;
      },
    });

    // Start closing
    controller.requestClose();
    assert.equal(controller.state, "closing");

    // Rapid action: user clicks Edit again before exit completes
    controller.open();
    assert.equal(controller.state, "open", "Drawer must smoothly return to open");
    assert.equal(controller.fallbackTimer, null, "Exit timer must be cancelled");
    assert.equal(closeCalled, false, "onClose must not have been triggered");
  });

  test("blocked close during save does not start the exit", () => {
    const controller = new DrawerAnimationController({
      isOpen: true,
      isBlockingClose: true, // e.g. isSaving === true
    });

    const closeAttempt = controller.requestClose();
    assert.equal(closeAttempt, false, "requestClose must be rejected while save is in progress");
    assert.equal(controller.state, "open", "Drawer must remain open and not enter closing state");
  });

  test("unsaved changes confirmation blocks exit when cancelled and plays exit when accepted", () => {
    let confirmResult = false;

    const controller = new DrawerAnimationController({
      isOpen: true,
      onBeforeClose: () => confirmResult,
    });

    // 1. User cancels discard prompt
    confirmResult = false;
    const cancelled = controller.requestClose();
    assert.equal(cancelled, false, "requestClose must be blocked when discard is rejected");
    assert.equal(controller.state, "open", "Drawer must remain open");

    // 2. User confirms discard
    confirmResult = true;
    const accepted = controller.requestClose();
    assert.equal(accepted, true, "requestClose must proceed when discard is confirmed");
    assert.equal(controller.state, "closing", "Drawer must enter closing animation");
  });

  test("page body scroll is locked while active and restored when closed", () => {
    const controller = new DrawerAnimationController();

    assert.equal(controller.bodyStyle.overflow, "");

    controller.open();
    assert.equal(controller.bodyStyle.overflow, "hidden", "Scroll must be locked when open");

    controller.requestClose();
    assert.equal(controller.bodyStyle.overflow, "hidden", "Scroll must remain locked while closing");

    controller.handleTransitionEnd("transform");
    assert.equal(controller.bodyStyle.overflow, "", "Scroll must be restored when closed");
  });
});
