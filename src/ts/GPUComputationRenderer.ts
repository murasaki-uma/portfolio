import * as THREE from 'three';
export default class GPUComputationRenderer{

    public variables = [];

    public currentTextureIndex = 0;

    public scene = new THREE.Scene();

    public camera = new THREE.Camera();


    public passThruUniforms = {
        texture: { value: null }
    };

    public passThruShader:any;

    public mesh:THREE.Mesh;

    public sizeX:number;
    public sizeY:number;
    public renderer:THREE.WebGLRenderer;

    constructor( sizeX, sizeY, renderer )
    {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.renderer = renderer;
        this.camera.position.z = 1;
        this.passThruShader = this.createShaderMaterial( this.getPassThroughFragmentShader(), this.passThruUniforms );
        this.mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), this.passThruShader );
        this.scene.add( this.mesh );
    }


    public addVariable( variableName, computeFragmentShader, initialValueTexture ) {

        var material = this.createShaderMaterial( computeFragmentShader );

        var variable = {
            name: variableName,
            initialValueTexture: initialValueTexture,
            material: material,
            dependencies: null,
            renderTargets: [],
            wrapS: null,
            wrapT: null,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter
        };

        this.variables.push( variable );

        return variable;

    };

    public setVariableDependencies( variable, dependencies ) {

        variable.dependencies = dependencies;

    };

    public init() {

        if ( ! this.renderer.extensions.get( "OES_texture_float" ) ) {

            return "No OES_texture_float support for float textures.";

        }

        if ( this.renderer.capabilities.maxVertexTextures === 0 ) {

            return "No support for vertex shader textures.";

        }

        for ( var i = 0; i < this.variables.length; i++ ) {

            var variable = this.variables[ i ];

            // Creates rendertargets and initialize them with input texture
            variable.renderTargets[ 0 ] = this.createRenderTarget( this.sizeX, this.sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter );
            variable.renderTargets[ 1 ] = this.createRenderTarget( this.sizeX, this.sizeY, variable.wrapS, variable.wrapT, variable.minFilter, variable.magFilter );
            this.renderTexture( variable.initialValueTexture, variable.renderTargets[ 0 ] );
            this.renderTexture( variable.initialValueTexture, variable.renderTargets[ 1 ] );

            // Adds dependencies uniforms to the ShaderMaterial
            var material = variable.material;
            var uniforms = material.uniforms;
            if ( variable.dependencies !== null ) {

                for ( var d = 0; d < variable.dependencies.length; d++ ) {

                    var depVar = variable.dependencies[ d ];

                    if ( depVar.name !== variable.name ) {

                        // Checks if variable exists
                        var found = false;
                        for ( var j = 0; j < this.variables.length; j++ ) {

                            if ( depVar.name === this.variables[ j ].name ) {
                                found = true;
                                break;
                            }

                        }
                        if ( ! found ) {
                            return "Variable dependency not found. Variable=" + variable.name + ", dependency=" + depVar.name;
                        }

                    }

                    uniforms[ depVar.name ] = { value: null };

                    material.fragmentShader = "\nuniform sampler2D " + depVar.name + ";\n" + material.fragmentShader;

                }
            }
        }

        this.currentTextureIndex = 0;

        return null;

    };

    public compute() {

        var currentTextureIndex = this.currentTextureIndex;
        var nextTextureIndex = this.currentTextureIndex === 0 ? 1 : 0;

        for ( var i = 0, il = this.variables.length; i < il; i++ ) {

            var variable = this.variables[ i ];

            // Sets texture dependencies uniforms
            if ( variable.dependencies !== null ) {

                var uniforms = variable.material.uniforms;
                for ( var d = 0, dl = variable.dependencies.length; d < dl; d++ ) {

                    var depVar = variable.dependencies[ d ];

                    uniforms[ depVar.name ].value = depVar.renderTargets[ currentTextureIndex ].texture;

                }

            }

            // Performs the computation for this variable
            this.doRenderTarget( variable.material, variable.renderTargets[ nextTextureIndex ] );

        }

        this.currentTextureIndex = nextTextureIndex;
    };

    public getCurrentRenderTarget( variable ) {

        return variable.renderTargets[ this.currentTextureIndex ];

    };

    public getAlternateRenderTarget( variable ) {

        return variable.renderTargets[ this.currentTextureIndex === 0 ? 1 : 0 ];

    };

    public  addResolutionDefine( materialShader ) {

        materialShader.defines.resolution = 'vec2( ' + this.sizeX.toFixed( 1 ) + ', ' + this.sizeY.toFixed( 1 ) + " )";

    }


    // The following functions can be used to compute things manually

    public  createShaderMaterial( computeFragmentShader, uniforms? ) {

        uniforms = uniforms || {};

        var material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: this.getPassThroughVertexShader(),
            fragmentShader: computeFragmentShader
        } );

        this.addResolutionDefine( material );

        return material;
    }
    public createRenderTarget( sizeXTexture, sizeYTexture, wrapS, wrapT, minFilter, magFilter ) {

        sizeXTexture = sizeXTexture || this.sizeX;
        sizeYTexture = sizeYTexture || this.sizeY;

        wrapS = wrapS || THREE.ClampToEdgeWrapping;
        wrapT = wrapT || THREE.ClampToEdgeWrapping;

        minFilter = minFilter || THREE.NearestFilter;
        magFilter = magFilter || THREE.NearestFilter;

        var renderTarget = new THREE.WebGLRenderTarget( sizeXTexture, sizeYTexture, {
            wrapS: wrapS,
            wrapT: wrapT,
            minFilter: minFilter,
            magFilter: magFilter,
            format: THREE.RGBAFormat,
            type: ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? THREE.HalfFloatType : THREE.FloatType,
            stencilBuffer: false
        } );

        return renderTarget;

    };

    public createTexture( sizeXTexture, sizeYTexture ) {

        sizeXTexture = sizeXTexture || this.sizeX;
        sizeYTexture = sizeYTexture || this.sizeY;

        var a = new Float32Array( sizeXTexture * sizeYTexture * 4 );
        var texture = new THREE.DataTexture( a, this.sizeX, this.sizeY, THREE.RGBAFormat, THREE.FloatType );
        texture.needsUpdate = true;

        return texture;

    };


    public renderTexture( input, output ) {

        // Takes a texture, and render out in rendertarget
        // input = Texture
        // output = RenderTarget

        this.passThruUniforms.texture.value = input;

        this.doRenderTarget( this.passThruShader, output);

        this.passThruUniforms.texture.value = null;

    };

    public doRenderTarget( material, output ) {

        this.mesh.material = material;
        this.renderer.render( this.scene, this.camera, output );
        this.mesh.material = this.passThruShader;

    };

    // Shaders

    public  getPassThroughVertexShader() {

        return	"void main()	{\n" +
            "\n" +
            "	gl_Position = vec4( position, 1.0 );\n" +
            "\n" +
            "}\n";

    }

    public  getPassThroughFragmentShader() {

        return	"uniform sampler2D texture;\n" +
            "\n" +
            "void main() {\n" +
            "\n" +
            "	vec2 uv = gl_FragCoord.xy / resolution.xy;\n" +
            "\n" +
            "	gl_FragColor = texture2D( texture, uv );\n" +
            "\n" +
            "}\n";

    }

}
