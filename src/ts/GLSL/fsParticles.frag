varying vec3 vPosition;
varying vec3 vColor;

varying vec4 vShadowCoord;
uniform sampler2D shadowMap;
uniform vec2 shadowMapSize;
uniform float shadowBias;
uniform float shadowRadius;

// uniform sampler2D projector;

uniform vec3 lightPosition;

uniform vec2 resolution;

float bias;


// via: https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/packing.glsl
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

mat2 rotationMatrix( float a ) {
  return mat2( cos( a ), sin( a ),
          -sin( a ), cos( a ) );
}


vec3 calcIrradiance_hemi(vec3 newNormal, vec3 lightPos, vec3 grd, vec3 sky){
  float dotNL = dot(newNormal, normalize(lightPos));
  float hemiDiffuseWeight = 0.5 * dotNL + 0.5;

  return mix(grd, sky, hemiDiffuseWeight);
}

vec3 calcIrradiance_dir(vec3 newNormal, vec3 lightPos, vec3 light){
  float dotNL = dot(newNormal, normalize(lightPos));

  return light * max(0.0, dotNL);
}


const float PI = 3.14159265358979323846264;

// hemisphere ground color
const vec3 hemiLight_g = vec3(256.0, 246.0, 191.0) / vec3(256.0);

// hemisphere sky color
const vec3 hemiLight_s_1 = vec3(0.5882352941176471,0.8274509803921568,0.8823529411764706);
const vec3 hemiLight_s_2 = vec3(0.9686274509803922,0.8509803921568627,0.6666666666666666);
const vec3 hemiLight_s_3 = vec3(0.8784313725490196,0.5882352941176471,0.7647058823529411);

// directional light color
const vec3 dirLight = vec3(0.4);
const vec3 dirLight_2 = vec3(0.1);





const vec3 hemiLightPos_1 = vec3(1.0, 1.0, -1.0);
const vec3 hemiLightPos_2 = vec3(-1.0, -1.0, 1.0);
const vec3 hemiLightPos_3 = vec3(-1.0, 1.0, 1.0);

void main() {
  vec3 fdx = dFdx( vPosition );
  vec3 fdy = dFdy( vPosition );
  vec3 n = normalize(cross(fdx, fdy));

  float diffuse = max(0.0, dot(n, normalize(lightPosition)));

  float theta = clamp( -diffuse, 0., 1. );
  bias = 0.005 * tan( acos( theta ) );
  bias = clamp( bias, 0., 0.01 );

  // shadow gradient
  // float mask = sqrt(pow((vShadowCoord.x - 0.5) * 2.0, 2.0) + pow((vShadowCoord.y - 0.5) * 2.0, 2.0));

  // mask = 1.0 - smoothstep(0.5, 1.0, mask);

  vec3 hemiColor = vec3(0.0);
  hemiColor += calcIrradiance_hemi(n, hemiLightPos_1, hemiLight_g, hemiLight_s_1) * 0.43;
  hemiColor += calcIrradiance_hemi(n, hemiLightPos_2, hemiLight_g, hemiLight_s_2) * 0.33;
  hemiColor += calcIrradiance_hemi(n, hemiLightPos_3, hemiLight_g, hemiLight_s_3) * 0.38;

  vec3 dirColor = vec3(0.0);
  dirColor += calcIrradiance_dir(n, lightPosition, dirLight);

  vec3 dirLightPos2 = vec3(-lightPosition.x, -lightPosition.y, -lightPosition.z);
  dirColor += calcIrradiance_dir(n, dirLightvyPos2, dirLight_2);


  float shadow = 1.0;
  shadow *= getShadow(shadowMap, shadowMapSize, bias, shadowRadius, vShadowCoord);

  vec3 color = vColor * hemiColor;
  color += dirColor * shadow;


  gl_FragColor = vec4(color, 0.0);
}
