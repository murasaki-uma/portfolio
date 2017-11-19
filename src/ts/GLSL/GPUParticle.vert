 uniform sampler2D texturePosition;
uniform float cameraConstant;
uniform float density;
varying vec4 vColor;
varying vec2 vPosition;
varying vec2 vUv;
uniform float radius;
uniform float pointSize;


void main() {
    vec4 posTemp = texture2D( texturePosition, uv );
    vec3 pos = posTemp.xyz;
    vColor = vec4( 1.0, 0.7, 1.0, 1.0 );

    // ポイントのサイズを決定
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = 0.3 * cameraConstant / ( - mvPosition.z );

    // uv情報の引き渡し
    vPosition = position.xy;
    vUv = uv;

    // 変換して格納
    gl_Position = projectionMatrix * mvPosition;
}