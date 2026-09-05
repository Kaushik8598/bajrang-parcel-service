"use client";

/**
 * Resolves the effective element when 'from' might be an element inside a floating dropdown portal
 */
function resolveEffectiveTarget(from: HTMLElement): HTMLElement {
  const dropdown = from.closest(".form-select-dropdown");
  if (dropdown) {
    const triggerId = dropdown.getAttribute("data-trigger-id");
    if (triggerId) {
      const trigger = document.getElementById(triggerId);
      if (trigger) return trigger;
    }
  }
  return from;
}

/**
 * Advance focus to a specific element.
 * If it is a FormSelect trigger, automatically open its options dropdown.
 */
export function advanceToElement(el: HTMLElement) {
  setTimeout(() => {
    el.focus();

    const isSelectTrigger =
      el.getAttribute("data-form-select-trigger") === "true" ||
      Boolean((el as any).__openFormSelect) ||
      (el.tagName === "BUTTON" && Boolean(el.id?.startsWith("select-")));

    if (isSelectTrigger) {
      setTimeout(() => {
        if (typeof (el as any).__openFormSelect === "function") {
          (el as any).__openFormSelect();
        } else {
          el.dispatchEvent(new CustomEvent("form-select-open", { bubbles: true }));
        }
      }, 40);
    } else if (el instanceof HTMLInputElement) {
      el.select?.();
    }
  }, 40);
}

/**
 * Moves DOM focus to the next form field when user presses Enter.
 * Queries form elements in DOM order and focuses the next visible input, select trigger,
 * textarea, or submit/cancel button.
 * If the next element is a FormSelect, it automatically opens the options dropdown.
 */
export function focusNextField(from: HTMLElement): boolean {
  const effectiveFrom = resolveEffectiveTarget(from);
  const form = effectiveFrom.closest("form");
  if (!form) return false;

  const allElements = Array.from(
    form.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([readonly]):not([type="hidden"]):not([tabindex="-1"]), ' +
      'textarea:not([disabled]):not([readonly]):not([tabindex="-1"]), ' +
      'button:not([disabled]):not([tabindex="-1"])'
    )
  );

  const focusable = allElements.filter((el) => {
    // Must be visible and not inside floating dropdown popup
    if (el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    if (el.closest(".form-select-dropdown") || el.closest(".z-\\[9999\\]")) return false;

    // Filter buttons: only include FormSelect triggers, Submit button, and Cancel button
    if (el.tagName === "BUTTON") {
      const btn = el as HTMLButtonElement;
      if (btn.type === "submit") return true;
      if (btn.getAttribute("data-action") === "cancel" || btn.textContent?.trim() === "Cancel") return true;
      if (btn.getAttribute("data-form-select-trigger") === "true") return true;
      if (btn.id && btn.id.startsWith("select-")) return true;
      if (btn.parentElement?.classList.contains("relative") && btn.querySelector(".truncate")) return true;
      return false;
    }

    return true;
  });

  if (focusable.length <= 1) return false;

  let currentIndex = focusable.indexOf(effectiveFrom);
  if (currentIndex === -1) {
    const targetPos = effectiveFrom.compareDocumentPosition.bind(effectiveFrom);
    currentIndex = focusable.findIndex(
      (el) => (targetPos(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    ) - 1;
  }

  if (currentIndex !== -1 && currentIndex < focusable.length - 1) {
    const nextElement = focusable[currentIndex + 1];
    advanceToElement(nextElement);
    return true;
  }

  return false;
}

/**
 * Global form Enter navigation listener:
 * When Enter is pressed on any form field inside any form, advances to the next field.
 * Allows normal Enter behavior on submit buttons, cancel buttons, and Shift+Enter in textareas.
 */
if (typeof window !== "undefined" && !(window as any).__formEnterNavInitialized) {
  (window as any).__formEnterNavInitialized = true;
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (e.defaultPrevented) return;

    const target = e.target as HTMLElement;
    if (!target || !target.tagName) return;

    // Only handle form controls inside a <form>
    const form = target.closest("form");
    if (!form) return;

    // Opt-out check
    if (form.getAttribute("data-no-enter-nav") === "true") return;

    // Dropdown portal controls handle their own Enter
    if (target.closest(".form-select-dropdown")) return;

    // Submit button allows normal form submission
    if (target.tagName === "BUTTON" && (target as HTMLButtonElement).type === "submit") return;

    // Cancel button allows click
    if (
      target.tagName === "BUTTON" &&
      (target.getAttribute("data-action") === "cancel" || target.textContent?.trim() === "Cancel")
    ) {
      target.click();
      return;
    }

    // Textarea Shift+Enter allows newline
    if (target.tagName === "TEXTAREA" && e.shiftKey) return;

    // Only process valid form fields
    const isControl =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.getAttribute("data-form-select-trigger") === "true";

    if (!isControl) return;

    const handled = focusNextField(target);
    if (handled) {
      e.preventDefault();
    }
  });
}
