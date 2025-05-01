import RAPIER, { type Collider, type RigidBody, type World } from "@dimforge/rapier3d";
import { InstancedEntity, InstancedMesh2 } from "@three.ez/instanced-mesh";
import { AnimateEvent, Asset, PerspectiveCameraAuto } from "@three.ez/main";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DepthTexture,
  DirectionalLight,
  Fog,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshDepthMaterial,
  NearestFilter,
  NoBlending,
  Object3D,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  RGBADepthPacking,
  Scene,
  ShaderMaterial,
  Texture,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { CharacterName, GameCharacter } from "../components/Characters";
import { Island } from "../components/Island";
import { WaterMaterial } from "../components/water/Water";
import { DEBUG } from "../config/debug";
import { BasicCharacterController } from "../controllers/BasicCharacterController";
import { SharkCharacterStateMachine } from "../controllers/CharacterStateMachine";
import { NPCCharacterControl } from "../controllers/NPCCharacterControl";
import { initLOD } from "../components/InstancedMesh2Helper";
import { createSimplifiedGeometry } from "../components/meshSimplifier";
import { EXRLoader } from "three/examples/jsm/Addons.js";

Asset.preload(EXRLoader, "assets/puresky.exr");
export class MainScene extends Scene {
  private island!: Island;
  public player!: GameCharacter;
  public shark!: GameCharacter;
  public world!: World;
  public playerCharacterController!: BasicCharacterController;
  public sharkCharacterController!: NPCCharacterControl;
  public enemies: GameCharacter[] = [];
  public enemiesCharacterController: NPCCharacterControl[] = [];

  /** Internal storage for objects with physics bodies to sync them with the scene. */
  // TODO: Use a new Object3D subclass to store physics objects
  private _physicsObjects: {
    object3D: Object3D | InstancedEntity;
    body: RigidBody;
    collider: Collider;
  }[] = [];

  private debugGeometry = new LineSegments(
    new BufferGeometry(),
    new LineBasicMaterial({ vertexColors: true })
  );

  private readonly availableEnemies: CharacterName[] = [
    "Skeleton_Headless",
    "Skeleton",
    "Sharky",
    "Mako",
  ];
  eventQueue: RAPIER.EventQueue;

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
    this._createEnemies();
    this._createShark();
    this._createChest();

    for (const mesh of this.scene.querySelectorAll('[isInstancedMesh2=true]')) {
      initLOD(mesh as InstancedMesh2);
    }

