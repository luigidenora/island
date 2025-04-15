import { Pane } from "tweakpane";

let DEBUG: Pane | null = null;

if (window.location.hash === "#debug") {
  DEBUG = new Pane();
}

export { DEBUG };

