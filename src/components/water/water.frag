#include <common>
#include <packing>
#include <fog_pars_fragment>

varying vec2 vUv;
varying vec2 vUvScreen;
uniform sampler2D tDepth;
uniform sampler2D tDudv;
uniform vec3 waterColor;
uniform vec3 waterDepthColor;
uniform vec3 foamColor;
uniform float cameraNear;
uniform float cameraFar;
uniform float time;
uniform float threshold;
uniform float smoothstepStart;
uniform float smoothstepEnd;
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
const float strength = 1.0;

void main() {
    vec2 screenUV = gl_FragCoord.xy / resolution;

    float fragmentLinearEyeDepth = gl_FragCoord.z;
    float linearEyeDepth = texture2D(tDepth, screenUV).r;
 // float linearEyeDepth = readDepth(tDepth, screenUV);
    float diff = abs(fragmentLinearEyeDepth - linearEyeDepth);

     float t = smoothstep(smoothstepStart, smoothstepEnd, diff * 100.0);
     // float t = smoothstep(0.1, 0.26, linearEyeDepth);
    vec3 gradient = mix(waterColor, waterDepthColor, t);

    vec2 displacement = texture2D(tDudv, (vUv * 20.0) - time * 0.05).rg;
    displacement = ((displacement * 4.0) - 1.0) * strength;
    t += displacement.x;

    gl_FragColor.rgb = mix(foamColor, gradient, step(threshold,t));
    // gl_FragColor.rgb = gradient;
    gl_FragColor.a = 1.0;

    // vec2 screenUV = gl_FragCoord.xy / resolution;
    //
    // // Depth del fondo
    // // float linearEyeDepth = readDepth(tDepth, screenUV);
    // float linearEyeDepth = texture2D(tDepth, screenUV).x;
    //
    // // Depth della superficie dell’acqua (il frammento corrente)
    // float surfaceFragDepth = gl_FragCoord.z;
    // // Differenza = quanto profonda è l’acqua qui
    // float diff = saturate(linearEyeDepth - surfaceFragDepth);
    //
    // vec2 displacement = texture2D(tDudv, (vUv * 2.0) - time * 0.05).rg;
    // displacement = ((displacement * 2.0) - 1.0) * strength;
    // diff += displacement.x;
    //
    // // Usa smoothstep per colorare in base alla profondità dell’acqua
    // float t = smoothstep(0.0, 0.26, step(threshold, diff) * 100.0);
    // // float t = smoothstep(smoothstepStart, smoothstepEnd, linearEyeDepth);
    //
    // gl_FragColor.rgb = color;
    // gl_FragColor.a = 1.0;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
}
