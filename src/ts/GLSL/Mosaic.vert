precision highp float;

attribute vec3 offset;

attribute vec2 pos_uv;
attribute vec4 orientation;
varying vec2 vUv;
varying vec2 vTuv;
uniform sampler2D map;
uniform mat4 shadowMatrix;
varying vec4 vShadowCoord;
uniform sampler2D shadowMap;
uniform vec2 shadowMapSize;
uniform float shadowBias;
uniform float shadowRadius;


uniform float time;
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform sampler2D textureOriginal;
varying vec4 vPosition;
varying vec3 vColor;
varying vec3 vNormal;
uniform mat4 uMatrix;
varying mat4 vModelMatrix;

uniform float imgWidth;
uniform float imgHeight;



mat3 calcLookAtMatrix(vec3 vector, float roll) {
  vec3 rr = vec3(sin(roll), cos(roll), 0.0);
  vec3 ww = normalize(vector);
  vec3 uu = normalize(cross(ww, rr));
  vec3 vv = normalize(cross(uu, ww));

  return mat3(uu, ww, vv);
}

const float DEG_TO_RAD = 3.141592653589793 / 180.0;
mat2 rotationMatrix( float a ) {
  return mat2( cos( a ), sin( a ),
          -sin( a ), cos( a ) );
}

const float PI = 3.141592653589793;
uniform float near;
uniform float far;
uniform vec3 cameraPos;
float fogStart = 0.1;
float fogEnd = 30.0;
varying float fogFactor;
uniform float isStart;

  mat2 calcRotate2D(float _time){
    float _sin = sin(_time);
    float _cos = cos(_time);
    return mat2(_cos, _sin, -_sin, _cos);
  }



void main() {
    vPosition = vec4(position.xyz,1.);
    vec4 posTemp = texture2D( texturePosition, pos_uv );
    vec4 velTemp = texture2D( textureVelocity, pos_uv );
    vec4 orgTemp = texture2D( textureOriginal, pos_uv );

//    float scale = 1.0 - velTemp.w/100.0;

    float scale = 1.0 - distance(posTemp.xyz,orgTemp.xyz)/20.;
    scale = sin(scale*PI)*1.0;
//    scale = mix(sin(scale*PI)*1.2,1.0,isStart);

//    scale= 1.0;

    vTuv = pos_uv;

    mat4 localRotationMat = mat4( calcLookAtMatrix( velTemp.xyz, 0.0 ) );


    vec2 tUv =vec2( posTemp.x/imgWidth+0.5,posTemp.y/imgHeight+0.5);

    vColor = texture2D( map, tUv ).xyz;







    vec3 modifiedVertex =  (localRotationMat * vec4( position*vec3(0.1,1.3,0.1)*scale,1.0 )).xyz;
    vec3 modifiedPosition = modifiedVertex + posTemp.xyz;

    modifiedPosition.yz = calcRotate2D(time) * modifiedPosition.yz;
    modifiedPosition.xz = calcRotate2D(time) * modifiedPosition.xz;

    float linerDepth = 1.0 / (30.0 - 0.01);
    float linerPos = length(cameraPos - modifiedPosition.xyz) * linerDepth;
    fogFactor      = clamp((fogEnd - linerPos) / (fogEnd - fogStart), 0.0, 1.0);

    vPosition =  vec4( modifiedPosition, 1.0 );
    vShadowCoord = shadowMatrix * modelMatrix * vec4( vPosition.xyz, 1. );

    gl_Position = projectionMatrix * modelViewMatrix * vec4( modifiedPosition, 1.0 );

}
