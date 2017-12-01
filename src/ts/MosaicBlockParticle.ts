declare function require(x: string): any;
import * as THREE from 'three';

const vertex = require('./GLSL/Mosaic.vert');
const fragment = require('./GLSL/Mosaic.frag');
const testTexture = require('./texture/testTexture.jpg');
import GPUComputationRenderer from './GPUComputationRenderer';
const Mosaic_ComputePosition = require('./GLSL/Mosaic_ComputePosition.frag');
const Mosaic_ComputeVelocity = require('./GLSL/Mosaic_ComputeVelocity.frag');
const Mosaic_ComputeOriginal = require('./GLSL/Mosaic_ComputeOriginal.frag');
const Mosaic_ComputeShadow = require('./GLSL/Mosaic_ComputeShadow.frag');
const monalisa = require('./texture/gogh_small.jpg');
// *********** ひとつめのシーン *********** //
export default class MosaicBlockParticle{

    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    private renderer:THREE.WebGLRenderer;
    private geometry:THREE.BoxGeometry;
    // private material:THREE.MeshBasicMaterial;
    private cube:THREE.Mesh;
    private offsetAttribute:any;
    private orientationAttribute:any;
    private lastTime:number = 0;
    private mesh:THREE.Mesh;
    private uniforms:any;

    private WIDTH = 128;
    private PARTICLES = this.WIDTH * this.WIDTH;


    private gpuCompute:any;
    private velocityVariable:any;
    private positionVariable:any;
    private quaternionVariable:any;
    private quaternionUniforms:any;

    private material:any;
    private shadowMaterial:any;
    private light:THREE.DirectionalLight;
    private shadowCamera;

    private imgWidth:number = 75;
    private imgHeight:number = 50;
    private rotateVec:THREE.Vector3 = new THREE.Vector3(0,0,0);
    private isRotate:boolean = false;
    private timer:number = 0.0;
    private cameraStartZ:number = 100;
    private startTimer:number = 2.5;





    // ******************************************************
    constructor(renderer:THREE.WebGLRenderer) {
        this.renderer = renderer;
        this.createScene();
        console.log(monalisa);
        console.log("scene created!")
    }

    // ******************************************************
    private createScene()
    {


        this.renderer.setClearColor(0xebe8ed,0);
        this.scene = new THREE.Scene();

        // 立方体のジオメトリーを作成
        this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
        // 緑のマテリアルを作成
        this.material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        // 上記作成のジオメトリーとマテリアルを合わせてメッシュを生成
        this.cube = new THREE.Mesh( this.geometry, this.material );
        // メッシュをシーンに追加
        // this.scene.add( this.cube );

        // カメラを作成
        this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );
        this.camera.position.z = this.cameraStartZ;
        // カメラ位置を設定
        // this.camera.position.z = 5;


        this.initComputeRenderer();


        this.light = new THREE.DirectionalLight( 0xFFAA55,0.5 );
        this.light.position.set(0, 1, 1);
        this.light.castShadow = true;
        this.shadowCamera = this.light.shadow.camera;
        this.shadowCamera.lookAt( this.scene.position );

        this.light.shadow.matrix.set(
            0.5, 0.0, 0.0, 0.5,
            0.0, 0.5, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.5,
            0.0, 0.0, 0.0, 1.0
        );

        this.light.shadow.matrix.multiply( this.shadowCamera.projectionMatrix );
        this.light.shadow.matrix.multiply( this.shadowCamera.matrixWorldInverse );

        if(this.light.shadow.map === null){
            this.light.shadow.mapSize.x = 2048;
            this.light.shadow.mapSize.y = 2048;

            var pars = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat };

