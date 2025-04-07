import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { DirectionalLight, PerspectiveCamera } from 'three';
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

// Crea la camera
const camera = new PerspectiveCamera(CAMERA_CONFIG.fov, window.innerWidth / window.innerHeight, CAMERA_CONFIG.near, CAMERA_CONFIG.far);
camera.position.set(0, 5, 10); // Posizione iniziale della camera più in basso

// Crea i controlli del personaggio
const controls = new BasicCharatterController(mainScene.player);

// Log per debug
console.log("Player position:", mainScene.player.position);
console.log("Player rotation:", mainScene.player.rotation);

// Crea la camera third-person
const thirdPersonCamera = new ThirdPersonCamera({camera, target: controls});

// only for test 
const controls2 = new BasicCharatterController(mainScene.player2);
const controls3 = new BasicCharatterController(mainScene.player3);
const controls4 = new BasicCharatterController(mainScene.player4);
const controls5 = new BasicCharatterController(mainScene.player5);

// Gestione del ridimensionamento della finestra
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Loop di animazione
let lastTime = 0;

mainScene.on('animate', (event) => {
    // Calcola il delta time in secondi
    const currentTime = performance.now() / 1000;
    const deltaTime = lastTime > 0 ? currentTime - lastTime : 0.016;
    lastTime = currentTime;
    
    // Aggiorna i controlli del personaggio
    controls.update(deltaTime);
    
    // Aggiorna la camera
    thirdPersonCamera.update(deltaTime);
    
    // only for test 
    controls2.update(deltaTime);
    controls3.update(deltaTime);
    controls4.update(deltaTime);
    controls5.update(deltaTime);
    
    // Log per debug (solo ogni 60 frame per non sovraccaricare la console)
    if (Math.random() < 0.01) {
        console.log("Animation frame", {
            cameraPosition: camera.position,
            playerPosition: mainScene.player.position,
            playerRotation: mainScene.player.rotation
        });
    }
});

// Aggiungi la luce
const light = new DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 0);
mainScene.addLight(light);

// Crea la vista principale
const main = new Main();
main.createView({ scene: mainScene, camera });

// Initialize LevelSelect but keep it hidden during loading
const levelSelect = new LevelSelect();
levelSelect.mount();
document.querySelector('.level-select-overlay')?.classList.add('hidden');

