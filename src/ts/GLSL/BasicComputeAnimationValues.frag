
uniform float threshold;
uniform float imgWidth;
uniform float imgHeight;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpOriginVerts = texture2D( textureAnimationValues, uv );

    gl_FragColor = vec4(tmpOriginVerts);

}
