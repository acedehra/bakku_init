/**
 * Accessibility Utilities
 *
 * Provides functions and helpers to improve application accessibility,
 * including focus trapping, ARIA labels, and screen reader announcements.
 */

/**
 * Trap focus within an element
 */
export function trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
        return () => {};
    }

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Store the previously focused element
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus the first element
    firstElement.focus();

    const handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== "Tab") return;

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    };

    // Add event listener
    element.addEventListener("keydown", handleTabKey);

    // Return cleanup function
    return () => {
        element.removeEventListener("keydown", handleTabKey);
        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();
        }
    };
}

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    // Create or get the live region
    let liveRegion = document.getElementById("a11y-live-region");

    if (!liveRegion) {
        liveRegion = document.createElement("div");
        liveRegion.id = "a11y-live-region";
        liveRegion.setAttribute("aria-live", priority);
        liveRegion.setAttribute("aria-atomic", "true");
        liveRegion.className = "sr-only";
        Object.assign(liveRegion.style, {
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            borderWidth: 0,
        });
        document.body.appendChild(liveRegion);
    }

    // Update the live region
    liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
        liveRegion.textContent = "";
    }, 1000);
}

/**
 * Get ARIA label for HTTP method
 */
export function getMethodAriaLabel(method: string): string {
    const labels: Record<string, string> = {
        GET: "GET request method - retrieves data",
        POST: "POST request method - creates data",
        PUT: "PUT request method - updates data",
        DELETE: "DELETE request method - deletes data",
        PATCH: "PATCH request method - partially updates data",
        HEAD: "HEAD request method - retrieves headers only",
    };

    return labels[method] || `${method} request method`;
}

/**
 * Get status color description for accessibility
 */
export function getStatusAriaDescription(status: number): string {
    if (status >= 200 && status < 300) {
        return "Success";
    }
    if (status >= 300 && status < 400) {
        return "Redirect";
    }
    if (status >= 400 && status < 500) {
        return "Client error";
    }
    if (status >= 500) {
        return "Server error";
    }
    return "Unknown status";
}

/**
 * Generate unique ID for accessibility
 */
let idCounter = 0;
export function generateId(prefix: string = "a11y"): string {
    return `${prefix}-${++idCounter}`;
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
    return !(
        element.hidden ||
        element.style.display === "none" ||
        element.style.visibility === "hidden" ||
        element.offsetParent === null
    );
}

/**
 * Set focus to element with delay (for animations)
 */
export function setFocusWithDelay(element: HTMLElement, delay: number = 100): void {
    setTimeout(() => {
        element.focus();
    }, delay);
}

/**
 * Get all focusable elements in a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelector =
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
}

/**
 * Manage focus for modal
 */
export class FocusManager {
    private container: HTMLElement | null = null;
    private cleanup: (() => void) | null = null;

    /**
     * Activate focus trap
     */
    activate(container: HTMLElement): void {
        this.container = container;
        this.cleanup = trapFocus(container);

        // Announce modal opening
        announce("Modal opened");

        // Set aria-hidden on body content
        const siblings = Array.from(document.body.children).filter(
            (child) => child !== container
        );
        siblings.forEach((sibling) => {
            sibling.setAttribute("aria-hidden", "true");
        });
    }

    /**
     * Deactivate focus trap
     */
    deactivate(): void {
        if (this.cleanup) {
            this.cleanup();
            this.cleanup = null;
        }

        if (this.container) {
            // Remove aria-hidden from body content
            const siblings = Array.from(document.body.children).filter(
                (child) => child !== this.container
            );
            siblings.forEach((sibling) => {
                sibling.removeAttribute("aria-hidden");
            });

            // Announce modal closing
            announce("Modal closed");

            this.container = null;
        }
    }
}

/**
 * Keyboard shortcuts handler
 */
export class KeyboardShortcuts {
    private shortcuts: Map<string, Set<() => void>> = new Map();
    private enabled = true;

    /**
     * Register a keyboard shortcut
     */
    register(key: string, handler: () => void): () => void {
        if (!this.shortcuts.has(key)) {
            this.shortcuts.set(key, new Set());
        }
        this.shortcuts.get(key)!.add(handler);

        // Return cleanup function
        return () => {
            this.shortcuts.get(key)?.delete(handler);
            if (this.shortcuts.get(key)?.size === 0) {
                this.shortcuts.delete(key);
            }
        };
    }

    /**
     * Handle keyboard event
     */
    handle(event: KeyboardEvent): void {
        if (!this.enabled) return;

        // Ignore shortcuts in input fields
        const target = event.target as HTMLElement;
        if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable
        ) {
            return;
        }

        const key = this.getEventKey(event);
        const handlers = this.shortcuts.get(key);

        if (handlers && handlers.size > 0) {
            event.preventDefault();
            handlers.forEach((handler) => handler());
        }
    }

    /**
     * Get normalized key from event
     */
    private getEventKey(event: KeyboardEvent): string {
        const parts: string[] = [];

        if (event.ctrlKey || event.metaKey) {
            parts.push("CtrlOrCmd");
        }
        if (event.altKey) {
            parts.push("Alt");
        }
        if (event.shiftKey) {
            parts.push("Shift");
        }

        parts.push(event.key);

        return parts.join("+");
    }

    /**
     * Enable keyboard shortcuts
     */
    enable(): void {
        this.enabled = true;
    }

    /**
     * Disable keyboard shortcuts
     */
    disable(): void {
        this.enabled = false;
    }
}

/**
 * Create global keyboard shortcuts instance
 */
export const keyboardShortcuts = new KeyboardShortcuts();

// Add global keyboard event listener
document.addEventListener("keydown", (event) => {
    keyboardShortcuts.handle(event);
});

/**
 * Announce request sent
 */
export function announceRequestSent(method: string, url: string): void {
    announce(`Sending ${method} request to ${url}`, "assertive");
}

/**
 * Announce request completed
 */
export function announceRequestCompleted(
    method: string,
    url: string,
    status: number
): void {
    const description = getStatusAriaDescription(status);
    announce(
        `${method} request to ${url} completed with status ${status} - ${description}`,
        "polite"
    );
}

/**
 * Announce request failed
 */
export function announceRequestFailed(method: string, url: string, error: string): void {
    announce(
        `${method} request to ${url} failed: ${error}`,
        "assertive"
    );
}

/**
 * Get accessible color contrast ratio
 */
export function getContrastRatio(
    foreground: string,
    background: string
): number {
    // Simple implementation - for production use a proper color library
    const getLuminance = (color: string): number => {
        const rgb = color.match(/\d+/g);
        if (!rgb) return 0;

        const [r, g, b] = rgb.map(Number);
        const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928
                ? v / 12.92
                : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}
