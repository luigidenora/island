import { Camera, Vector3 } from "three";
import { BasicCharatterController } from "./BasicCharaterController";

export class ThirdPersonCamera { 
  private _camera: Camera;
  private _target: BasicCharatterController;
  private _offset = new Vector3(-10, 5, -20);
  private _lookAtOffset = new Vector3(0, 2, 20);

  constructor(params: {camera: Camera, target: BasicCharatterController}) {
    this._camera = params.camera;
    this._target = params.target;
    
    // Inizializza la posizione della camera
    this.updateCameraPosition();
    
    // Log per debug
    console.log("ThirdPersonCamera initialized", {
      cameraPosition: this._camera.position,
      targetPosition: this._target.position
    });
  }

  update(timeElapsed: number) {
    // Aggiorna la posizione della camera
    this.updateCameraPosition();
    
    // Log per debug (solo ogni 60 frame per non sovraccaricare la console)
    if (Math.random() < 0.01) {
      console.log("Camera update", {
        cameraPosition: this._camera.position,
        targetPosition: this._target.position,
        targetRotation: this._target.rotation
      });
    }
  }

  private updateCameraPosition() {
    if (!this._target) {
      console.warn("Target is null or undefined");
      return;
    }


   // const t = 0.05;
   // const t = 4.0 * timeElapsed;
   // const t = 1.0 - Math.pow(0.001, timeElapsed);

   // this._currentPosition.lerp(idealOffset, t);
   // this._currentLookat.lerp(idealLookat, t);

    // Get target position and rotation
    const targetPosition = this._target.position;
    const targetRotation = this._target.rotation;
    
    // Calculate camera position
    const cameraPosition = this._offset.clone();
    cameraPosition.applyQuaternion(targetRotation);
    cameraPosition.add(targetPosition);
    
    // Calculate look at position
    const lookAtPosition = this._lookAtOffset.clone();
    lookAtPosition.applyQuaternion(targetRotation);
    lookAtPosition.add(targetPosition);
    
    // Update camera position
    this._camera.position.copy(cameraPosition);
    this._camera.lookAt(lookAtPosition);
  }
}
