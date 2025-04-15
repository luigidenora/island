import { Camera, Vector3 } from "three";
import { BasicCharatterController } from "./BasicCharaterController";
import { DEBUG } from "../config/debug";

export class ThirdPersonCamera { 
  private _params: {camera: Camera, target: BasicCharatterController};
  private _camera: Camera;
  private _currentPosition: Vector3;
  private _currentLookat: Vector3;
  private _offset: Vector3;
  private _lookAtOffset: Vector3;

  constructor(params: {camera: Camera, target: BasicCharatterController}) {
    this._params = params;
    this._camera = params.camera;
    
    this._currentPosition = new Vector3();
    this._currentLookat = new Vector3();
    this._offset = new Vector3(200, 500, 3);
    this._lookAtOffset = new Vector3(0.0, 1.5, 10.0);

    this._currentPosition.copy(this._calculateIdealOffset());
    this._currentLookat.copy(this._calculateIdealLookat());
    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);

     this._setupTweakpane();
  }

  private _calculateIdealOffset(): Vector3 {
    const idealOffset = this._offset.clone();
    idealOffset.applyQuaternion(this._params.target.rotation);
    idealOffset.add(this._params.target.position);
    return idealOffset;
  }

  private _calculateIdealLookat(): Vector3 {
    const idealLookat = this._lookAtOffset.clone();
    idealLookat.applyQuaternion(this._params.target.rotation);
    idealLookat.add(this._params.target.position);
    return idealLookat;
  }

  private _setupTweakpane() {
    const folder = DEBUG?.addFolder({ title: 'Camera Controls' });
    
    // Camera offset controls
    const offsetFolder = folder?.addFolder({ title: 'Camera Offset' });
    offsetFolder?.addBinding(this._offset, 'x', { 
      label: 'X Offset', 
      min: -20, 
      max: 500, 
      step: 0.5 
    });
    offsetFolder?.addBinding(this._offset, 'y', { 
      label: 'Y Offset', 
      min: 0, 
      max: 500, 
      step: 0.5 
    });
    offsetFolder?.addBinding(this._offset, 'z', { 
      label: 'Z Offset', 
      min: -30, 
      max: 500, 
      step: 0.5 
    });
    
    // Look at offset controls
    const lookAtFolder = folder?.addFolder({ title: 'Look At Offset' });
    lookAtFolder?.addBinding(this._lookAtOffset, 'x', { 
      label: 'X Look At', 
      min: -10, 
      max: 10, 
      step: 0.5 
    });
    lookAtFolder?.addBinding(this._lookAtOffset, 'y', { 
      label: 'Y Look At', 
      min: 0, 
      max: 5, 
      step: 0.5 
    });
    lookAtFolder?.addBinding(this._lookAtOffset, 'z', { 
      label: 'Z Look At', 
      min: 0, 
      max: 30, 
      step: 0.5 
    });
  }

  update(timeElapsed: number) {
    const idealOffset = this._calculateIdealOffset();
    const idealLookat = this._calculateIdealLookat();

    // Calculate smoothing factor
    const t = 1.0 - Math.pow(0.001, timeElapsed);

    // Interpolate positions
    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }
}
