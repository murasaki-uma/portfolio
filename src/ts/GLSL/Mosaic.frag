precision highp float;
uniform sampler2D map;
varying vec2 vUv;
varying vec3 vColor;

varying vec4 vShadowCoord;
uniform sampler2D shadowMap;
uniform vec2 shadowMapSize;
uniform float shadowBias;
uniform float shadowRadius;
uniform float bias;

const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

float unpackRGBAToDepth( const in vec4 v ) {
  return dot( v, UnpackFactors );
}

float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
  return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
}

float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

  float shadow = 1.0;

  shadowCoord.xyz /= shadowCoord.w;
  shadowCoord.z += shadowBias;

  // if ( something && something ) breaks ATI OpenGL shader compiler
  // if ( all( something, something ) ) using this instead

  bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
  bool inFrustum = all( inFrustumVec );

  bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
  bool frustumTest = all( frustumTestVec );

  if ( frustumTest ) {

    vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

    float dx0 = - texelSize.x * shadowRadius;
    float dy0 = - texelSize.y * shadowRadius;
    float dx1 = + texelSize.x * shadowRadius;
    float dy1 = + texelSize.y * shadowRadius;

    shadow = (
      texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
      texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
      texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
      texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
      texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
      texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
      texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
      texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
      texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
    ) * ( 1.0 / 9.0 );
  }

  return shadow;
}
mat4 inverse(mat4 m) {
  float
      a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
      a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
      a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
      a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

      b00 = a00 * a11 - a01 * a10,
      b01 = a00 * a12 - a02 * a10,
      b02 = a00 * a13 - a03 * a10,
      b03 = a01 * a12 - a02 * a11,
      b04 = a01 * a13 - a03 * a11,
      b05 = a02 * a13 - a03 * a12,
      b06 = a20 * a31 - a21 * a30,
      b07 = a20 * a32 - a22 * a30,
      b08 = a20 * a33 - a23 * a30,
      b09 = a21 * a32 - a22 * a31,
      b10 = a21 * a33 - a23 * a31,
      b11 = a22 * a33 - a23 * a32,

      det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat4(
      a11 * b11 - a12 * b10 + a13 * b09,
      a02 * b10 - a01 * b11 - a03 * b09,
      a31 * b05 - a32 * b04 + a33 * b03,
      a22 * b04 - a21 * b05 - a23 * b03,
      a12 * b08 - a10 * b11 - a13 * b07,
      a00 * b11 - a02 * b08 + a03 * b07,
      a32 * b02 - a30 * b05 - a33 * b01,
      a20 * b05 - a22 * b02 + a23 * b01,
      a10 * b10 - a11 * b08 + a13 * b06,
      a01 * b08 - a00 * b10 - a03 * b06,
      a30 * b04 - a31 * b02 + a33 * b00,
      a21 * b02 - a20 * b04 - a23 * b00,
      a11 * b07 - a10 * b09 - a12 * b06,
      a00 * b09 - a01 * b07 + a02 * b06,
      a31 * b01 - a30 * b03 - a32 * b00,
      a20 * b03 - a21 * b01 + a22 * b00) / det;
}

varying vec4 vPosition;
uniform sampler2D textureVelocity;
uniform sampler2D texturePosition;
varying vec2 vTuv;
varying mat4 vModelMatrix;
varying vec3 vNormal;
uniform mat4 uMatrix;
//uniform sampler2D map;
void main() {
vec4 velTemp = texture2D( textureVelocity, vUv );
vec4 posTemp = texture2D( texturePosition, vTuv );
//    gl_FragColor = texture2D( map, vUv );
//vec3 fdx = dFdx( vPosition );
//  vec3 fdy = dFdy( vPosition );
//  vec3 n = normalize(cross(fdx, fdy));
//
//  float diffuse = max(0.0, dot(n, normalize(lightPosition)));
//
//  float theta = clamp( -diffuse, 0., 1. );
//  float bias = 0.005 * tan( acos( theta ) );
//  bias = clamp( bias, 0., 0.01 );

//    vec3 color = normalize(velTemp.xyz);
    float shadow = 1.0;
    shadow *= getShadow(shadowMap, shadowMapSize, bias, shadowRadius, vShadowCoord);


    float fog = 1.0;
//    if(vPosition.z < 0.0)
//    {
        fog =1.0+clamp(posTemp.z,-50.,0.)/50.;
//    }



    gl_FragColor = vec4(vColor.xyz,1.0);
}