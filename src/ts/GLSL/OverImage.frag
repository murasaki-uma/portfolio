
uniform float u_time;
varying vec2 vUv;
varying vec3 pos;
uniform float texImgWidth;
uniform float texImgHeight;
uniform float threshold;
uniform sampler2D textureOriginVerts;
uniform sampler2D textureAnimation;
uniform sampler2D textureVelocity;
uniform sampler2D texturePosition;
uniform sampler2D map;
uniform sampler2D mapNext;

    void main()
    {

        vec4 tmpPos = texture2D( texturePosition, uv );
        vec4 anmTemp = texture2D( textureAnimation, vUv );
        vec4 orgTemp = texture2D( textureOriginVerts, vUv );
        vec4 velocity = texture2D(textureVelocity,vUv);
        if(threshold*texImgHeight - texImgHeight/2.0 > orgTemp.y)
        {
            if(anmTemp.y < 0.999)
            {
//                discard;
            }
        }
//        if(pos.y+100.0 >= texImgHeight/2.0 * 0.8 && anmTemp.y != 0.0 && anmTemp.w <= 0.97)
//        {
//            discard;
//        }
        float a = 0.0;
        if(threshold >0.9)
        {
//            a = anmTemp.y;
        }

          vec4 diffuseColor = texture2D(map, vec2(vUv.x,vUv.y));
          diffuseColor *= 1.0 - anmTemp.y;
          vec4 diffuseColorNext = texture2D(mapNext, vec2(vUv.x,vUv.y));
          diffuseColorNext *= anmTemp.y;
          //vColor.w = 0.1;
          vec4 color = diffuseColor + diffuseColorNext;
          color.a = a;
          gl_FragColor =  color;
    }