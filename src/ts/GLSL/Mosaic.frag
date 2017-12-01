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

varying vec4 vPosition;
uniform sampler2D textureVelocity;
uniform sampler2D texturePosition;
varying vec2 vTuv;
varying mat4 vModelMatrix;
varying vec3 vNormal;
uniform mat4 uMatrix;
uniform float near;
uniform float far;
uniform vec3 cameraPos;
float fogStart = 0.1;
float fogEnd = 10.0;
varying float fogFactor;

vec3 calcIrradiance_dir(vec3 newNormal, vec3 lightPos, vec3 light){
    float dotNL = dot(newNormal, normalize(lightPos));

    return light * max(0.0, dotNL);
  }

vec3 calcIrradiance_hemi(vec3 newNormal, vec3 lightPos, vec3 grd, vec3 sky){
    float dotNL = dot(newNormal, normalize(lightPos));
    float hemiDiffuseWeight = 0.5 * dotNL + 0.5;

    return mix(grd, sky, hemiDiffuseWeight);
  }

const vec3 hemiLight_g = vec3(0.86,0.86,0.86);

// hemisphere sky color
const vec3 hemiLight_s_1 = vec3(0.5882352941176471,0.8274509803921568,0.8823529411764706);
const vec3 hemiLight_s_2 = vec3(0.9686274509803922,0.8509803921568627,0.6666666666666666);
const vec3 hemiLight_s_3 = vec3(0.8784313725490196,0.5882352941176471,0.7647058823529411);

const vec3 hemiLightPos_1 = vec3(100.0, 100.0, -100.0);
  const vec3 hemiLightPos_2 = vec3(-100.0, -100.0, 100.0);
  const vec3 hemiLightPos_3 = vec3(-100.0, 100.0, 100.0);
//uniform sampler2D map;
void main() {
    vec4 velTemp = texture2D( textureVelocity, vUv );
    vec4 posTemp = texture2D( texturePosition, vTuv );
    vec3 _normal = normalize(cross(dFdx(vPosition.xyz), dFdy(vPosition.xyz)));


    vec3 hemiColor = vec3(0.0);
    hemiColor += calcIrradiance_hemi(_normal, hemiLightPos_1, hemiLight_g, hemiLight_s_1) * 0.38;
    hemiColor += calcIrradiance_hemi(_normal, hemiLightPos_2, hemiLight_g, hemiLight_s_2) * 0.26;
    hemiColor += calcIrradiance_hemi(_normal, hemiLightPos_3, hemiLight_g, hemiLight_s_3) * 0.36;
    vec3 dirColor = vec3(0.0);
    dirColor += calcIrradiance_dir(_normal, vec3(0.,0.,1.), vec3(1.));
    float shadow = 1.0;
    shadow *= getShadow(shadowMap, shadowMapSize, bias, shadowRadius, vShadowCoord);



    dirColor.x = max(dirColor.x,0.8);
    dirColor.y = max(dirColor.y,0.8);
    dirColor.z = max(dirColor.z,0.8);

    vec3 color = vColor.xyz*dirColor;
    color = mix(vec3(0.,0.,0.),color,fogFactor);
    gl_FragColor = vec4(color,1.0);
}