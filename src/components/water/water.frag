
#include <common>
#include <packing>
#include <fog_pars_fragment>

varying vec2 vUv;
uniform sampler2D tDepth;
uniform sampler2D tRender;
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
    return unpackRGBAToDepth(texture2D(tRender, screenPosition));
    #else
    return texture2D(tRender, screenPosition).x;
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
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
    return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

const float strength = 1.0;

float linearizeDepth(float z) {
    float n = cameraNear;
    float f = cameraFar;
    return (2.0 * n) / (f + n - z * (f - n));
}

void main() {
    vec2 screenUV = gl_FragCoord.xy / resolution;

    float fragmentLinearEyeDepth = getViewZ(gl_FragCoord.z);
    float linearDepth = getViewZ(getDepth(screenUV));

    float diff = saturate(fragmentLinearEyeDepth - linearDepth);

    float depth = readDepth(tDepth, screenUV);
    float gray = linearizeDepth(depth);

    float smoothGradient = smoothstep(smoothstepStart, smoothstepEnd,  gray);

    vec2 displacement = texture2D(tDudv, (vUv * textureFoamSize) - time * 0.05).rg;
    displacement = ((displacement * 2.0) - 1.0) * strength;
    diff += displacement.x;

    float depthcolor = saturate(diff - smoothGradient);

    vec3 waterGradient = mix(waterColor, waterDepthColor, depthcolor);

    gl_FragColor.rgb = mix(foamColor, waterGradient, step(threshold, diff));
    gl_FragColor.a = saturate(fragmentLinearEyeDepth - linearDepth + 0.5);

    // gl_FragColor.a = smoothstep(0.0, 1, depthcolor);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
}
