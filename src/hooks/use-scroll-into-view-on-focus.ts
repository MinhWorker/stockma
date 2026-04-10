/**
 * Scrolls the focused input into view after the virtual keyboard opens.
 * Works in tandem with `interactiveWidget: 'resizes-content'` in the viewport
 * meta — the browser resizes the layout, then we scroll the field to center.
 */
export function useScrollIntoViewOnFocus() {
  function onFocus(e: React.FocusEvent<HTMLElement>) {
    const el = e.currentTarget;
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }
  return { onFocus };
}
