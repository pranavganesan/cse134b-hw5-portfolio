// Custom element #2 (required by HW2): prints a message to the console when
// connected to the page. It intentionally does NOT touch the DOM in any way -
// no innerHTML, no appendChild, no attribute changes - only a console.log.
//
// Naming follows the custom element spec: all-lowercase, contains a hyphen,
// starts with a letter, and is not one of the reserved built-in names
// (annotation-xml, color-profile, font-face, font-face-src, font-face-uri,
// font-face-format, font-face-name, missing-glyph).
class HelloWorldLog extends HTMLElement {
  connectedCallback() {
    console.log("Hello World! <hello-world-log> connected on this page.");
  }
}

customElements.define("hello-world-log", HelloWorldLog);
