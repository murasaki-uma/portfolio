varying vec4 vColor;
uniform sampler2D texture01;
varying vec2 vUv;
uniform float corner;
void main() {

    // 丸い形に色をぬるための計算
    vec3 color = texture2D(texture01,vUv).rgb;
    float f = length( gl_PointCoord - vec2( 0.5, 0.5 ) );
    if ( f > corner ) {
        discard;
    }
    gl_FragColor = vec4(color,1.);
}