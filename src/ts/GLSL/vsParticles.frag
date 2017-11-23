
attribute float aNum;
attribute float aRandom;
// attribute vec2 aPosUv

attribute vec3 aColor;


uniform sampler2D posMap;
uniform sampler2D velMap;

uniform float size;

uniform float timer;
uniform vec3 boxScale;
uniform float meshScale;

uniform mat4 shadowMatrix;

varying vec3 vPosition;
varying vec3 vColor;

varying vec4 vShadowCoord;


mat3 calcLookAtMatrix(vec3 vector, float roll) {
  vec3 rr = vec3(sin(roll), cos(roll), 0.0);
  vec3 ww = normalize(vector);
  vec3 uu = normalize(cross(ww, rr));
  vec3 vv = normalize(cross(uu, ww));

  return mat3(uu, ww, vv);
}

void main() {
  vec2 posUv;
  posUv.x = mod(aNum, (size - 1.0));
  posUv.y = float(aNum / (size - 1.0));
  posUv /= vec2(size);
  vec4 cubePosition = texture2D( posMap, posUv );
  vec4 cubeVelocity = texture2D( velMap, posUv );
  float alpha = cubeVelocity.a / 100.0;
  float scale = 0.025 * 4.0 * (1.0 - alpha) * alpha;

  mat4 localRotationMat = mat4( calcLookAtMatrix( cubeVelocity.xyz, 0.0 ) );

//  vec3 modifiedVertex =  (localRotationMat * vec4( position * scale * aRandom * (vec3(1.0))  * boxScale * meshScale, 1.0 ) ).xyz;
vec3 modifiedVertex =  (localRotationMat * vec4( position * scale  * (vec3(1.0))  * boxScale , 1.0 ) ).xyz;
  vec3 modifiedPosition = modifiedVertex + cubePosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( modifiedPosition, 1.0 );
  vPosition = modifiedPosition;

  // via: line 7 in https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/shadowmap_vertex.glsl
  vShadowCoord = shadowMatrix * modelMatrix * vec4( modifiedPosition, 1. );

  vColor = aColor;
}