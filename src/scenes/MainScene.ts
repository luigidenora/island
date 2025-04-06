import { Object3D, Scene } from 'three';
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

    }   

    public addLight(light: Object3D) {
        this.add(light);
    }

} 