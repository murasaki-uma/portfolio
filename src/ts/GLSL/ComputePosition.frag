 #define delta ( 1.0 / 60.0 )
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 pos = tmpPos.xyz;
    vec4 tmpOriginVerts = texture2D( textureOrgnlPosition, uv );
    vec4 tmpVel = texture2D( textureVelocity, uv );
    // velが移動する方向(もう一つ下のcomputeShaderVelocityを参照)
    vec3 vel = tmpVel.xyz;

    tmpPos.xyz += tmpVel.xyz*0.1;
//    tmpPos.w -=0.001;
    if(distance(tmpOriginVerts.xyz,tmpPos.xyz)>20.0)
    {
        tmpPos.xyz = tmpOriginVerts.xyz;
        tmpPos.w = 1.0;

    }

    // 移動する方向に速度を掛け合わせた数値を現在地に加える。

    gl_FragColor = tmpPos;
}