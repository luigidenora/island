import { BufferAttribute, BufferGeometry, Color, DepthTexture, DirectionalLight, Fog, HemisphereLight, LineBasicMaterial, LineSegments, Mesh, MeshDepthMaterial, NearestFilter, NoBlending, Object3D, PlaneGeometry, RGBADepthPacking, Scene, ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three";
import { Characters } from "../components/Characters";
import { Island } from "../components/Island";
import { WaterMaterial } from "../components/water/Water";
import { DEBUG } from "../config/debug";
import { PerspectiveCameraAuto } from "@three.ez/main";
import { Collider, RigidBody } from "@dimforge/rapier3d";

export class MainScene extends Scene {
  private island: Island;
  public player!: Characters;
  public world: any;

  /** Internal storage for objects with physics bodies to sync them with the scene. */
  // TODO: Use a new Object3D subclass to store physics objects
  private _physicsObjects: {
    object3D: Object3D;
    body: RigidBody;
    collider: Collider;
  }[] = [];

  private debugGeometry = new LineSegments(
    new BufferGeometry(),
    new LineBasicMaterial({ vertexColors: true })
  );

  constructor(
    private camera: PerspectiveCameraAuto,
    private renderer: WebGLRenderer
  ) {
    super();

    this.island = new Island();
    this.add(this.island);

    this._createPlayer();
    this._addWaterSurface();
    this._setupLighting();
    this._initializePhysicsWorld();
  }

  public addObjectWithPhysics(object3D: Object3D) {

    this.add(object3D);

    if (!this.world) return;

    const position = object3D.position.toArray();
    const rotation = object3D.quaternion;

    const bodyDesc = object3D.userData.isRigidBodyFixed ? window.RAPIER.RigidBodyDesc.fixed() : window.RAPIER.RigidBodyDesc.dynamic();

    const body = this.world.createRigidBody(
      bodyDesc.setTranslation(...position).setRotation(rotation)
    );

    const vertices = new Float32Array(
      (object3D as Mesh).geometry.attributes.position.array
    );

    const shape = window.RAPIER.ColliderDesc.convexHull(vertices);
    if (!shape) throw new Error("Failed to create collider, shape is null");

    const collider = this.world.createCollider(shape, body);
    this._physicsObjects.push({ object3D, body, collider });

    return { mesh: object3D, body, collider };
  }

  private _initializePhysicsWorld() {
    if (DEBUG) {
      const debugFolder = DEBUG.addFolder({ title: "RAPIER debug" });
      this.debugGeometry.frustumCulled = false;
      this.debugGeometry.interceptByRaycaster = false;
      this.debugGeometry.visible = true;

      this.add(this.debugGeometry);
      debugFolder?.addBinding(this.debugGeometry, "visible");
    }

    const gravity = new RAPIER.Vector3(0, -9.81, 0);
    this.world = new RAPIER.World(gravity);

    this.on("animate", () => this._syncPhysicsObjects());
  }

  private _addWaterSurface() {
    const depthMaterial = new MeshDepthMaterial();
    depthMaterial.depthPacking = RGBADepthPacking;
    depthMaterial.blending = NoBlending;

    const renderTarget = this.createRenderTarget();

    const waterGeometry = new PlaneGeometry(500, 500);
    const waterMaterial = new WaterMaterial({
      camera: this.camera,
      renderTarget,
    });

    const water = new Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;

    this.on("animate", (e) => {
      if (!e) return;

      // Render depth pass
      water.visible = false;
      this.player.visible = false;
      this.overrideMaterial = depthMaterial;

      this.renderer.setRenderTarget(renderTarget);
      this.renderer.render(this, this.camera);
      this.renderer.setRenderTarget(null);

      this.overrideMaterial = null;
      water.visible = true;
      this.player.visible = true;

      waterMaterial.update(e.total);
    });

    this.island.addToPlaceholder(water, "water");
  }

  private _createPlayer() {
    const spawnPoint = this.island.querySelector("[name=@Player_Spawn]");
    console.assert(!!spawnPoint, "Player spawn point not found");

    this.island.remove(spawnPoint);

    this.player = new Characters("Captain_Barbarossa", spawnPoint);
    this.add(this.player);
  }

  private _setupLighting() {
    this.background = new Color().setHSL(0.6, 0, 1);
    this.fog = new Fog(this.background, 1, 5000);

    const hemiLight = new HemisphereLight(0x0000ff, 0x00ff00, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);

    const dirLight = new DirectionalLight(0xffffff, 5);

    this.add(hemiLight, dirLight);
  }

  private createRenderTarget(): WebGLRenderTarget {
    const dpr = this.renderer.getPixelRatio();
    const width = window.innerWidth * dpr;
    const height = window.innerHeight * dpr;

    const target = new WebGLRenderTarget(width, height);
    target.texture.minFilter = NearestFilter;
    target.texture.magFilter = NearestFilter;
    target.texture.generateMipmaps = false;
    target.stencilBuffer = false;
    target.samples = 4;

    target.depthTexture = new DepthTexture(width, height);

    if (DEBUG) {
      const debugMaterial = new ShaderMaterial({
        uniforms: {
          tDepth: { value: target.depthTexture },
          cameraNear: { value: this.camera.near },
          cameraFar: { value: this.camera.far },
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
        `,
      });

      const debugPlane = new Mesh(new PlaneGeometry(0.64, 0.36), debugMaterial);
      debugPlane.visible = true;

      const debugFolder = DEBUG.addFolder({ title: "Renderer Debug" });
      debugFolder?.addBinding(debugPlane, "visible");

      this.on("animate", () => {
        debugPlane.position.copy(this.camera.position);
        debugPlane.rotation.copy(this.camera.rotation);
        debugPlane.translateZ(-1);
        debugPlane.translateX(-1);
        debugPlane.translateY(-0.5);
      });

      this.add(debugPlane);
    }

    this.on("viewportresize", (e) => {
      if (e) target.setSize(e.width, e.height);
    });

    return target;
  }


  private _syncPhysicsObjects() {
    if (!this.world) return;

    this.world.step();

    if (DEBUG) {
      const { vertices, colors } = this.world.debugRender();
      this.debugGeometry.geometry.setAttribute("position", new BufferAttribute(vertices, 3));
      this.debugGeometry.geometry.setAttribute("color", new BufferAttribute(colors, 4));
    }

    for (const { object3D, body } of this._physicsObjects) {
      const pos = body.translation();
      object3D.position.set(pos.x, pos.y, pos.z);

      const rot = body.rotation();
      object3D.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    }
  }
}


