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
import { DEBUG } from './config/debug';
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
camera.position.set(CAMERA_CONFIG.translateX, CAMERA_CONFIG.translateY, CAMERA_CONFIG.translateZ);


const cameraFolder = DEBUG.addFolder({
    title: 'Camera'
});
cameraFolder.addBinding(camera, 'fov');
cameraFolder.addBinding(camera, 'position');
cameraFolder.addBinding(camera, 'rotation');
cameraFolder.addBinding(camera, 'up');
cameraFolder.addBinding(camera, 'near');
cameraFolder.addBinding(camera, 'far');

const controls = new BasicCharatterController(mainScene.player);

const thirdPersonCamera = new ThirdPersonCamera({camera, target:controls});

// only for test 
const controls2 = new BasicCharatterController(mainScene.player2);
const controls3 = new BasicCharatterController(mainScene.player3);
const controls4 = new BasicCharatterController(mainScene.player4);
const controls5 = new BasicCharatterController(mainScene.player5);



mainScene.on('animate', (event) => {

    thirdPersonCamera.update(event?.delta ?? 0);
    controls.update(event?.delta ?? 0);
    // only for test 
    controls2.update(event?.delta ?? 0);
    controls3.update(event?.delta ?? 0);
    controls4.update(event?.delta ?? 0);
    controls5.update(event?.delta ?? 0);
});

const light = new DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 0);
mainScene.addLight(light);



const main = new Main();
main.createView({ scene: mainScene, camera });

// Initialize LevelSelect but keep it hidden during loading
const levelSelect = new LevelSelect();
levelSelect.mount();
document.querySelector('.level-select-overlay')?.classList.add('hidden');

