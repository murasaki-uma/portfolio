#define delta 0.1;
uniform float time;
float Pi = 3.141592;
uniform float timeStep;
uniform vec3 scenePos;
uniform vec3 translatePos;
uniform vec3 preTranslatePos;
uniform float texImgWidth;
uniform float texImgHeight;
uniform float threshold;
uniform int galleryCount;
uniform float galleryMoveStep;
float random(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 pos = tmpPos.xyz;
    vec4 tmpVel = texture2D( textureVelocity, uv );
    vec4 tmpAnm = texture2D( textureAnimation, uv );
    vec4 tmpOrg = texture2D( textureOriginVerts, uv );
    // velが移動する方向(もう一つ下のcomputeShaderVelocityを参照)
    vec3 vel = tmpVel.xyz;
//    vel.y *= 4.0;
//    vel.x *= 2.0;
    vel.z *= 0.5;


    // 移動する方向に速度を掛け合わせた数値を現在地に加える。
    if(threshold*texImgHeight-texImgHeight/2.0 > tmpOrg.y)
    {
        float t = 0.0;
        if(tmpAnm.y >= 0.9999)
        {
            t = 0.0;
        } else
        {
            t = tmpAnm.y;
        }
        pos.x =  vel.x*sin(t*Pi)*4.0 + tmpOrg.x;
        pos.z =  vel.z*sin(t*Pi)*4.0 + tmpOrg.z;
        pos.y = tmpAnm.y * galleryMoveStep + preTranslatePos.y + tmpOrg.y;
        tmpPos.w -= 0.25 * 0.0;
    }


    if(tmpPos.w < 0.0)
    {

        tmpPos.w = random(pos.xy) * 10.0;
        float theta = 2.0 * Pi * random(pos.yy);
        float phi = Pi * random(pos.zz);
        float r = 5.0 * random(pos.xy);
        //vec3 startPos = emitterPos + (emitterPos - pre_emitterPos) * random(pos.yz);
        pos = vec3(r * sin(theta) * cos(phi) * 2.0, r * cos(theta),r * sin(theta) * sin(phi));

        pos = vec3(random(pos.xy)*texImgWidth-texImgWidth/2.0, random(pos.zx)*texImgHeight-texImgHeight/2.0,random(pos.yz)*10.0);

        tmpPos.w = random(pos.xy)*30.0 + random(pos.zy) * 20.0;


    }


    gl_FragColor = vec4( pos, tmpPos.w );
}