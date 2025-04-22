import { PerspectiveCameraAuto } from '@three.ez/main';
import { CAMERA_CONFIG } from './config/constants';
import { BasicCharatterController } from './controls/BasicCharaterController';
import { ThirdPersonCamera } from './controls/ThirdPersonCamera';
import { MainScene } from './scenes/MainScene';
import './style';
import './ui/styles/progress-bar.css';
import './ui/styles/ui.css';
import { Main as MainBase } from '@three.ez/main';
import { DEBUG } from './config/debug';

export class Main extends MainBase {
  constructor() {
    super({ showStats: DEBUG != null });
    const camera = new PerspectiveCameraAuto(CAMERA_CONFIG.fov, CAMERA_CONFIG.near, CAMERA_CONFIG.far);

    const folder = DEBUG?.addFolder({ title: 'Island' });
    folder?.addBinding(camera, 'fov');
    folder?.addBinding(camera, 'near');
    folder?.addBinding(camera, 'far');

    const scene = new MainScene(camera, this.renderer);
    const controls = new BasicCharatterController(scene.player);

    const thirdPersonCamera = new ThirdPersonCamera({
      camera,
      target: controls,
    });

    scene.on('animate', (event) => {
      if (event) {
        controls.update(event.delta);
        thirdPersonCamera.update(event.delta);
        camera.updateProjectionMatrix();
      }
    });
    this.createView({ scene, camera });
  }
}

