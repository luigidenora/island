export class Button {
    private element: HTMLButtonElement;

    constructor(text: string, onClick: () => void) {
        this.element = document.createElement('button');
        this.element.className = 'game-button';
        this.element.textContent = text;
        this.element.addEventListener('click', onClick);
    }

    mount(parent: HTMLElement) {
        parent.appendChild(this.element);
    }
} 