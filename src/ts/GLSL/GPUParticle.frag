varying vec4 vColor;
varying vec3 vPos;
varying vec2 vUv;
uniform sampler2D textureAnimation;
uniform sampler2D map;
uniform sampler2D mapNext;
void main() {
    vec4 anmTemp = texture2D( textureAnimation, vUv );
    // 丸い形に色をぬるための計算
    float f = length( gl_PointCoord - vec2(3, 3 ) );
    if ( f > 4.0 ) {
//        discard;
    }
    vec4 diffuseColor = texture2D(map, vec2(vUv.x,1.0-vUv.y));
    diffuseColor *= 1.0 - anmTemp.y;
    vec4 diffuseColorNext = texture2D(mapNext, vec2(vUv.x,1.0-vUv.y));
    diffuseColorNext *= anmTemp.y;
    if(anmTemp.w >= 0.90)
    {
//        discard;
    }
    //vColor.w = 0.1;
    gl_FragColor =  diffuseColor + diffuseColorNext;

}