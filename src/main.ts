import { Main as MainBase, PerspectiveCameraAuto } from '@three.ez/main';
import { CAMERA_CONFIG } from './config/constants';
import { DEBUG } from './config/debug';
import { ThirdPersonCamera } from './controllers/ThirdPersonCamera';
import { MainScene } from './scenes/MainScene';
import './style';
import './ui/styles/progress-bar.css';
import './ui/styles/ui.css';
export class Main extends MainBase {
  constructor() {
    super({ showStats: DEBUG != null });
    const camera = new PerspectiveCameraAuto(CAMERA_CONFIG.fov, CAMERA_CONFIG.near, CAMERA_CONFIG.far);

    const folder = DEBUG?.addFolder({ title: 'Island' });
    folder?.addBinding(camera, 'fov');
    folder?.addBinding(camera, 'near');
    folder?.addBinding(camera, 'far');

    const scene = new MainScene(camera, this.renderer);

    const thirdPersonCamera = new ThirdPersonCamera({
      camera,
      target: scene.characterController,
    });

    scene.on('animate', (event) => {
      if (event) {
        thirdPersonCamera.update(event.delta);
        camera.updateProjectionMatrix();
      }
    });
    this.createView({ scene, camera });
  }
}
