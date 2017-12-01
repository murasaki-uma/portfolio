#define delta ( 1.0 / 60.0 )

uniform float threshold;
uniform float imgWidth;
uniform float imgHeight;
bool isPause = false;
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 pos = tmpPos.xyz;
    vec4 original = texture2D( textureOriginal, uv);
    vec4 tmpVel = texture2D( textureVelocity, uv );
    // velが移動する方向(もう一つ下のcomputeShaderVelocityを参照)
    vec3 vel = tmpVel.xyz;


    float distOrgPos = distance(original.xyz, vec3(0.,0.,0.));
    float distOrgTh = distance(vec3(imgWidth/2.*threshold,imgHeight/2.*threshold,0.0), vec3(0.,0.,0.));
    if(distOrgTh < distOrgPos)
    {
        pos += vel * delta;
    }


    // 移動する方向に速度を掛け合わせた数値を現在地に加える。

    gl_FragColor = vec4( pos, 1.0 );
}