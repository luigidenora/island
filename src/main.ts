import './style';
import './ui/styles/ui.css';
import { PerspectiveCameraAuto } from '@three.ez/main';
import { Main } from '@three.ez/main';
import { MainScene } from './scenes/MainScene';
import { CAMERA_CONFIG } from './config/constants';

const scene = new MainScene();
const camera = new PerspectiveCameraAuto(CAMERA_CONFIG.fov)
    .translateZ(CAMERA_CONFIG.distance);

const main = new Main();
main.createView({ scene, camera });
