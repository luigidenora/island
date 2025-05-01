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
        title.textContent = 'Hello, Adventurer!';
        title.className = 'level-select-title';
        this.container.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'level-grid';

        // // Create 4 levels (you can modify the number based on your needs)
        for (let i = 1; i <= 1; i++) {
            const isLocked = i > 1;
            const levelBtn = new LevelButton(i, isLocked);
            
            if (!isLocked) {
                levelBtn.onClick = () => this.startLevel(i);
            }
            
            levelBtn.mount(grid);
        }

        this.container.appendChild(grid);

        // Aggiungo il testo informativo
        const instructionText = document.createElement('p');
        instructionText.textContent = 'To win, find and touch the treasure!';
        instructionText.className = 'level-instructions';
        this.container.appendChild(instructionText);

        // Aggiungo stile CSS inline per il testo
        const style = document.createElement('style');
        style.textContent = `
            .level-instructions {
                color: #FFD700;
                font-size: 1.2em;
                text-align: center;
                margin-top: 20px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                font-weight: bold;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.6);
                border-radius: 8px;
            }
        `;
        document.head.appendChild(style);
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