
#include <common>
#include <packing>
#include <fog_pars_fragment>

varying vec2 vUv;
uniform sampler2D tDepth;
uniform sampler2D tDudv;
uniform vec3 waterColor;
uniform vec3 foamColor;
uniform float textureFoamSize;
uniform vec3 waterDepthColor;
uniform float cameraNear;
uniform float cameraFar;
uniform float time;
uniform float threshold;
uniform float smoothstepStart;
uniform float smoothstepEnd;
uniform vec2 resolution;

float getDepth(const in vec2 screenPosition) {
    #if DEPTH_PACKING == 1
    return unpackRGBAToDepth(texture2D(tDepth, screenPosition));
    #else
    return texture2D(tDepth, screenPosition).x;
    #endif
}

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
    return viewZToOrthographicDepth(viewZ, cameraNear + threshold, cameraFar);
}

const float strength = 1.0;

void main() {
    vec2 screenUV = gl_FragCoord.xy / resolution;

    float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
    float linearDepth = getViewZ(getDepth(screenUV));

    float linearEyeDepth = readDepth(tDepth, screenUV);


    float diff = saturate(fragmentLinearEyeDepth - linearDepth);

    float diffDepth = saturate(fragmentLinearEyeDepth - linearEyeDepth);

    float smoothGradient = smoothstep(smoothstepStart, smoothstepEnd, diffDepth);
    vec3 gradient = mix(waterColor, waterDepthColor, smoothGradient);

    vec2 displacement = texture2D(tDudv, (vUv * textureFoamSize) - time * 0.05).rg;
    displacement = ((displacement * 2.0) - 1.0) * strength;
    diff += displacement.x;

    gl_FragColor.rgb = mix(foamColor, gradient, step(threshold, diff));
    gl_FragColor.a = 1.0;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
}
