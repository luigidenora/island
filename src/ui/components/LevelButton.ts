export class LevelButton {
    private element: HTMLButtonElement;
    private _onClick: (() => void) | null = null;

    constructor(level: number, isLocked: boolean = false) {
        this.element = document.createElement('button');
        this.element.className = `level-button ${isLocked ? 'locked' : ''}`;
        
        const content = `
            <div class="level-number">${level}</div>
            ${isLocked ? '<div class="lock-icon">🔒</div>' : ''}
        `;
        
        this.element.innerHTML = content;
        
        if (!isLocked) {
            this.element.addEventListener('click', () => {
                if (this._onClick) {
                    this._onClick();
                }
            });
        }
    }

    set onClick(callback: () => void) {
        this._onClick = callback;
    }

    mount(parent: HTMLElement) {
        parent.appendChild(this.element);
    }
} 