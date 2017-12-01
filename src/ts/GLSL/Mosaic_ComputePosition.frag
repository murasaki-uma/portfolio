#define delta 0.08
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 pos = tmpPos.xyz;
    vec4 tmpVel = texture2D( textureVelocity, uv );
    vec4 tmpOrgPos = texture2D( textureOriginal, uv );
    // velが移動する方向(もう一つ下のcomputeShaderVelocityを参照)
    vec3 vel = tmpVel.xyz;
//    vel.z *= 0.5;
//    vel.z * 0.0;

    // 移動する方向に速度を掛け合わせた数値を現在地に加える。
    pos += vel * delta;
//    if(tmpVel.w == 100.)
    if(distance(pos,tmpOrgPos.xyz) > 20.)
    {
        pos = tmpOrgPos.xyz;
    }
    gl_FragColor = vec4( pos, 1.0 );
}