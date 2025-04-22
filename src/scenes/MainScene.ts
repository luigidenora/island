import { BufferAttribute, BufferGeometry, Color, DepthTexture, DirectionalLight, Fog, HemisphereLight, LineBasicMaterial, LineSegments, Mesh, MeshDepthMaterial, NearestFilter, NoBlending, Object3D, PlaneGeometry, Quaternion, RGBADepthPacking, Scene, ShaderMaterial, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";
import { Characters } from "../components/Characters";
import { Island } from "../components/Island";
import { WaterMaterial } from "../components/water/Water";
import { DEBUG } from "../config/debug";
import { PerspectiveCameraAuto } from "@three.ez/main";
import RAPIER, { Collider, RigidBody } from "@dimforge/rapier3d";

export class MainScene extends Scene {
  private island!: Island;
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
    this._initializePhysicsWorld();
    this._setupLighting();
    this._islandSurface();
    this._addWaterSurface();
    this._createPlayer();
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

  private _islandSurface() {
    this.island = new Island();
    this.add(this.island);

    const terrain = this.island.querySelector("[name=terrain]") as Mesh;
    console.assert(terrain as any, "[MainScene] Whoops! 'terrain' not found in the island.");

    const worldPos = terrain.localToWorld(new Vector3());
    const worldQuat = new Quaternion();
    terrain.getWorldQuaternion(worldQuat);

    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(worldPos.x, worldPos.y, worldPos.z)
      .setRotation(worldQuat);
    const body = this.world.createRigidBody(bodyDesc);

    const geometry = terrain.geometry;
    geometry.computeBoundingBox();

    const scaledVerts = applyScaleToVertices(
      geometry.attributes.position.array as Float32Array,
      terrain.scale
    );
    const indices = geometry.index?.array as Uint32Array;

    const colliderDesc = RAPIER.ColliderDesc.trimesh(scaledVerts, indices); // o trimesh se serve
    this.world.createCollider(colliderDesc, body);

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
    //@ts-ignore
    console.assert(this.island, "[MainScene] Whoops! Tried to position water before island was ready.");

    this.island.addToPlaceholder(water, "water");
  }

  private _createPlayer() {
    const spawnPoint = this.island.querySelector("[name=@Player_Spawn]");
    console.assert(!!spawnPoint, "Player spawn point not found");

    this.island.remove(spawnPoint);
    const spawnPosition = spawnPoint.position
    const playerBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(spawnPosition.x, spawnPosition.y, spawnPosition.z)
      .setLinearDamping(4.0) // più alto = più freno al movimento automatico
      .setAngularDamping(1.0).lockRotations();

    const playerBody = this.world.createRigidBody(playerBodyDesc);
    const height = 1.0;
    const radius = 0.5;

    const playerColliderDesc = RAPIER.ColliderDesc.capsule(height / 2, radius)
      .setFriction(1.5)
      .setRestitution(0.0); // no bounce

    this.world.createCollider(playerColliderDesc, playerBody);

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
    const width = window.innerWidth;
    const height = window.innerHeight;

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

function applyScaleToVertices(
  vertices: Float32Array,
  scale: Vector3
): Float32Array {
  const scaled = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    scaled[i] = vertices[i] * scale.x;
    scaled[i + 1] = vertices[i + 1] * scale.y;
    scaled[i + 2] = vertices[i + 2] * scale.z;
  }
  return scaled;
}
