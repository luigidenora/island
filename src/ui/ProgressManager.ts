export class ProgressManager {
    private progressBar: HTMLElement | null;
    private progressText: HTMLElement | null;
    private progressContainer: HTMLElement | null;

    constructor() {
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.progressContainer = document.getElementById('progress-container');
    }


    public updateProgress(percent: number): void {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = `${percent}%`;
        }
    }

    public hideProgressBar(callback?: () => void): void {
        if (this.progressContainer) {
            this.progressContainer.style.opacity = '0';
            setTimeout(() => {
                if (this.progressContainer) {
                    this.progressContainer.style.display = 'none';
                }
                
                if (callback) {
                    callback();
                }
            }, 500);
        }
    }
} 