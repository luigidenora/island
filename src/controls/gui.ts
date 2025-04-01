import { Pane } from 'tweakpane';
import type { Mesh } from 'three';

export class GUI {
    private pane: Pane;

    constructor() {
        this.pane = new Pane();
    }

    addObjectControls(object: Mesh) {
        this.pane.addBinding(object, 'position');
        this.pane.addBinding(object, 'rotation');
    }
} 