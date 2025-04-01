import { Scene } from 'three';
import { Island } from '../components/Island';
import { GUI } from '../controls/gui';
import { HUD } from '../ui/overlays/HUD';

export class MainScene extends Scene {
    private island: Island;
    private gui: GUI;
    private hud: HUD;

    constructor() {
        super();
        this.init();
    }

    private init() {
        this.island = new Island();
        this.add(this.island);

        this.gui = new GUI();
        this.gui.addObjectControls(this.island);

        this.hud = new HUD();
        this.hud.mount();
    }
} 