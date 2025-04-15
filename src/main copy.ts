import * as THREE from "three";
import vertexShader from "./components/water/water.vert?raw";
import fragmentShader from "./components/water/water.frag?raw";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

// Define proper types for all variables
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let renderTarget: THREE.WebGLRenderTarget;
let depthMaterial: THREE.MeshDepthMaterial;
let clock: THREE.Clock;

let water: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;

const params = {
  foamColor: 0xffffff,
  waterColor: 0x14c6a5,
  threshold: 0.1
};

init();
animate();

function init() {
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 7, 10);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e485e);

  // lights

  const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(0, 5, 5);
  scene.add(dirLight);

  // border

  const boxGeometry = new THREE.BoxGeometry(10, 1, 1);
  const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xea4d10 });

  const box1 = new THREE.Mesh(boxGeometry, boxMaterial);
  box1.position.z = 4.5;
  scene.add(box1);

  const box2 = new THREE.Mesh(boxGeometry, boxMaterial);
  box2.position.z = -4.5;
  scene.add(box2);

  const box3 = new THREE.Mesh(boxGeometry, boxMaterial);
  box3.position.x = -5;
  box3.rotation.y = Math.PI * 0.5;
  scene.add(box3);

  const box4 = new THREE.Mesh(boxGeometry, boxMaterial);
  box4.position.x = 5;
  box4.rotation.y = Math.PI * 0.5;
  scene.add(box4);

  // box middle

  const box5 = new THREE.Mesh(new THREE.BoxGeometry(), boxMaterial);
  box5.rotation.y = Math.PI * 0.1;
  box5.rotation.x = Math.PI * 0.05;
  scene.add(box5);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Replace deprecated outputEncoding with outputColorSpace
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const supportsDepthTextureExtension = !!renderer.extensions.get(
    "WEBGL_depth_texture"
  );

  const pixelRatio = renderer.getPixelRatio();

  renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth * pixelRatio,
    window.innerHeight * pixelRatio
  );
  renderTarget.texture.minFilter = THREE.LinearFilter;
  renderTarget.texture.magFilter = THREE.LinearFilter;
  renderTarget.texture.generateMipmaps = false;
  renderTarget.stencilBuffer = false;

  if (supportsDepthTextureExtension === true) {
    renderTarget.depthTexture = new THREE.DepthTexture(
      window.innerWidth * pixelRatio,
      window.innerHeight * pixelRatio
    );
    renderTarget.depthTexture.type = THREE.UnsignedShortType;
    renderTarget.depthTexture.minFilter = THREE.LinearFilter;
    renderTarget.depthTexture.magFilter = THREE.LinearFilter;
  }

  depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.depthPacking = THREE.RGBADepthPacking;
  depthMaterial.blending = THREE.NoBlending;

  // water

  const dudvMap = new THREE.TextureLoader().load(
    "https://i.imgur.com/hOIsXiZ.png"
  );
  dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;

  const uniforms = {
    time: {
      value: 0
    },
    threshold: {
      value: 0.1
    },
    tDudv: {
      value: null
    },
    tDepth: {
      value: null
    },
    cameraNear: {
      value: 0
    },
    cameraFar: {
      value: 0
    },
    resolution: {
      value: new THREE.Vector2()
    },
    foamColor: {
      value: new THREE.Color()
    },
    waterColor: {
      value: new THREE.Color()
    }
  };

  const waterGeometry = new THREE.PlaneGeometry(10, 10);
  
  
  const waterMaterial = new THREE.ShaderMaterial({
    defines: {
      DEPTH_PACKING: supportsDepthTextureExtension === true ? 0 : 1,
      ORTHOGRAPHIC_CAMERA: 0
    },
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib["fog"], uniforms]),
    vertexShader,
    fragmentShader,
    fog: true
  });

  waterMaterial.uniforms.cameraNear.value = camera.near;
  waterMaterial.uniforms.cameraFar.value = camera.far;
  waterMaterial.uniforms.resolution.value.set(
    window.innerWidth * pixelRatio,
    window.innerHeight * pixelRatio
  );
  console.log(supportsDepthTextureExtension);
  waterMaterial.uniforms.tDudv.value = dudvMap;
  waterMaterial.uniforms.tDepth.value =
    supportsDepthTextureExtension === true
      ? renderTarget.depthTexture
      : renderTarget.texture;

  water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI * 0.5;
  scene.add(water);

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 50;

  //

  const gui = new GUI();

  gui.addColor(params, "foamColor");
  gui.addColor(params, "waterColor");
  gui.add(params, "threshold", 0.1, 1);
  gui.open();

  //

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  const pixelRatio = renderer.getPixelRatio();

  renderTarget.setSize(
    window.innerWidth * pixelRatio,
    window.innerHeight * pixelRatio
  );
  water.material.uniforms.resolution.value.set(
    window.innerWidth * pixelRatio,
    window.innerHeight * pixelRatio
  );
}

function animate() {
  requestAnimationFrame(animate);

  // depth pass

  water.visible = false; // we don't want the depth of the water
  scene.overrideMaterial = depthMaterial;

  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  scene.overrideMaterial = null;
  water.visible = true;

  // beauty pass

  const time = clock.getElapsedTime();

  water.material.uniforms.threshold.value = params.threshold;
  water.material.uniforms.time.value = time;
  water.material.uniforms.foamColor.value.set(params.foamColor);
  water.material.uniforms.waterColor.value.set(params.waterColor);

  renderer.render(scene, camera);
}
