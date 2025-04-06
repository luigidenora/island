import { Scene, PerspectiveCamera, WebGLRenderer, Object3D, Vector3 } from 'three';
import { Island } from '../components/Island';
import { Characters } from '../components/Characters';
import { FPSControls } from '../controls/FPSControls';

export class MainScene extends Scene {
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private island: Island;
    private player: Characters;

    constructor() {
        super();
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.island = new Island();
        this.add(this.island);
        

        // Find player spawn point
        const spawnPoint = this.island.querySelector('[name=@Player_Spawn]');
        console.assert(!!spawnPoint, 'Player spawn point not found');
        spawnPoint.remove();

        // Create player at spawn point
        this.player = new Characters('Captain_Barbarossa', spawnPoint.position);
        this.add(this.player);

        this.initialize();
    }

    public addLight(light: Object3D) {
        this.add(light);
    }

    private initialize() {
        // Set up camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(this.player.position);
    }

} 