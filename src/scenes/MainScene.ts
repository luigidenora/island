import {
  Camera,
  Color,
  DepthTexture,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshDepthMaterial,
  NearestFilter,
  NoBlending,
  PlaneGeometry,
  RGBADepthPacking,
  Scene,
  UnsignedShortType,
  WebGLRenderer,
  WebGLRenderTarget
} from "three";
import { Characters } from "../components/Characters";
import { Island } from "../components/Island";
import { WaterMaterial } from "../components/water/water";

export class MainScene extends Scene {
  private island: Island;
  public player!: Characters;

  constructor(private camera: Camera, private renderer: WebGLRenderer) {
    super();

    this.island = new Island();
    this.add(this.island);
    this._addPlayers();
    this._addWater(this.camera, this.renderer);
    this._addLight();
  }
  // TODO: fix type
  private _addWater(camera: any, renderer: WebGLRenderer) {
    const depthMaterial = new MeshDepthMaterial();
    depthMaterial.depthPacking = RGBADepthPacking;
    depthMaterial.blending = NoBlending;

    const renderTarget = this._initializeRenderTarget(renderer, camera);

    const waterGeometry = new PlaneGeometry(500, 500);
    const waterMaterial = new WaterMaterial({ camera, renderTarget });
    const water = new Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI * 0.5;

    this.on("animate", (e) => {
      if (e) {
        water.visible = false; // we don't want the depth of the water
        this.overrideMaterial = depthMaterial;

        renderer.setRenderTarget(renderTarget);
        renderer.render(this, camera);
        renderer.setRenderTarget(null);

        this.overrideMaterial = null;
        water.visible = true;

        water.material.uniforms.time.value = e.total;
      }
    });

    this.island.addToPlaceholder(water, "water");
  }

  private _addPlayers() {
    // Find player spawn point
    const spawnPoint = this.island.querySelector("[name=@Player_Spawn]");
    console.assert(!!spawnPoint, "Player spawn point not found");
    this.island.remove(spawnPoint);

    // Create player at spawn point
    this.player = new Characters("Captain_Barbarossa", spawnPoint);
    this.add(this.player);
  }

  private _addLight() {
    this.background = new Color().setHSL(0.6, 0, 1);
    this.fog = new Fog(this.background, 1, 5000);

    const hemiLight = new HemisphereLight(0x0000ff, 0x00ff00, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);

    const dirLight = new DirectionalLight(0xffffff, 5);

    this.add(hemiLight, dirLight);
  }

  private _initializeRenderTarget(renderer: WebGLRenderer, camera: any) {
    const supportsDepthTextureExtension = !!renderer.extensions.get(
      "WEBGL_depth_texture"
    );
    const renderTarget = new WebGLRenderTarget(1, 1, { samples: 4 });
    renderTarget.texture.minFilter = NearestFilter;
    renderTarget.texture.magFilter = NearestFilter;
    renderTarget.texture.generateMipmaps = false;
    renderTarget.stencilBuffer = false;

    if (supportsDepthTextureExtension === true) {
      renderTarget.depthTexture = new DepthTexture(1, 1);
      renderTarget.depthTexture.type = UnsignedShortType;
      renderTarget.depthTexture.minFilter = NearestFilter;
      renderTarget.depthTexture.magFilter = NearestFilter;
    }

    this.on("viewportresize", (e) => {
      if (e) renderTarget.setSize(e.width, e.height);
    });
    this.on("animate", (e) => {
      this.renderer.setRenderTarget(renderTarget);
      this.renderer.render(this.island, camera);
      this.renderer.setRenderTarget(null);
    });
    return renderTarget;
  }
}