    this.initLODMesh();
  }

  private async initLODMesh(): void {
    const geoMap = new Map<string, BufferGeometry>();

    for (const mesh of this.querySelectorAll('SkinnedMesh')) {
      let geometry = geoMap.get((mesh as Mesh).geometry.uuid);

      if (!geometry) {
        geometry = await createSimplifiedGeometry((mesh as Mesh).geometry, { ratio: 0.3, error: 1, lockBorder: true });
        geoMap.set((mesh as Mesh).geometry.uuid, geometry);
      }

      (mesh as Mesh).geometry = geometry;
    }

    for (const mesh of this.querySelectorAll('Mesh')) {
      if (mesh.name === 'terrain' || mesh.name === '' || mesh.name === 'Molo') continue;

      let geometry = geoMap.get((mesh as Mesh).geometry.uuid);

      if (!geometry) {
        if (mesh.name.includes('Cliff')) {
          geometry = await createSimplifiedGeometry((mesh as Mesh).geometry, { ratio: 0.05, error: 1, lockBorder: true })
        } else {
          geometry = await createSimplifiedGeometry((mesh as Mesh).geometry, { ratio: 0.3, error: 1, lockBorder: true });
        }
        geoMap.set((mesh as Mesh).geometry.uuid, geometry);
      }

      (mesh as Mesh).geometry = geometry;
    }
  }

  private _createChest() {
    const spawnPoint = this.island.querySelector("[name=Prop_Chest_Gold001]");
    console.assert(!!spawnPoint, "Chest spawn point not found");

    // add Rapier collider on chest if we touch end game 
    const chestColliderDesc = RAPIER.ColliderDesc.cuboid(2, 2, 2).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setSensor(true).setTranslation(spawnPoint.position.x, spawnPoint.position.y, spawnPoint.position.z)
      .setRotation(spawnPoint.quaternion);
    const chestBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()

    const chestBody = this.world.createRigidBody(chestBodyDesc);
    this.world.createCollider(chestColliderDesc, chestBody);
  }

  private _islandSurface() {
    this.island = new Island();
    this.add(this.island);

    const terrain = this.island.querySelector("[name=terrain]") as Mesh;
    console.assert(
      terrain as any,
      "[MainScene] Whoops! 'terrain' not found in the island."
    );

    this._addCliffColliders();
    this._addTreeColliders();
    this._addBarrelColliders();

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
    this.world.numSolverIterations = 1;
    this.world.timestep = 1 / 30; // 30 hz
    this.eventQueue = new RAPIER.EventQueue(true);
    this.on("animate", (e) => {
      this._syncPhysicsObjects(e, this.eventQueue);
    });
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
      renderer: this.renderer,
    });

    const water = new Mesh(waterGeometry, waterMaterial);

    this.on("beforeanimate", (e) => {
      if (!e) return;

      // Render depth pass
      water.visible = false;
      this.player.visible = false;
      this.userData.isRenderTargetRendering = false;
      this.overrideMaterial = depthMaterial;
      this.detectChanges(true);

      this.renderer.setRenderTarget(renderTarget);
      this.renderer.render(this, this.camera);
      this.renderer.setRenderTarget(null);

      this.overrideMaterial = null;
      water.visible = true;
      this.userData.isRenderTargetRendering = true;
      this.player.visible = true;

      this.detectChanges(true);
      waterMaterial.update(e.total);
    });
    //@ts-ignore
    console.assert(
      this.island,
      "[MainScene] Whoops! Tried to position water before island was ready."
    );

    this.island.addToPlaceholder(water, "water");
    this.island.addToPlaceholder(water, "water");
  }

  private _createEnemies() {
    const spawnPoint = this.island.querySelectorAll("[name^=@Enemy_Spawn]");

    for (const enemy of spawnPoint) { // only one enemy for now
      // Create the character
      const randomEnemy =
        this.availableEnemies[
        Math.floor(Math.random() * this.availableEnemies.length)
        ];
      // Lift the enemy position by 1 unit
      enemy.position.y += 2;

      const enemyCharacter = new GameCharacter(randomEnemy, enemy);
      enemy.parent?.add(enemyCharacter);

      enemy.removeFromParent();

      // Create the character controller with npc and physics world
      const scrullCharacterController = new NPCCharacterControl(
        enemyCharacter,
        this.world,
        this.player
      );

      this.enemies.push(enemyCharacter);
      this.enemiesCharacterController.push(scrullCharacterController);
      scrullCharacterController.stateMachine.setState("Walk");
    }
  }

  private _createShark() {
    const spawnPoint = this.island.querySelector("[name=@Shark]");
    console.assert(!!spawnPoint, "Shark spawn point not found");

    this.island.remove(spawnPoint);

    // Create the player character
    this.shark = new GameCharacter("Shark", spawnPoint);
    this.shark.canSwim = true;
    this.shark.height = 0.1;
    this.shark.radius = 5;
    this.shark.scale.copy(spawnPoint.scale);
    this.shark.position.copy(spawnPoint.position);
    this.shark.quaternion.copy(spawnPoint.quaternion);
    this.shark.updateMatrix();
    this.add(this.shark);

    // Create the character controller with the player and physics world
    this.sharkCharacterController = new NPCCharacterControl(
      this.shark,
      this.world,
      this.player,
      { detectionRange: 40, attackRange: 6, attackCooldown: 3 },
      SharkCharacterStateMachine
    );

    this.sharkCharacterController.physics.moveSpeed = 50;
    this.sharkCharacterController.stateMachine.setState("Idle");
  }

  private _createPlayer() {
    const spawnPoint = this.island.querySelector("[name=@Player_Spawn]");
    console.assert(!!spawnPoint, "Player spawn point not found");

    this.island.remove(spawnPoint);

    // Create the player character
    this.player = new GameCharacter("Captain_Barbarossa", spawnPoint, 0.8);
    this.player.isPlayer = true;
    this.add(this.player);

    // Create the character controller with the player and physics world
    this.playerCharacterController = new BasicCharacterController(
      this.player,
      this.world
    );
    this.playerCharacterController.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

  }

  private _setupLighting() {
    this.initializeEnvironmentMap();

    this.fog = new Fog(new Color().setHSL(0.6, 0, 1), 1, 5000);

    const hemiLight = new HemisphereLight(0x0000ff, 0x00ff00, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);

    const dirLight = new DirectionalLight(0xffffff, 5);

    this.add(hemiLight, dirLight);
  }

  private initializeEnvironmentMap() {
    const pmremGenerator = new PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const texture = Asset.get<Texture>("assets/puresky.exr");
    console.assert(
      texture,
      "[MainScene] Whoops! Sky texture not found. Make sure to load it first."
    );

    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    // this.environment = envMap;
    this.background = envMap;

    texture.dispose();
    pmremGenerator.dispose();
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

      this.on("afteranimate", () => {
        debugPlane.position.copy(this.camera.position);
        debugPlane.rotation.copy(this.camera.rotation);
        debugPlane.translateZ(this.camera.near * -2);
        debugPlane.translateX(this.camera.near * -2);
        debugPlane.translateY(this.camera.near * -0.5);
        debugPlane.scale.setScalar(this.camera.near * 2);
      });

      this.add(debugPlane);
    }

    this.on("viewportresize", (e) => {
      if (e) target.setSize(e.width, e.height);
    });

    return target;
  }

  private _syncPhysicsObjects(e: AnimateEvent, eventQueue: RAPIER.EventQueue) {
    if (!this.world) return;

    this.world.step(eventQueue);

    if (DEBUG) {
      const { vertices, colors } = this.world.debugRender();
      this.debugGeometry.geometry.setAttribute(
        "position",
        new BufferAttribute(vertices, 3)
      );
      this.debugGeometry.geometry.setAttribute(
        "color",
        new BufferAttribute(colors, 4)
      );
    }

    // Update the character controller
    if (this.playerCharacterController) {
      this.playerCharacterController.update(e.delta);
    }

    if (this.sharkCharacterController) {
      this.sharkCharacterController.update(e.delta);
    }
    // Update the enemies
    for (const enemy of this.enemiesCharacterController) {
      enemy.update(e.delta);
    }

    // Sync other physics objects
    for (const { object3D, body } of this._physicsObjects) {
      const pos = body.translation();
      object3D.position.set(pos.x, pos.y, pos.z);

      const rot = body.rotation();
      object3D.quaternion.set(rot.x, rot.y, rot.z, rot.w);

      if ((object3D as InstancedEntity).isInstanceEntity) {
        (object3D as InstancedEntity).owner.worldToLocal(object3D.position);
      }
      object3D.updateMatrix();
    }
  }

  private _addTreeColliders() {
    const instanced = this.island.querySelectorAll(
      "[name^=Palm]"
    ) as InstancedMesh2[];
    if (!instanced.length) {
      console.warn("No tree found to add colliders.");
      return;
    }

    instanced.forEach((treeIstance) => {
      treeIstance.instances.forEach((tree) => {
        const treePos = tree.position;

        const worldPos = treeIstance.localToWorld(treePos.clone());
        const worldQuat = new Quaternion();
        treeIstance.getWorldQuaternion(worldQuat);

        const bodyDesc = RAPIER.RigidBodyDesc.fixed()
          .setTranslation(worldPos.x, worldPos.y, worldPos.z)
          .setRotation(worldQuat);
        const body = this.world.createRigidBody(bodyDesc);

        const geometry = treeIstance.geometry;
        geometry.computeBoundingBox();

        const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 4, 0.5);

        this.world.createCollider(colliderDesc, body);
      });
    });
  }

  private _addBarrelColliders() {
    const instanced = this.island.querySelectorAll(
      "[name*=Barrel]"
    ) as InstancedMesh2[];
    if (!instanced.length) {
      console.warn("No barrel found to add colliders.");
      return;
    }

    instanced.forEach((barrelInstance) => {
      barrelInstance.instances.forEach((barrel) => {
        const worldPos = barrelInstance.localToWorld(barrel.position.clone());
        barrel.position.copy(worldPos);
        // set random quaternion
        const worldScale = barrelInstance.getWorldScale(new Vector3());
        barrel.scale.copy(worldScale);
        barrel.updateMatrix();

        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(worldPos.x, worldPos.y, worldPos.z)
          .setRotation(barrel.quaternion)
          .setLinearDamping(0.5) // Reduce linear damping for more movement
          .setAngularDamping(0.2) // Reduce angular damping for more rotation
          .setAdditionalMass(2.0); // Add more mass for better physics interaction

        const body = this.world.createRigidBody(bodyDesc);


        const geometry = barrelInstance.geometry;
        geometry.computeBoundingBox();

        const box = geometry.boundingBox;

        if (!box) {
          console.warn("Bounding box not found for barrel geometry.");
          return;
        }

        const colliderDesc = RAPIER.ColliderDesc.cylinder(
          box?.max.y - box?.min.y,
          box?.max.x - box?.min.x
        )
          .setTranslation(0, box?.max.y - box?.min.y, 0)
          .setRestitution(2) // More bounce
          .setFriction(0.05) // Less friction to slide more
          .setDensity(1); // Lighter weight for easier throwing

        this.world.createCollider(colliderDesc, body);

        // // add to physics objects
        this._physicsObjects.push({
          object3D: barrel,
          body,
          collider: this.world.createCollider(colliderDesc, body),
        });

        // body.sleep();

      });
      barrelInstance.removeFromParent();
      this.add(barrelInstance);
    });
  }

  private _addCliffColliders() {
    const cliffColliders = this.island.querySelectorAll(
      "[name^=Environment_Cliff_Collider]"
    ) as Mesh[];

    if (!cliffColliders.length) {
      console.warn("No cliff found to add colliders.");
      return;
    }

    cliffColliders.forEach((rock) => {
      const worldPos = rock.localToWorld(new Vector3());
      const worldQuat = new Quaternion();
      rock.getWorldQuaternion(worldQuat);

      const bodyDesc = RAPIER.RigidBodyDesc.fixed()
        .setTranslation(worldPos.x, worldPos.y, worldPos.z)
        .setRotation(worldQuat);
      const body = this.world.createRigidBody(bodyDesc);

      const geometry = rock.geometry;
      geometry.computeBoundingBox();

      const scaledVerts = applyScaleToVertices(
        geometry.attributes.position.array as Float32Array,
        rock.scale
      );
      const indices = geometry.index?.array as Uint32Array;

      const colliderDesc = RAPIER.ColliderDesc.trimesh(scaledVerts, indices);
      this.world.createCollider(colliderDesc, body);
      rock.removeFromParent();
    });
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
