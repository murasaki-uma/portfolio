varying vec4 vColor;
uniform sampler2D texture01;
uniform sampler2D textureAnimationValues01;
varying float vDist;
varying vec2 vUv;
uniform float corner;
void main() {

    // 丸い形に色をぬるための計算
    vec3 color = texture2D(texture01,vUv).rgb;
    vec4 animationValues01 = texture2D(textureAnimationValues01,vUv);
    float f = length( gl_PointCoord - vec2( 0.5, 0.5 ) );
    if ( f > animationValues01.x * vDist ) {
        discard;
    }
    gl_FragColor = vec4(color,1.);
}