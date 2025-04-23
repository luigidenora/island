#include <common>
#include <packing>
#include <fog_pars_fragment>

varying vec2 vUv;
uniform sampler2D tDepth;
uniform sampler2D tDudv;
uniform vec3 waterColor;
uniform vec3 waterDepthColor;
uniform vec3 foamColor;
uniform float cameraNear;
uniform float cameraFar;
uniform float time;
uniform float threshold;
uniform float cutoff;
uniform vec2 resolution;

float getViewZ(const in float depth) {
    #if ORTHOGRAPHIC_CAMERA == 1
    return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
    #else
    return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
    #endif
}

float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = getViewZ(fragCoordZ);
    return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

float easeInOutCubic(float t) {
    return t < 0.5
        ? 4.0 * t * t * t
        : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}
float easeInCubic(float t) {
    return t * t * t;
}
float easeInOutQuart(float t) {
    return t < 0.5
        ? 8.0 * t * t * t * t
        : 1.0 - pow(-2.0 * t + 2.0, 4.0) / 2.0;
}
void main() {
    vec2 screenUV = gl_FragCoord.xy / resolution;

    float linearEyeDepth = readDepth(tDepth, screenUV);

    float t = clamp(linearEyeDepth, 0.0, cutoff) / cutoff;


    vec3 color = mix(waterColor,waterDepthColor, t);

    gl_FragColor.rgb = color;
    gl_FragColor.a = 1.0;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
}
