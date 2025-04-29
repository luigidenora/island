export class GameHUD {
    private readonly container: HTMLDivElement;
    private readonly scoreContainer: HTMLDivElement;
    private readonly scoreLabel: HTMLDivElement;
    private readonly scoreValue: HTMLDivElement;
    private readonly healthElement: HTMLDivElement;
    private readonly intervalIds: number[] = [];
    private readonly maxHealth: number = 3;
    private readonly animationDuration: number = 150;
    private readonly updateDuration: number = 300;

    private _score: number = 0;
    private _health: number = 3;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'hud';
        
        // Create avatar hexagon
        const avatarHex = document.createElement('div');
        avatarHex.className = 'avatar-hex';

        // add img to avatarHex
        const avatarImg = document.createElement('img');
        avatarImg.src = 'assets/avatar.png';
        avatarImg.alt = 'Avatar';
        avatarImg.className = 'avatar-hex__img';
        avatarHex.appendChild(avatarImg);
        
        // Create score container with label
        this.scoreContainer = document.createElement('div');
        this.scoreContainer.className = 'score';
        
        this.scoreLabel = document.createElement('div');
        this.scoreLabel.className = 'score__label';
        this.scoreLabel.textContent = 'SCORE:';
        
        this.scoreValue = document.createElement('div');
        this.scoreValue.className = 'score__value';
        
        this.scoreContainer.append(this.scoreLabel, this.scoreValue);
        
        this.healthElement = document.createElement('div');
        this.healthElement.className = 'health';
        
        this.init();

        // Add elements to container in correct grid order
        this.container.append(
            avatarHex,
            this.healthElement,
            this.scoreContainer
        );
    }

    private init(): void {
        // Set initial values
        this.health = this._health;
        this.score = this._score;
    }

    // Getters and Setters
    get score(): number {
        return this._score;
    }

    set score(value: number) {
        this._score = value;
        this.animateNumberChange(this.scoreValue, value);
    }

    get health(): number {
        return this._health;
    }

    set health(value: number) {
        this._health = value;
        this.updateHealthDisplay();
        this.updateElementStyle(this.healthElement, 'health--updating', 800);
    }

    // Private methods
    private updateElementStyle(element: HTMLElement, className: string, duration: number = this.updateDuration): void {
        element.classList.add(className);
        setTimeout(() => element.classList.remove(className), duration);
    }

    private updateHealthDisplay(): void {
        const hearts = Array(this.maxHealth)
            .fill(null)
            .map((_, index) => {
                const isFull = index < this._health;
                return `<span class="health__heart ${!isFull ? 'health__heart--empty' : ''}">${isFull ? '❤️' : '🖤'}</span>`;
            })
            .join('');
        
        this.healthElement.innerHTML = hearts;
    }

    private createRollingNumber(value: number): string {
        return value.toString().padStart(4, '0').split('').map((digit, index) => 
            `<span class="score__digit" style="--digit-index: ${index + 1}">
                <span class="score__digit-inner">${digit}</span>
            </span>`
        ).join('');
    }

    private animateNumberChange(element: HTMLDivElement, newValue: number): void {
        const oldDigits = element.querySelectorAll('.score__digit');
        const newDigits = this.createRollingNumber(newValue);
        
        element.innerHTML = newDigits;
        const newDigitElements = element.querySelectorAll('.score__digit');
        
        newDigitElements.forEach((digit, index) => {
            const oldDigit = oldDigits[index];
            const oldDigitValue = oldDigit?.querySelector('.score__digit-inner')?.textContent || '';
            const newDigitValue = digit.querySelector('.score__digit-inner')?.textContent || '';
            
            if (oldDigitValue !== newDigitValue) {
                this.animateDigit(digit);
            }
        });
    }

    private animateDigit(digit: Element): void {
        const newNumber = digit.querySelector('.score__digit-inner')!.cloneNode(true) as HTMLElement;
        newNumber.style.position = 'absolute';
        newNumber.style.top = '100%';
        digit.appendChild(newNumber);
        
        digit.classList.add('score__digit--rolling');
        
        setTimeout(() => {
            digit.classList.remove('score__digit--rolling');
            newNumber.remove();
        }, this.animationDuration);
    }

    // Public methods
    mount(): void {
        document.body.appendChild(this.container);
        window.addEventListener("damage", () => {
            const damage = 1;
            this.health = Math.max(this.health - damage, 0);
            if (this.health <= 0) {
                this.gameOver();
            }
        });
    }
    
    gameOver() {
        this.health = 0;
        this.updateElementStyle(this.healthElement, 'health--game-over', 800);
        this.hide();
        // Add any additional game over logic here
        window.dispatchEvent(new CustomEvent('game-over'));
    }

    unmount(): void {
        this.container.remove();
    }
    
    show(): void {
        this.container.classList.remove('hidden');
    }
    
    hide(): void {
        this.container.classList.add('hidden');
    }
} 