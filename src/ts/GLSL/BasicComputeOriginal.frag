
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpOriginVerts = texture2D( textureOriginal, uv );

    gl_FragColor = vec4(tmpOriginVerts);

}
