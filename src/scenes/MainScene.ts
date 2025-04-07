import { Object3D, Scene } from 'three';
import { Characters } from '../components/Characters';
import { Island } from '../components/Island';

export class MainScene extends Scene {
    private island: Island;
    public player: Characters;

    // test only 
    player2: Characters;
    player3: Characters;
    player4: Characters;
    player5: Characters;    

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

        // test only 
        this.player2 = new Characters('Anne', spawnPoint.clone().translateX(2));
        this.add(this.player2);

        this.player3 = new Characters('Henry', spawnPoint.clone().translateX(4));
        this.add(this.player3);

        this.player4 = new Characters('Skeleton_Headless', spawnPoint.clone().translateX(6));
        this.add(this.player4);

        this.player5 = new Characters('Sharky', spawnPoint.clone().translateX(8));
        this.add(this.player5);
        
    }   

    public addLight(light: Object3D) {
        this.add(light);
    }

} 