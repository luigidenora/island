import { Vector3 } from "three";

export class ThirdPersonCamera { 
  constructor(param){
    this._params = params;
    this._camera = params.camera;

    this._currentPosition = new Vector3();
    this._currentLookat = new Vector3();
  }
  _CalculateIdalOffset() {
    const idealOffset = new Vector3(-15,20,-30);
    idealOffset.applyQuaternion(this._params.target.Rotation);
    idealOffset.add(this._params.target.Position)
  }

  Update(timeElapsed){
    const idealOffset = this._CalculateIdalOffset();
    const idealLookat = this._CalculateIdalOffset();

    this._currentPosition.copy(idealOffset);
    this._currentLookat.copy(idealLookat);


    this._camera.position.copy(this._currentPosition)
    this._camera.lookAt(this._currentLookat);

  }

}
