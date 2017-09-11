uniform vec3 translatePos;
uniform float texImgWidth;
uniform float texImgHeight;
uniform float threshold;
uniform int galleryCount;
uniform bool isReset;
float exponentialInOut(float t) {
  return t == 0.0 || t == 1.0
    ? t
    : t < 0.5
      ? +0.5 * pow(2.0, (20.0 * t) - 10.0)
      : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
}

float exponentialOut(float t) {
  return t == 1.0 ? t : 1.0 - pow(2.0, -10.0 * t);
}


void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 anmPos = texture2D( textureAnimation, uv );
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 pos = tmpPos.xyz;

    if(isReset)
    {
        anmPos.w = 0.0;
        anmPos.y = 0.0;
    }

    if(threshold*texImgHeight - texImgHeight/2.0 > anmPos.x)
    {
        if(anmPos.w <= 1.0)
        {
            anmPos.w += 0.01;
            anmPos.y = exponentialOut(anmPos.w);
        }

    }

    gl_FragColor = vec4(anmPos);
}