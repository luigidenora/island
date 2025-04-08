import { AmbientLight, Color, DirectionalLight, Fog, HemisphereLight, Object3D, Scene } from 'three';
import { Characters } from '../components/Characters';
import { Island } from '../components/Island';

export class MainScene extends Scene {
  private island: Island;
  public player: Characters;

  constructor() {
    super();

    this.island = new Island(); 
    this.add(this.island);

    // Find player spawn point
    const spawnPoint = this.island.querySelector('[name=@Player_Spawn]');
    console.assert(!!spawnPoint, 'Player spawn point not found');
    this.island.remove(spawnPoint);

    // Create player at spawn point
    this.player = new Characters('Captain_Barbarossa', spawnPoint);
    this.add(this.player);

    this._addLight();
  }  

  private _addLight(){

    this.background = new Color().setHSL( 0.6, 0, 1 );
    this.fog = new Fog( this.background, 1, 5000 );

    const hemiLight = new HemisphereLight( 0x0000ff, 0x00ff00, 0.6 );
     hemiLight.color.setHSL(0.6,1,0.6)
     hemiLight.groundColor.setHSL(0.095,1,0.75)
     hemiLight.position.set(0,50,0)

    const dirLight = new DirectionalLight(0xffffff, 5)

    this.add(hemiLight, dirLight);
  }

} 
