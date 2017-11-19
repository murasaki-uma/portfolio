varying vec4 vColor;
uniform sampler2D texture01;
varying vec2 vUv;
uniform float corner;
uniform sampler2D textureVelocity;
uniform sampler2D texturePosition;
varying vec2 vPosition;
void main() {

    // 丸い形に色をぬるための計算
    vec4 velocity = texture2D( textureVelocity, vUv );
    vec4 tmpPosition = texture2D( texturePosition, vUv );
    float f = length( gl_PointCoord - vec2( 0.5, 0.5 ) );
    if ( f > corner ) {
        discard;
    }
    vec4 color = texture2D(texture01, vPosition.xy /vec2(97.0,145.0)+(0.5,0.5) +velocity.xy*0.03);
    vec4 movedcolor = texture2D(texture01, vPosition.xy /vec2(97.0,145.0)+(0.5,0.5) +velocity.xy*0.03);
    float dist = clamp(distance(vPosition, tmpPosition.xy),0.0,30.0);
    vec4 mixColor = mix(color,movedcolor,dist/30.0);
    gl_FragColor =  vec4(mixColor.rgb,1.0);
}