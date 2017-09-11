varying vec4 vColor;
varying vec3 vPos;
varying vec2 vUv;
uniform sampler2D textureAnimation;
uniform sampler2D map;
void main() {
    vec4 anmTemp = texture2D( textureAnimation, vUv );
    // 丸い形に色をぬるための計算
    float f = length( gl_PointCoord - vec2( 0.5, 0.5 ) );
    if ( f > 1.0 ) {
        discard;
    }
    vec4 diffuseColor = texture2D(map, vec2(vUv.x,1.0-vUv.y));
    //vColor.w = 0.1;
    gl_FragColor =  diffuseColor;

}