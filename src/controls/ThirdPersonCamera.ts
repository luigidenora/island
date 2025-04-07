import { Camera, Vector3 } from "three";
import { BasicCharatterController } from "./BasicCharaterController";

export class ThirdPersonCamera { 
  private _camera: Camera;
  private _currentPosition = new Vector3();
  private _currentLookat = new Vector3();

  constructor(private _params: {camera: Camera , target: BasicCharatterController}){
    this._camera = this._params.camera;
  }

  private _calculateIdalOffset() {
    const idealOffset = new Vector3(-15,20,-30);
    idealOffset.applyQuaternion(this._params.target.rotation);
    idealOffset.add(this._params.target.position);
    return idealOffset;
  }

  private _calculateIdealLookat() {
    const idealLookat = new Vector3(0, 10, 50);
    idealLookat.applyQuaternion(this._params.target.rotation);
    idealLookat.add(this._params.target.position);
    return idealLookat;
  }

  update(timeElapsed:number){
    const idealOffset = this._calculateIdalOffset();
    const idealLookat = this._calculateIdealLookat();


    // const t = 0.05;
    // const t = 4.0 * timeElapsed;
    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }

}
