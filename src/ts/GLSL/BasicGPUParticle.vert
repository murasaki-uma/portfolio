#include <common>
uniform sampler2D texturePosition;
uniform sampler2D textureAnimationValues01;
uniform float cameraConstant;
uniform float density;
varying vec4 vColor;
varying vec2 vUv;
uniform float radius;
uniform float pointSize;


mat3 rotateX(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, s,
        0.0, -s, c
    );
}


void main() {
    vec4 posTemp = texture2D( texturePosition, uv );
    vec4 anmTemp = texture2D( textureAnimationValues01, uv );
    vec3 pos = posTemp.xyz;
    vColor = vec4( 1.0, 0.7, 1.0, 1.0 );

    // ポイントのサイズを決定
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_PointSize = 1.5*anmTemp.y * cameraConstant / ( - mvPosition.z );

    // uv情報の引き渡し
    vUv = uv;

    // 変換して格納
    gl_Position = projectionMatrix * mvPosition;
}