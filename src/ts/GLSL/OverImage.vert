varying vec2 vUv;
uniform sampler2D texturePosition;
uniform float galleryMoveStep;
uniform float texImgWidth;
uniform float texImgHeight;
uniform float threshold;
uniform sampler2D textureOriginVerts;
uniform sampler2D textureAnimation;
varying vec3 pos;
    void main()	{
        vUv = uv;
        vec3 newPos = position.xyz;
        vec4 tmpPos = texture2D( texturePosition, uv );
        vec4 orgTemp = texture2D( textureOriginVerts, vUv );
        vec4 anmTemp = texture2D( textureAnimation, vUv );
//        if(orgTemp.y >= 0.99)
//        {
        if(threshold*texImgHeight-texImgHeight/2.0 > orgTemp.y)
        {
//             if(anmTemp.y >= 0.1)
//            {
                newPos.y = newPos.y +galleryMoveStep;
//            }

        }

//        }
//

        vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
        pos = newPos;
//        mvPosition.z += 0.5;
        gl_Position = projectionMatrix * mvPosition;
    }
