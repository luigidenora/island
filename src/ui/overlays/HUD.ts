import { Button } from '../components/Button';
import '../styles/ui.css';
/**
 * Class that manages the game's Head-Up Display (HUD).
 * Provides a user interface overlay for game elements like buttons and menus.
 */
export class HUD {
    private container: HTMLDivElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'game-hud';
        this.init();
    }

    private init() {
        const menuButton = new Button('Menu', () => {
            // Logica per aprire il menu
        });
        menuButton.mount(this.container);
    }

    mount() {
        document.body.appendChild(this.container);
    }
} 