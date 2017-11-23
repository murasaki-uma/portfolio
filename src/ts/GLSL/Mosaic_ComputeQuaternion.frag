#include <common>
uniform sampler2D pre_texturePosition;


void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 q = texture2D( textureQuaternion, uv );
//    vec4 prePos = texture2D( pre_texturePosition, uv );
//    vec4 pos = texture2D( texturePosition, uv );
//    vec3 nPos = normalize(pos.xyz);
//    vec3 nPrePos = normalize(prePos.xyz);
//    float w = dot(pos.xyz,prePos.xyz);
//    vec3 v = pos.xyz * prePos.xyz / distance(pos.xyz,nPos.xyz);

    gl_FragColor = q;
}