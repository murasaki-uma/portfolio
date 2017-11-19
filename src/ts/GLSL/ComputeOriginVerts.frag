//uniform float texImgWidth;
//uniform float texImgHeight;
//uniform float threshold;
//uniform bool isReset;
void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpOriginVerts = texture2D( textureOrgnlPosition, uv );
//    vec4 anmPos = texture2D( textureAnimation, uv );
//
//
//    if(isReset)
//    {
//        tmpOriginVerts.w = 0.0;
//
//    }
//
//    if(threshold*texImgHeight - texImgHeight/2.0 > tmpOriginVerts.y)
//    {
//
//        tmpOriginVerts.w = anmPos.w;
//
//    }

    gl_FragColor = vec4(tmpOriginVerts);

}
