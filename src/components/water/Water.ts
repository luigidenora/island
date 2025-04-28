import { DEBUG } from "../../config/debug";
import fragmentShader from "./water.frag?raw";
import vertexShader from "./water.vert?raw";
import { Color, PerspectiveCamera, RepeatWrapping, ShaderMaterial, TextureLoader, UniformsLib, UniformsUtils, Vector2, WebGLRenderer, WebGLRenderTarget } from "three";

var waterUniforms = {
  time: {
    value: 0
  },
  threshold: {
    value: 0.33
  },
  smoothstepStart: {
    value: 0.0  
  },
  smoothstepEnd: {
    value: 0.1
  },
  textureFoamSize: {
    value: 15.0
  },
  tDudv: {
    value: null
  },
  tDepth: {
    value: null
  },
  tRender: {
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
  private _supportsDepthTextureExtension: boolean;

  private camera: PerspectiveCamera;

  constructor({ camera, renderTarget, renderer }: { camera: PerspectiveCamera, renderTarget: WebGLRenderTarget, renderer: WebGLRenderer }) {
    const _supportsDepthTextureExtension = renderer.extensions.get("WEBGL_depth_texture");
    const _pixelRatio = window.devicePixelRatio;
    // TODO: move in loader ? 
    const dudvMap = new TextureLoader().load(
      "https://i.imgur.com/hOIsXiZ.png"
    );
    dudvMap.wrapS = dudvMap.wrapT = RepeatWrapping;
    dudvMap.repeat.set(10, 10);

    super({
      defines: {
        DEPTH_PACKING: _supportsDepthTextureExtension === true ? 0 : 1,
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
    this._supportsDepthTextureExtension = _supportsDepthTextureExtension;
    this.camera = camera;
    this._setupTweakpane();

    this.uniforms.cameraNear.value = camera.near;
    this.uniforms.cameraFar.value = camera.far;
    this.uniforms.resolution.value.set(
      window.innerWidth * _pixelRatio,
      window.innerHeight * _pixelRatio
    );
    this.uniforms.tDudv.value = dudvMap;
    this.uniforms.tDepth.value = renderTarget.depthTexture;
    this.uniforms.tRender.value = renderTarget.texture;
    
  }

  public update(time: number) {
    this.uniforms.time.value = time / 2;
    this.uniforms.cameraNear.value = this.camera.near;
    this.uniforms.cameraFar.value = this.camera.far;
  }


  private _setupTweakpane() {
    const folder = DEBUG?.addFolder({ title: 'Water Material', expanded: false });

    folder?.addBinding(this.uniforms.threshold, 'value', {
      label: 'Threshold',
      min: -1,
      max: 1,
      step: 0.01
    });

    folder?.addBinding(this.uniforms.textureFoamSize, 'value', {
      label: 'textureFoamSize',
      min: -100,
      max: 100,
      step: 1
    });

    folder?.addBinding(this.uniforms.smoothstepStart, 'value', {
      label: 'Depth smoothstepStart',
      min: 0,
      max: 1,
      step: 0.01
    });
    folder?.addBinding(this.uniforms.smoothstepEnd, 'value', {
      label: 'Depth smoothstepEnd',
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
