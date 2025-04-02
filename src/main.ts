import './style';
import './ui/styles/ui.css';
import { PerspectiveCameraAuto } from '@three.ez/main';
import { Main } from '@three.ez/main';
import { MainScene } from './scenes/MainScene';
import { CAMERA_CONFIG } from './config/constants';
import { GameHUD } from './ui/overlays/GameHUD';
import { LevelSelect } from './ui/overlays/LevelSelect';

const scene = new MainScene();
const camera = new PerspectiveCameraAuto(CAMERA_CONFIG.fov)
    .translateZ(CAMERA_CONFIG.distance);

const main = new Main();
main.createView({ scene, camera });
main.showStats = false;

// Inizializza il LevelSelect
const levelSelect = new LevelSelect();
levelSelect.mount();

// Inizializza il GameHUD ma non mostrarlo ancora
const gameHUD = new GameHUD();
