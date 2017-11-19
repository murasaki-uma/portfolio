declare function require(x: string): any;
import * as THREE from 'three';

const vertex = require('./GLSL/Mosaic.vert');
const fragment = require('./GLSL/Mosaic.frag');
const testTexture = require('./texture/testTexture.jpg');
import GPUComputationRenderer from './GPUComputationRenderer';
const Mosaic_ComputePosition = require('./GLSL/Mosaic_ComputePosition.frag');
const Mosaic_ComputeVelocity = require('./GLSL/Mosaic_ComputeVelocity.frag');
// *********** ひとつめのシーン *********** //
export default class MosaicBlockParticle{

    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    private renderer:THREE.WebGLRenderer;
    private geometry:THREE.BoxGeometry;
    private material:THREE.MeshBasicMaterial;
    private cube:THREE.Mesh;
    private offsetAttribute:any;
    private orientationAttribute:any;
    private lastTime:number = 0;
    private moveQ:THREE.Quaternion = new THREE.Quaternion( 0.5, 0.5, 0.5, 0.0 ).normalize();
    private tmpQ:THREE.Quaternion = new THREE.Quaternion();
    private currentQ:THREE.Quaternion = new THREE.Quaternion();
    private mesh:THREE.Mesh;
    private uniforms:any;

    private WIDTH = 100;
    private PARTICLES = this.WIDTH * this.WIDTH;


    private gpuCompute:any;
    private velocityVariable:any;
    private positionVariable:any;
    private positionUniforms:any;
    private velocityUniforms:any;
    private particleUniforms:any;
    private effectController:any;



    // ******************************************************
    constructor(renderer:THREE.WebGLRenderer) {
        this.renderer = renderer;
        this.createScene();

        console.log("scene created!")
    }

    // ******************************************************
    private createScene()
    {

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
        this.camera.position.z = 100;
        // カメラ位置を設定
        // this.camera.position.z = 5;


        this.initComputeRenderer();



        var instances = 5000;
        var bufferGeometry:any = new THREE.BoxBufferGeometry( 2, 1, 1 );
        // copying data from a simple box geometry, but you can specify a custom geometry if you want
        var geometry:any = new THREE.InstancedBufferGeometry();
        geometry.index = bufferGeometry.index;
        geometry.attributes.position = bufferGeometry.attributes.position;
        geometry.attributes.uv = bufferGeometry.attributes.uv;

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

        var pos_uvsAttribute = new THREE.InstancedBufferAttribute( uvs, 2 );
        geometry.addAttribute( 'offset', this.offsetAttribute );
        geometry.addAttribute( 'orientation', this.orientationAttribute );
        geometry.addAttribute( 'pos_uv', pos_uvsAttribute );
        // material
        let texture = new THREE.Texture();
        let img = new Image();
        img.src = testTexture;
        texture.image = img;
        texture.needsUpdate = true;
        this.uniforms = {
                    map: { value: texture},
                    time:{value:0.0},
                    texturePosition:{value:null},
                    textureVelocity:{value:null}
                };
        var material = new THREE.RawShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: vertex,
            fragmentShader: fragment
        } );
        this.mesh = new THREE.Mesh( geometry, material );
        this.scene.add( this.mesh );

        window.addEventListener( 'resize', this.onWindowResize, false );

    }


    public initComputeRenderer()
    {

        this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, this.renderer );

        // 今回はパーティクルの位置情報と、移動方向を保存するテクスチャを2つ用意します
        var dtPosition = this.gpuCompute.createTexture();
        var dtVelocity = this.gpuCompute.createTexture();

        // テクスチャにGPUで計算するために初期情報を埋めていく
        this.fillTextures( dtPosition, dtVelocity );

        // shaderプログラムのアタッチ
        this.velocityVariable = this.gpuCompute.addVariable( "textureVelocity", Mosaic_ComputeVelocity, dtVelocity );
        this.positionVariable = this.gpuCompute.addVariable( "texturePosition", Mosaic_ComputePosition, dtPosition );

        // 一連の関係性を構築するためのおまじない
        this.gpuCompute.setVariableDependencies( this.velocityVariable, [ this.positionVariable, this.velocityVariable ] );
        this.gpuCompute.setVariableDependencies( this.positionVariable, [ this.positionVariable, this.velocityVariable ] );


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


    public fillTextures( texturePosition, textureVelocity ) {

        // textureのイメージデータをいったん取り出す
        var posArray = texturePosition.image.data;
        var velArray = textureVelocity.image.data;

        // パーティクルの初期の位置は、ランダムなXZに平面おく。
        // 板状の正方形が描かれる

        for ( var k = 0, kl = posArray.length; k < kl; k += 4 ) {
            // Position
            var x, y, z;
            x = Math.random()*50-25;
            y = Math.random()*50-25;
            z = Math.random()*0;
            // posArrayの実態は一次元配列なので
            // x,y,z,wの順番に埋めていく。
            // wは今回は使用しないが、配列の順番などを埋めておくといろいろ使えて便利
            posArray[ k + 0 ] = x;
            posArray[ k + 1 ] = y;
            posArray[ k + 2 ] = z;
            posArray[ k + 3 ] = 0;

            // 移動する方向はとりあえずランダムに決めてみる。
            // これでランダムな方向にとぶパーティクルが出来上がるはず。
            velArray[ k + 0 ] = Math.random()*2-1;
            velArray[ k + 1 ] = Math.random()*2-1;
            velArray[ k + 2 ] = Math.random()*2-1;
            velArray[ k + 3 ] = Math.random()*2-1;
        }
    }


    // ******************************************************
    public click()
    {

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

        this.gpuCompute.compute();


        this.uniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
        this.uniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;

        this.cube.rotation.x += 0.1;
        this.cube.rotation.y += 0.1;

        var time = performance.now();
        // this.mesh.rotation.y = time * 0.00005;
        var delta = ( time - this.lastTime ) / 5000;
        // this.tmpQ.set( this.moveQ.x * delta, this.moveQ.y * delta, this.moveQ.z * delta, 1 ).normalize();
        this.uniforms.time.value = time;
        // for ( var i = 0, il = this.orientationAttribute.count; i < il; i ++ ) {

            // this.currentQ.fromArray( this.orientationAttribute.array, ( i * 4 ) );
            // this.currentQ.multiply( this.tmpQ );
            // this.orientationAttribute.setXYZW( i, this.currentQ.x, this.currentQ.y, this.currentQ.z, this.currentQ.w );

        // }
        // this.orientationAttribute.needsUpdate = true;
        this.lastTime = time;

    }



}
