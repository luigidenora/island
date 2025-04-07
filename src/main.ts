import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { DirectionalLight } from 'three';
import { CAMERA_CONFIG } from './config/constants';
import { MainScene } from './scenes/MainScene';
import './style';
import { LevelSelect } from './ui/overlays/LevelSelect';
import './ui/styles/progress-bar.css';
import './ui/styles/ui.css';
import { ProgressManager } from './ui/ProgressManager';
import { BasicCharatterController } from './controls/BasicCharaterController';

const progressBar = new ProgressManager();

// Preload assets with progress tracking
await Asset.preloadAllPending({
    onProgress: (e) => {
        progressBar.updateProgress(e);
    },
    onError: (e) => console.error(e)
});
progressBar.hideProgressBar();

const mainScene = new MainScene();



const camera = new PerspectiveCameraAuto(CAMERA_CONFIG.fov)
    .translateZ(CAMERA_CONFIG.translateZ)
    .translateX(CAMERA_CONFIG.translateX)
    .translateY(CAMERA_CONFIG.translateY);




const controls = new BasicCharatterController(mainScene.player);


const light = new DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 0);
mainScene.addLight(light);



const main = new Main();
main.createView({ scene: mainScene, camera });

// Initialize LevelSelect but keep it hidden during loading
const levelSelect = new LevelSelect();
levelSelect.mount();
document.querySelector('.level-select-overlay')?.classList.add('hidden');

