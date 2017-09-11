uniform sampler2D map;
uniform float u_time;
varying vec2 vUv;
varying vec3 pos;
uniform float texImgWidth;
uniform float texImgHeight;
uniform float threshold;
uniform sampler2D textureOriginVerts;
//uniform float isPause;
// 上のテクスチャの追いつく具合を調整
uniform float border;

    void main()
    {


        vec4 orgTemp = texture2D( textureOriginVerts, vUv );
        if(threshold*texImgHeight-texImgHeight/2.0 > orgTemp.y)
        {
            discard;
        }
      gl_FragColor = texture2D(map, vUv);
    }