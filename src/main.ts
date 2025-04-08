import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, HemisphereLight } from 'three';
import { CAMERA_CONFIG } from './config/constants';
import { MainScene } from './scenes/MainScene';
import './style';
import './ui/styles/progress-bar.css';
import './ui/styles/ui.css';
import { ProgressManager } from './ui/ProgressManager';
import { BasicCharatterController } from './controls/BasicCharaterController';
import { ThirdPersonCamera } from './controls/ThirdPersonCamera';

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


const camera = new PerspectiveCameraAuto(CAMERA_CONFIG.fov, CAMERA_CONFIG.near, CAMERA_CONFIG.far);
const controls = new BasicCharatterController(mainScene.player);

const thirdPersonCamera = new ThirdPersonCamera({camera, target: controls});

mainScene.on('animate', (event) => {
  if(event){
    controls.update(event.delta);
    thirdPersonCamera.update(event.delta);
  }
});

const main = new Main();
main.createView({ scene: mainScene, camera });

// const levelSelect = new LevelSelect();
// levelSelect.mount();

