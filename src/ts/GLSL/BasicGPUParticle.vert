#include <common>
uniform sampler2D texturePosition;
uniform sampler2D textureAnimationValues01;
uniform sampler2D textureOriginal;
uniform float cameraConstant;
uniform float density;
varying vec4 vColor;
varying vec2 vUv;
uniform float radius;
uniform float pointSize;
varying float vDist;


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
    vec4 originalTemp = texture2D( textureOriginal, uv );
    vec3 pos = posTemp.xyz;
    vColor = vec4( 1.0, 0.7, 1.0, 1.0 );

    float d = distance(pos,  originalTemp.xyz);

    if(anmTemp.y == 0.0)
    {
        if(d < 20.0)
        {
            vDist = 1.0 - d/20.0;
        }
    } else
    {
        vDist =  sin(d/20.0*PI);
    }


    // ポイントのサイズを決定
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_PointSize = 1.5 * cameraConstant / ( - mvPosition.z );

    // uv情報の引き渡し
    vUv = uv;

    // 変換して格納
    gl_Position = projectionMatrix * mvPosition;
}