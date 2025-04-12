import fragmentShader from "./water.frag?raw";
import vertexShader from "./water.vert?raw";
import { Color, PerspectiveCamera, ShaderMaterial, TextureLoader, UniformsLib, UniformsUtils, Vector2, WebGLRenderer, WebGLRenderTarget } from "three";

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

  constructor({camera, renderer, renderTarget}:{camera: PerspectiveCamera, renderer:WebGLRenderer, renderTarget:WebGLRenderTarget}) {
    const _supportsDepthTextureExtension = true;//renderer.extensions.get('WEBGL_depth_texture');
    const _pixelRatio = (window.innerWidth/window.innerHeight); //renderer.extensions.get('WEBGL_depth_texture');
    // TODO: move in loader ? 
    var loader = new TextureLoader();
    const dudvMap = loader.load("https://i.imgur.com/hOIsXiZ.png");
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

}
