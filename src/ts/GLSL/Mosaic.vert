precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
attribute vec3 position;
attribute vec3 normal;
attribute vec3 offset;

attribute vec2 uv;
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
uniform sampler2D textureQuaternion;
varying vec4 vPosition;
varying vec3 vColor;
varying vec3 vNormal;
uniform mat4 uMatrix;
varying mat4 vModelMatrix;





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


void main() {
    vPosition = vec4(position.xyz,1.);
    vec4 posTemp = texture2D( texturePosition, pos_uv );
    vec4 velTemp = texture2D( textureVelocity, pos_uv );
    vec4 orgTemp = texture2D( textureQuaternion, pos_uv );

//    float scale = 1.0 - velTemp.w/100.0;

    float scale = 1.0 - distance(posTemp.xyz,orgTemp.xyz)/20.;
    scale = sin(scale*PI)*2.0;
//    scale= 1.0;

    vTuv = pos_uv;

    vec4 qt = texture2D( textureQuaternion, pos_uv );
    mat4 localRotationMat = mat4( calcLookAtMatrix( velTemp.xyz, 0.0 ) );


    vec2 tUv =vec2( posTemp.x/100.+0.5,posTemp.y/150.+0.5);
    float fog = 1.0+clamp(posTemp.z,-10.,0.)/10./2.;
    vNormal = normal*calcLookAtMatrix( velTemp.xyz, 0.0 );
    vec3  invLight = normalize(uMatrix * vec4(vec3(0.,0.,1.), 0.0)).xyz;
   float diffuse  = clamp(dot(vNormal, invLight), 0.6, 1.0);
    vColor = texture2D( map, tUv ).xyz*vec3(diffuse);


    vec3 modifiedVertex =  (localRotationMat * vec4( position*vec3(0.15,1.5,0.15)*scale,1.0 )).xyz;
    vec3 modifiedPosition = modifiedVertex + posTemp.xyz;
    vPosition =  vec4( modifiedPosition, 1.0 );
    vShadowCoord = shadowMatrix * modelMatrix * vec4( vPosition.xyz, 1. );

    gl_Position = projectionMatrix * modelViewMatrix * vec4( modifiedPosition, 1.0 );
}
