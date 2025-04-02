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

        // Crea 4 livelli (puoi modificare il numero in base alle tue esigenze)
        for (let i = 1; i <= 4; i++) {
            const isLocked = i > 2; // Esempio: blocca i livelli 3 e 4
            const levelBtn = new LevelButton(i, isLocked);
            
            if (!isLocked) {
                levelBtn.onClick = () => this.startLevel(i);
            }
            
            levelBtn.mount(grid);
        }

        this.container.appendChild(grid);
    }

    private startLevel(levelNumber: number) {
        // Nascondi il level select
        this.hide();
        // Mostra il GameHUD
        this.gameHUD.mount();
        // Qui puoi aggiungere la logica per caricare il livello specifico
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