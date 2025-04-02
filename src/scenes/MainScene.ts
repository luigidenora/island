import { Scene } from 'three';
import { Island } from '../components/Island';
import { GUI } from '../controls/gui';

export class MainScene extends Scene {
    private island: Island;
    private gui: GUI;

    constructor() {
        super();
        this.init();
    }

    private init() {
        this.island = new Island();
        this.add(this.island);

        this.gui = new GUI();
        this.gui.addObjectControls(this.island);

    }
} 