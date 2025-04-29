import { LevelButton } from '../components/LevelButton';
import { GameHUD } from './GameHUD';
import { ThirdPersonCamera } from '../../controllers/ThirdPersonCamera';

export class LevelSelect {
    private container: HTMLDivElement;
    private gameHUD: GameHUD;
    private camera: ThirdPersonCamera;

    constructor(camera: ThirdPersonCamera) {
        this.container = document.createElement('div');
        this.container.className = 'level-select-overlay';
        this.gameHUD = new GameHUD();
        this.camera = camera;
        this.init();
    }

    private init() {
        const title = document.createElement('h1');
        title.textContent = 'SELECT LEVEL';
        title.className = 'level-select-title';
        this.container.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'level-grid';

        // Create 4 levels (you can modify the number based on your needs)
        for (let i = 1; i <= 4; i++) {
            const isLocked = i > 1;
            const levelBtn = new LevelButton(i, isLocked);
            
            if (!isLocked) {
                levelBtn.onClick = () => this.startLevel(i);
            }
            
            levelBtn.mount(grid);
        }

        this.container.appendChild(grid);
    }

    private startLevel(levelNumber: number) {
        // Hide level select
        this.hide();
        // Show GameHUD
        this.gameHUD.mount();
        
        // Update camera position based on level
        if (this.camera) {
            // Set camera offset based on level number
            this.camera.setOffset(-1.0, 5.0, -5.5);
        }
        
        // Here you can add logic to load the specific level
        console.log(`Starting level ${levelNumber}`);
    }

    mount() {
        document.body.appendChild(this.container);
    }

    hide() {
        this.container.style.display = 'none';
    }

    show() {
        this.container.style.display = 'flex';
    }
} 