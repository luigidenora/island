import { DEBUG } from "../../config/debug";
import fragmentShader from "./water.frag?raw";
import vertexShader from "./water.vert?raw";
import { Color, PerspectiveCamera, RepeatWrapping, ShaderMaterial, TextureLoader, UniformsLib, UniformsUtils, Vector2, WebGLRenderTarget } from "three";

var waterUniforms = {
  time: {
    value: 0
  },
  threshold: {
    value: 0.35
  },
  smoothstepStart: {
    value: 1
  },
  smoothstepEnd: {
    value: 0.7
  },
  textureFoamSize: {
    value: 1.0
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
    value: new Vector2()
  },
  foamColor: {
    value: new Color(0xffffff)
  },
  waterColor: {
    value: new Color(0x14aec6)
  },
  waterDepthColor: {
    value: new Color(0x0373a3)
  }
};


export class WaterMaterial extends ShaderMaterial {

  private camera: PerspectiveCamera;

  constructor({ camera, renderTarget }: { camera: PerspectiveCamera, renderTarget: WebGLRenderTarget }) {
    const _supportsDepthTextureExtension = true;
    const _pixelRatio = window.devicePixelRatio;
    // TODO: move in loader ? 
    const dudvMap = new TextureLoader().load(
      "https://i.imgur.com/hOIsXiZ.png"
    );
    dudvMap.wrapS = dudvMap.wrapT = RepeatWrapping;
    dudvMap.repeat.set(10, 10);

    super({
      defines: {
        DEPTH_PACKING: (_supportsDepthTextureExtension ?? true) === true ? 0 : 1,
        ORTHOGRAPHIC_CAMERA: 0
      },
      uniforms: UniformsUtils.merge([
        UniformsLib["fog"],
        waterUniforms
      ]),
      vertexShader,
      fragmentShader,
      fog: true,
      transparent: true
    });

    this.camera = camera;
    this._setupTweakpane();

    this.uniforms.cameraNear.value = camera.near;
    this.uniforms.cameraFar.value = camera.far;
    this.uniforms.resolution.value.set(
      window.innerWidth * _pixelRatio,
      window.innerHeight * _pixelRatio
    );
    this.uniforms.tDudv.value = dudvMap;
    this.uniforms.tDepth.value =
      _supportsDepthTextureExtension === true
        ? renderTarget.depthTexture
        : renderTarget.texture;
  }

  public update(time: number) {
    this.uniforms.time.value = time / 2;
    this.uniforms.cameraNear.value = this.camera.near;
    this.uniforms.cameraFar.value = this.camera.far;
  }


  private _setupTweakpane() {
    const folder = DEBUG?.addFolder({ title: 'Water Material' });

    folder?.addBinding(this.uniforms.threshold, 'value', {
      label: 'Threshold',
      min: -2,
      max: 2,
      step: 0.01
    });

    folder?.addBinding(this.uniforms.textureFoamSize, 'value', {
      label: 'textureFoamSize',
      min: 1.0,
      max: 5000.0,
      step: 1
    });

    folder?.addBinding(this.uniforms.smoothstepStart, 'value', {
      label: 'Depth Cutoff',
      min: 0,
      max: 1,
      step: 0.01
    });
    folder?.addBinding(this.uniforms.smoothstepEnd, 'value', {
      label: 'Depth Cutoff',
      min: 0,
      max: 1,
      step: 0.01
    });
    // color 
    folder?.addBinding(this.uniforms.waterColor, 'value', {
      label: 'Water Color',
      color: { alpha: true, type: 'float' },
    });

    folder?.addBinding(this.uniforms.waterDepthColor, 'value', {
      label: 'Water Depth Color', view: 'color',
      color: { alpha: true, type: 'float' },
    });
    folder?.addBinding(this.uniforms.foamColor, 'value', {
      label: 'Foam Color',
      view: 'color',
      color: { alpha: true, type: 'float' },
    });

  }
}
