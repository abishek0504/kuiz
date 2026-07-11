export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Safari can expose the Clipboard API but still reject it after an async
    // IndexedDB read. Fall through to the selection-based copy path.
  }

  const textarea = document.createElement("textarea");
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  const selection = document.getSelection();
  const savedRanges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index)) : [];

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    textarea.remove();
    activeElement?.focus();
    if (selection && savedRanges.length > 0) {
      selection.removeAllRanges();
      savedRanges.forEach((range) => selection.addRange(range));
    }
  }

  return copied;
}
