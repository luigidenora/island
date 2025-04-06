import { LevelButton } from '../components/LevelButton';
import { GameHUD } from './GameHUD';

export class LevelSelect {
    private container: HTMLDivElement;
    private gameHUD: GameHUD;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'level-select-overlay';
        this.gameHUD = new GameHUD();
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
            const isLocked = i > 2; // Example: lock levels 3 and 4
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