            this.light.shadow.map = new THREE.WebGLRenderTarget( this.light.shadow.mapSize.x,this.light.shadow.mapSize.y, pars );
            // light.shadow.map.texture.name = light.name + ".shadowMap";
        }



        var instances = this.PARTICLES;
        var bufferGeometry:any = new THREE.BoxBufferGeometry( 2, 1, 1 );
        // copying data from a simple box geometry, but you can specify a custom geometry if you want
        var geometry:any = new THREE.InstancedBufferGeometry();
        geometry.index = bufferGeometry.index;
        geometry.attributes.position = bufferGeometry.attributes.position;
        geometry.attributes.uv = bufferGeometry.attributes.uv;
        geometry.attributes.normal = bufferGeometry.attributes.normal;

        var offsets = [];
        // var pos_uv = [];
        var orientations = [];
        var vector = new THREE.Vector4();
        var x, y, z, w;

        var uvs = new Float32Array( this.PARTICLES * 2 );
        var xywidth = new Float64Array( 3 );
        xywidth[2] = this.WIDTH;
        var p = 0;
        for ( var j = 1; j < this.WIDTH; j++ ) {
            for ( var i = 1; i < this.WIDTH; i++ ) {
                xywidth[0] = i;
                xywidth[1] = j;
                uvs[ p++ ] = xywidth[0] / ( xywidth[2] )-(1.0/xywidth[2]);
                uvs[ p++ ] = xywidth[1] / ( xywidth[2] )-(1.0/xywidth[2]);
            }
        }


        for ( var i = 0; i < instances; i ++ ) {
            // offsets
            x = Math.random() * 50 - 25;
            y = Math.random() * 50 - 25;
            z = Math.random() *0;

            vector.set( x, y, z, 0 ).normalize();
            vector.multiplyScalar( 5 ); // move out at least 5 units from center in current direction
            offsets.push( x + vector.x, y + vector.y, z + vector.z,i );

            x = Math.random() * 2 - 1;
            y = Math.random() * 2 - 1;
            z = Math.random() * 2 - 1;
            w = Math.random() * 2 - 1;
            vector.set( x, y, z, w ).normalize();
            orientations.push( vector.x, vector.y, vector.z, vector.w );
        }
        this.offsetAttribute = new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 4 );

        this.orientationAttribute = new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ).setDynamic( true );


        let texture = new THREE.Texture();
        let img = new Image();
        img.src = monalisa;
        texture.needsUpdate = true;
        texture.image = img;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;


        var pos_uvsAttribute = new THREE.InstancedBufferAttribute( uvs, 2 );
        geometry.addAttribute( 'offset', this.offsetAttribute );
        geometry.addAttribute( 'orientation', this.orientationAttribute );
        geometry.addAttribute( 'pos_uv', pos_uvsAttribute );
        // material

        this.uniforms = {
                    map: { value: texture},
                    // monalisa:{value:texture},
                    time:{value:0.0},
                    texturePosition:{value:null},
                    textureVelocity:{value:null},
                    // pre_texturePosition:{value:null},
                    // pre_textureVelocity:{value:null}
                    textureOriginal:{value:null},
                    shadowMap: { type: 't', value: this.light.shadow.map },
                    shadowMapSize: {type: "v2", value: this.light.shadow.mapSize},
                    shadowBias: {type: "f", value: this.light.shadow.bias},
                    shadowRadius: {type: "f", value: this.light.shadow.radius},
                    uMatrix:{value:null},
                    imgWidth:{value:this.imgWidth},
                    imgHeight:{value:this.imgHeight},
                    near:{value:this.camera.near},
                    far:{value:this.camera.far},
                    cameraPos:{value:this.camera.position},
                    sceneInvMatrix:{value:null},
                    isStart:{value:this.startTimer}
                };
        this.material = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: vertex,
            fragmentShader: fragment,
            shading: THREE.FlatShading,
            transparent:true
        } );

        this.shadowMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                map: { value: texture},
                time:{value:0.0},
                texturePosition:{value:null},
                textureVelocity:{value:null},
                size: { type: "f", value: this.WIDTH },

                timer: { type: 'f', value: 0 },

                shadowMatrix: { type: 'm4', value: this.light.shadow.matrix},
                lightPosition: { type: 'v3', value: this.light.position }
            },
            vertexShader: vertex,
            fragmentShader: Mosaic_ComputeShadow
        });


        this.mesh = new THREE.Mesh( geometry, this.material );
        this.mesh.frustumCulled = false;
        this.scene.add( this.mesh );

        window.addEventListener( 'resize', this.onWindowResize, false );

    }


    public initComputeRenderer()
    {

        this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, this.renderer );

        // 今回はパーティクルの位置情報と、移動方向を保存するテクスチャを2つ用意します
        var dtPosition = this.gpuCompute.createTexture();
        var dtVelocity = this.gpuCompute.createTexture();
        var dtOriginal = this.gpuCompute.createTexture();
        // テクスチャにGPUで計算するために初期情報を埋めていく
        this.fillTextures( dtPosition, dtVelocity,dtOriginal );

        // shaderプログラムのアタッチ
        this.velocityVariable = this.gpuCompute.addVariable( "textureVelocity", Mosaic_ComputeVelocity, dtVelocity );
        this.positionVariable = this.gpuCompute.addVariable( "texturePosition", Mosaic_ComputePosition, dtPosition );
        this.quaternionVariable = this.gpuCompute.addVariable( "textureOriginal", Mosaic_ComputeOriginal, dtOriginal );

        // 一連の関係性を構築するためのおまじない
        let variables = [ this.positionVariable, this.velocityVariable, this.quaternionVariable ];
        this.gpuCompute.setVariableDependencies( this.velocityVariable, variables );
        this.gpuCompute.setVariableDependencies( this.positionVariable, variables );
        this.gpuCompute.setVariableDependencies( this.quaternionVariable, variables );


        this.quaternionUniforms = this.quaternionVariable.material.uniforms;
        this.quaternionUniforms.pre_texturePosition = {value:dtPosition};


        var error = this.gpuCompute.init();
        if ( error !== null ) {
            console.error( error );
        }
    }

    public onWindowResize =( event )=> {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }


    public fillTextures( texturePosition, textureVelocity, textureQuaternion ) {

        // textureのイメージデータをいったん取り出す
        var posArray = texturePosition.image.data;
        var velArray = textureVelocity.image.data;
        var qtArray = textureQuaternion.image.data;

        // パーティクルの初期の位置は、ランダムなXZに平面おく。
        // 板状の正方形が描かれる

        for ( var k = 0, kl = posArray.length; k < kl; k += 4 ) {
            // Position
            var x, y, z;
            x = Math.random()*this.imgWidth-this.imgWidth/2;
            y = Math.random()*this.imgHeight-this.imgHeight/2;
            z = Math.random()*10-5;
            // posArrayの実態は一次元配列なので
            // x,y,z,wの順番に埋めていく。
            // wは今回は使用しないが、配列の順番などを埋めておくといろいろ使えて便利
            posArray[ k + 0 ] = x;
            posArray[ k + 1 ] = y;
            posArray[ k + 2 ] = z;
            posArray[ k + 3 ] = 0;

            qtArray[ k + 0 ] = x;
            qtArray[ k + 1 ] = y;
            qtArray[ k + 2 ] = z;
            qtArray[ k + 3 ] = 0;

            // 移動する方向はとりあえずランダムに決めてみる。
            // これでランダムな方向にとぶパーティクルが出来上がるはず。
            velArray[ k + 0 ] = Math.random()*2-1;
            velArray[ k + 1 ] = Math.random()*2-1;
            velArray[ k + 2 ] = Math.random()*2-1;
            velArray[ k + 3 ] = 100*Math.random();
        }
    }


    // ******************************************************
    public click()
    {
        this.isRotate = !this.isRotate;
        this.startTimer = 3.0;
    }

    // ******************************************************
    public keyUp(e:KeyboardEvent)
    {

    }

    // ******************************************************
    public mouseMove(e:MouseEvent)
    {

    }


    // ******************************************************
    public keyDown(e:KeyboardEvent)
    {

    }

    // ******************************************************
    public onMouseDown(e:MouseEvent)
    {


    }

    // ******************************************************
    public update()
    {

        var time = performance.now();

        if(this.startTimer > 0)
        {
            this.startTimer -=0.01;
        } else
        {
            this.uniforms.isStart.value = this.startTimer;
            this.isRotate = true;
        }

        if(this.isRotate)
        {
            this.timer += 0.003;
            this.timer = this.timer%(Math.PI*2);
            // this.rotateVec.x += 0.001;
            // this.rotateVec.y += 0.002;
            // this.rotateVec.z += 0.0015;
            // this.rotateVec.x = this.rotateVec.x%(Math.PI*2);
            // this.rotateVec.y = this.rotateVec.y%(Math.PI*2);
            // this.rotateVec.z = this.rotateVec.z%(Math.PI*2);
            // this.mesh.position.z +=(30.0 - this.scene.position.z) * 0.03;
            this.cameraStartZ += (30.0 - this.cameraStartZ) * 0.02;
            this.camera.position.z = this.cameraStartZ + Math.sin(this.timer) * 40.0;
        } else
        {
            var speed = 0.04;
            this.rotateVec.x += (0.0 - this.rotateVec.x) * speed;
            this.rotateVec.y += (0.0 - this.rotateVec.y) * speed;
            this.rotateVec.z += (0.0 - this.rotateVec.z) * speed;
            this.scene.position.z +=(0.0 - this.scene.position.z) * speed;
            this.mesh.position.z +=(0.0 - this.scene.position.z) * speed;
            this.camera.position.z +=( this.cameraStartZ  - this.camera.position.z) * speed;
            this.cameraStartZ += (70.0 - this.cameraStartZ) * speed;
            this.timer +=(0.0 -this.timer)*speed;
        }

        this.scene.rotation.setFromVector3(this.rotateVec);
        this.quaternionUniforms.pre_texturePosition = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;

        // this.uniforms.pre_texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
        // this.uniforms.pre_textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;

        this.gpuCompute.compute();

        this.uniforms.textureOriginal.value = this.gpuCompute.getCurrentRenderTarget( this.quaternionVariable ).texture;
        this.uniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
        this.uniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;

        this.shadowMaterial.uniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
        this.shadowMaterial.uniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;



        // this.mesh.rotation.y = time * 0.00005;
        var delta = ( time - this.lastTime ) / 5000;
        // this.tmpQ.set( this.moveQ.x * delta, this.moveQ.y * delta, this.moveQ.z * delta, 1 ).normalize();
        this.uniforms.time.value = this.timer;
        this.shadowMaterial.uniforms.time.value = this.timer;
        // for ( var i = 0, il = this.orientationAttribute.count; i < il; i ++ ) {

            // this.currentQ.fromArray( this.orientationAttribute.array, ( i * 4 ) );
            // this.currentQ.multiply( this.tmpQ );
            // this.orientationAttribute.setXYZW( i, this.currentQ.x, this.currentQ.y, this.currentQ.z, this.currentQ.w );

        // }
        // this.orientationAttribute.needsUpdate = true;
        this.lastTime = this.timer;


        this.mesh.material = this.shadowMaterial;
        this.renderer.render( this.scene, this.shadowCamera, this.light.shadow.map);



        // this.renderer.setClearColor( 0x2e0232 );
        this.mesh.material = this.material;
        this.material.uniforms.shadowMap.value = this.light.shadow.map;
        let m = new THREE.Matrix4();
        this.material.uniforms.uMatrix.value = m.getInverse(this.mesh.matrix);
        this.renderer.render( this.scene, this.camera );

    }



}
