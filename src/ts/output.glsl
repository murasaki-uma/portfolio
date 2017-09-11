#define GLSLIFY 1
uniform vec2 resolution; // 描画サイズ

void main(){
    gl_FragColor = vec4(vec3(random(gl_FragCoord.xy / resolution.xy)), 1.0 );
}