import { Mesh, PlaneGeometry, MeshNormalMaterial } from 'three';
import { ISLAND_CONFIG } from '../config/constants';

export class Island extends Mesh {
    constructor() {
        super(
            new PlaneGeometry(ISLAND_CONFIG.size, ISLAND_CONFIG.size),
            new MeshNormalMaterial()
        );
        this.init();
    }

    private init() {
        this.rotateX(ISLAND_CONFIG.tilt);
    }
} 