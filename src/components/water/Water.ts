import { DEBUG } from "../../config/debug";
import fragmentShader from "./water.frag?raw";
import vertexShader from "./water.vert?raw";
import { Color, PerspectiveCamera, RepeatWrapping, ShaderMaterial, TextureLoader, UniformsLib, UniformsUtils, Vector2, WebGLRenderTarget } from "three";

var waterUniforms = {
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
    value: new Vector2()
  },
  foamColor: {
    value: new Color(0xffffff)
  },
  waterColor: {
    value: new Color(0x14c6a5)
  }
};


export class WaterMaterial extends ShaderMaterial {

  constructor({camera, renderTarget}:{camera: PerspectiveCamera, renderTarget:WebGLRenderTarget}) {
    const _supportsDepthTextureExtension = true;
    const _pixelRatio = window.devicePixelRatio; 
    // TODO: move in loader ? 
    const dudvMap = new TextureLoader().load(
      "https://i.imgur.com/hOIsXiZ.png"
    );
    dudvMap.wrapS = dudvMap.wrapT = RepeatWrapping;

      super({
      defines: {
        DEPTH_PACKING: (_supportsDepthTextureExtension ?? true ) === true ? 0 : 1,
        ORTHOGRAPHIC_CAMERA: 0
      },
      uniforms: UniformsUtils.merge([
        UniformsLib["fog"],
        waterUniforms
      ]),
      vertexShader,
      fragmentShader,
      fog: true
    });

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
    this.uniforms.time.value = time * 0.01;
  }


  private _setupTweakpane() {
    const folder = DEBUG?.addFolder({ title: 'Water Material' });

    folder?.addBinding(this.uniforms.threshold, 'value', {
      label: 'Threshold',
      min: -2,
      max: 2,
      step: 0.01
    });

    // color 
    folder?.addBinding(this.uniforms.waterColor, 'value', {
      label: 'Water Color',
    });
    folder?.addBinding(this.uniforms.foamColor, 'value', {
      label: 'Foam Color',
    });
 
  }
}
