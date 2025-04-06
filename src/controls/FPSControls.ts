import { PerspectiveCamera, Vector3 } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Characters } from '../components/Characters';

export class FPSControls {
    private controls: PointerLockControls;
    private player: Characters;
    private camera: PerspectiveCamera;

    constructor(camera: PerspectiveCamera, player: Characters) {
        this.camera = camera;
        this.player = player;
        this.controls = new PointerLockControls(camera, document.body);
        this.setupEventListeners();
    }

    private setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.player.setMoveForward(true);
                    break;
                case 'KeyS':
                    this.player.setMoveBackward(true);
                    break;
                case 'KeyA':
                    this.player.setMoveLeft(true);
                    break;
                case 'KeyD':
                    this.player.setMoveRight(true);
                    break;
                case 'Space':
                    this.player.jump();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.player.setMoveForward(false);
                    break;
                case 'KeyS':
                    this.player.setMoveBackward(false);
                    break;
                case 'KeyA':
                    this.player.setMoveLeft(false);
                    break;
                case 'KeyD':
                    this.player.setMoveRight(false);
                    break;
            }
        });

        // Pointer lock controls
        document.addEventListener('click', () => {
            this.controls.lock();
        });

        this.controls.addEventListener('lock', () => {
            console.log('Pointer locked');
        });

        this.controls.addEventListener('unlock', () => {
            console.log('Pointer unlocked');
        });
    }

    public update() {
        // Update camera position to follow player
        const offset = new Vector3(-2, 0, 2);
        this.camera.position.copy(this.player.position).add(offset);
        this.camera.lookAt(this.player.position);
    }
} 