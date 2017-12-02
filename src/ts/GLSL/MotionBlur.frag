varying vec2 vUv;
uniform sampler2D texture;
uniform float alpha;
void main()	{
    vec4 color = texture2D(texture,vUv);
    if(distance(color.xyz,vec3(0.,0.,0.)) == 0.0)
    {
        discard;
    }
    gl_FragColor = vec4(color.xyz,alpha);
}