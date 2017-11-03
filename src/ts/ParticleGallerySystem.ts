declare function require(x: string): any;

import * as THREE from 'three';

const Stats = require('stats-js');


import 'imports-loader?THREE=three!../../node_modules/three/examples/js/controls/OrbitControls';

import GPUComputationRenderer from './GPUComputationRenderer';
const TimelineMax = require('gsap/TimelineMax');
// console.log(GPUComputationRenderer);
const EASE = require('gsap/EasePack.js');
const GPUParticleVert = require('./GLSL/GPUParticle.vert');
const GPUParticleFrag = require('./GLSL/GPUParticle.frag');
const VelocityFrag = require('./GLSL/ComputeVelocity.frag');
const PositionFrag = require('./GLSL/ComputePosition.frag');




export default class ParticleGallerySystem
{

    private WIDTH = 500;
    private PARTICLES = this.WIDTH * this.WIDTH;

    // メモリ負荷確認用
    private stats:any;

    // 基本セット
    private container;
    private camera:THREE.PerspectiveCamera;
    private scene:THREE.Scene;
    private renderer:THREE.WebGLRenderer;
    private geometry:THREE.BufferGeometry;
    private controls:THREE.OrbitControls;





    // gpgpuをするために必要なオブジェクト達
    private gpuCompute:any;
    private velocityVariable:any;
    private positionVariable:any;
    private positionUniforms:any;
    private velocityUniforms:any;
    private particleUniforms:any;
    private effectController:any;

    constructor()
    {
        this.init();
        this.animate();
    }


    public init() {


        // 一般的なThree.jsにおける定義部分
        this.container = document.createElement( 'div' );
        document.body.appendChild( this.container );
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 5, 15000 );
        this.camera.position.y = 120;
        this.camera.position.z = 200;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor( 0x000000 );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );
        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.stats = new Stats();
        this.container.appendChild( this.stats.domElement );
        window.addEventListener( 'resize', this.onWindowResize, false );

        // ①gpuCopute用のRenderを作る
        this.initComputeRenderer();

        // ②particle 初期化
        this.initPosition();
        // this.animate();

    }

    public initComputeRenderer() {

        // gpgpuオブジェクトのインスタンスを格納
        this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, this.renderer );

        // 今回はパーティクルの位置情報と、移動方向を保存するテクスチャを2つ用意します
        var dtPosition = this.gpuCompute.createTexture();
        var dtVelocity = this.gpuCompute.createTexture();

        // テクスチャにGPUで計算するために初期情報を埋めていく
        this.fillTextures( dtPosition, dtVelocity );

        // shaderプログラムのアタッチ
        this.velocityVariable = this.gpuCompute.addVariable( "textureVelocity", VelocityFrag, dtVelocity );
        this.positionVariable = this.gpuCompute.addVariable( "texturePosition", PositionFrag, dtPosition );

        // 一連の関係性を構築するためのおまじない
        let variables = [this.positionVariable, this.velocityVariable];
        this.gpuCompute.setVariableDependencies( this.velocityVariable, variables );
        this.gpuCompute.setVariableDependencies( this.positionVariable, variables );



        // error処理
        var error = this.gpuCompute.init();
        if ( error !== null ) {
            console.error( error );
        }
    }

    // restart用関数 今回は使わない
    public restartSimulation() {
        var dtPosition = this.gpuCompute.createTexture();
        var dtVelocity = this.gpuCompute.createTexture();
        this.fillTextures( dtPosition, dtVelocity );
        this.gpuCompute.renderTexture( dtPosition, this.positionVariable.renderTargets[ 0 ] );
        this.gpuCompute.renderTexture( dtPosition, this.positionVariable.renderTargets[ 1 ] );
        this.gpuCompute.renderTexture( dtVelocity, this.velocityVariable.renderTargets[ 0 ] );
        this.gpuCompute.renderTexture( dtVelocity, this.velocityVariable.renderTargets[ 1 ] );
    }

    // ②パーティクルそのものの情報を決めていく。
    public initPosition() {

        // 最終的に計算された結果を反映するためのオブジェクト。
        // 位置情報はShader側(texturePosition, textureVelocity)
        // で決定されるので、以下のように適当にうめちゃってOK

        this.geometry = new THREE.BufferGeometry();
        var positions = new Float32Array( this.PARTICLES * 3 );
        var p = 0;
        for ( var i = 0; i < this.PARTICLES; i++ ) {
            positions[ p++ ] = 0;
            positions[ p++ ] = 0;
            positions[ p++ ] = 0;
        }

        // uv情報の決定。テクスチャから情報を取り出すときに必要
        var uvs = new Float32Array( this.PARTICLES * 2 );
        p = 0;
        for ( var j = 0; j < this.WIDTH; j++ ) {
            for ( var i = 0; i < this.WIDTH; i++ ) {
                uvs[ p++ ] = i / ( this.WIDTH - 1 );
                uvs[ p++ ] = j / ( this.WIDTH - 1 );
            }
        }

        // attributeをgeometryに登録する
        this.geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        this.geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );


        // uniform変数をオブジェクトで定義
        // 今回はカメラをマウスでいじれるように、計算に必要な情報もわたす。
        this.particleUniforms = {
            texturePosition: { value: null },
            textureVelocity: { value: null },
            cameraConstant: { value: this.getCameraConstant( this.camera ) }
        };



        // Shaderマテリアル これはパーティクルそのものの描写に必要なシェーダー
        var material = new THREE.ShaderMaterial( {
            uniforms:       this.particleUniforms,
            vertexShader: GPUParticleVert,
            fragmentShader: GPUParticleFrag
        });
        material.extensions.drawBuffers = true;
        var particles = new THREE.Points( this.geometry, material );
        particles.matrixAutoUpdate = false;
        particles.updateMatrix();

        // パーティクルをシーンに追加
        this.scene.add( particles );
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
            x = Math.random()*500-250;
            z = Math.random()*500-250;
            y = 0;
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



    // カメラオブジェクトからシェーダーに渡したい情報を引っ張ってくる関数
    // カメラからパーティクルがどれだけ離れてるかを計算し、パーティクルの大きさを決定するため。
    public getCameraConstant( camera ) {
        return window.innerHeight / ( Math.tan( THREE.Math.DEG2RAD * 0.5 * camera.fov ) / camera.zoom );
    }



    // 画面がリサイズされたときの処理
    // ここでもシェーダー側に情報を渡す。
    public onWindowResize =()=> {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.particleUniforms.cameraConstant.value = this.getCameraConstant( this.camera );
    }


    public animate =(time?)=> {
        requestAnimationFrame( this.animate );
        this.render();
        this.stats.update();
    }



    public render() {

        // 計算用のテクスチャを更新
        this.gpuCompute.compute();

        // 計算した結果が格納されたテクスチャをレンダリング用のシェーダーに渡す
        this.particleUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
        this.particleUniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;
        this.renderer.render( this.scene, this.camera );
    }
}


