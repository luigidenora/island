#include <fog_pars_vertex>

varying vec2 vUv;
varying vec2 vUvScreen;

void main() {
    vUv = uv;
    vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUvScreen = clipPos.xy / clipPos.w * 0.5 + 0.5; // screen UV da 0 a 1


    #include <begin_vertex>
    #include <project_vertex>
    #include <fog_vertex>
}
