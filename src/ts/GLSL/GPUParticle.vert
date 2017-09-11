uniform sampler2D texturePosition;
uniform sampler2D textureAnimation;
uniform float cameraConstant;
uniform float density;
varying vec4 vColor;
varying vec2 vUv;
uniform float radius;
varying vec3 vPos;
uniform float texImgWidth;
uniform float texImgHeight;
uniform vec3 translatePos;
uniform vec3 scenePos;
void main() {
    vec4 posTemp = texture2D( texturePosition, uv );
    vec4 anmTemp = texture2D( textureAnimation, uv );
    vec3 pos = posTemp.xyz;

    vUv = vec2(pos.x/texImgWidth+0.5,anmTemp.z/-texImgHeight+0.5);
//    pos += translatePos;
    vColor = vec4( 1.0, 0.7, 1.0, 1.0 );

    // ポイントのサイズを決定
    vec4 mvPosition = modelViewMatrix * vec4( pos+scenePos, 1.0 );
    gl_PointSize = 2.0 * cameraConstant / ( - mvPosition.z );

    // uv情報の引き渡し

    vPos = pos.xyz;
    // 変換して格納
    gl_Position = projectionMatrix * mvPosition;
}