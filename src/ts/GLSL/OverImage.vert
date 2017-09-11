varying vec2 vUv;
uniform sampler2D texturePosition;
varying vec3 pos;
    void main()	{
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
    }
