import { Color, DepthTexture, DirectionalLight, DoubleSide, Fog, HemisphereLight, Mesh, MeshBasicMaterial, MeshDepthMaterial, MeshStandardMaterial, NearestFilter, NoBlending, PlaneGeometry, RGBADepthPacking, Scene, ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three";
import { Characters } from "../components/Characters";
import { Island } from "../components/Island";
import { WaterMaterial } from "../components/water/Water";
import { DEBUG } from "../config/debug";
import { PerspectiveCameraAuto } from "@three.ez/main";

export class MainScene extends Scene {
  private island: Island;
  public player!: Characters;

  constructor(private camera: PerspectiveCameraAuto, private renderer: WebGLRenderer) {
    super();

    this.island = new Island();
    this.add(this.island);
    this._addPlayers();
    this._addWater(this.camera, this.renderer);
    this._addLight();
  }
  // TODO: fix type
  private _addWater(camera: PerspectiveCameraAuto, renderer: WebGLRenderer) {
    const depthMaterial = new MeshDepthMaterial();
    depthMaterial.depthPacking = RGBADepthPacking;
    depthMaterial.blending = NoBlending;

    // const renderTarget  = this.setupRenderTarget();
    const renderTarget = this.setupRenderTarget();
    const waterGeometry = new PlaneGeometry(500, 500);
    const waterMaterial = new WaterMaterial({ camera, renderTarget });
    const water = new Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI * 0.5;

    this.on("animate", (e) => {
      if (e) {
        water.visible = false; // we don't want the depth of the water
        this.player.visible = false;
        this.overrideMaterial = depthMaterial;

        renderer.setRenderTarget(renderTarget);
        renderer.render(this, camera);
        renderer.setRenderTarget(null);

        this.overrideMaterial = null;
        water.visible = true;
        this.player.visible = true;

        waterMaterial.update(e.total);
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

  private setupRenderTarget() {

    const dpr = this.renderer.getPixelRatio();
    const target = new WebGLRenderTarget(window.innerWidth * dpr, window.innerHeight * dpr);
    target.texture.minFilter = NearestFilter;
    target.texture.magFilter = NearestFilter;
    target.texture.generateMipmaps = false;
    target.stencilBuffer = false;
    target.samples = 4

    target.depthTexture = new DepthTexture(window.innerWidth, window.innerHeight);

    if (DEBUG) {

      const depthMaterial = new ShaderMaterial({
        uniforms: {
          tDepth: { value: target.depthTexture },
          cameraNear: { value: this.camera.near },
          cameraFar: { value: this.camera.far }
        },
        vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
        fragmentShader: `
    uniform sampler2D tDepth;
    uniform float cameraNear;
    uniform float cameraFar;
    varying vec2 vUv;

    float linearizeDepth(float z) {
      float n = cameraNear;
      float f = cameraFar;
      return (2.0 * n) / (f + n - z * (f - n));
    }

    void main() {
      float depth = texture2D(tDepth, vUv).x;
      float gray = linearizeDepth(depth);
      gl_FragColor = vec4(vec3(gray), 1.0);
    }
  `
      });


      const debugPlane = new Mesh(new PlaneGeometry(0.640, 0.360), depthMaterial);
      const rendererDebug1 = DEBUG.addFolder({ title: "Renderer Debug" });
      debugPlane.visible = true;
      rendererDebug1?.addBinding(debugPlane, "visible");

      this.on("animate", () => {
        debugPlane.position.copy(this.camera.position);
        debugPlane.rotation.copy(this.camera.rotation);
        debugPlane.translateZ(-1);
        debugPlane.translateX(-1);
        debugPlane.translateY(-0.5);
      })
      this.add(debugPlane)

    }
    this.on("viewportresize", (e) => {
      if (e) target.setSize(e.width, e.height);
    });

    return target

  }

}
