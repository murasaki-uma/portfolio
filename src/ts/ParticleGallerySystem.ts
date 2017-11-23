declare function require(x: string): any;

import * as THREE from 'three';

const Stats = require('stats-js');


import 'imports-loader?THREE=three!../../node_modules/three/examples/js/controls/OrbitControls';

import GPUComputationRenderer from './GPUComputationRenderer';
const TimelineMax = require('gsap/TimelineMax');
const GPUParticleVert = require('./GLSL/GPUParticle.vert');
const GPUParticleFrag = require('./GLSL/GPUParticle.frag');
const VelocityFrag = require('./GLSL/ComputeVelocity.frag');
const PositionFrag = require('./GLSL/ComputePosition.frag');
const OrgnlPositionFrag = require('./GLSL/ComputeOriginVerts.frag');
const monalisa = require('./texture/MonaLisa.png');




export default class ParticleGallerySystem
{
    private WIDTH = 600;
    private PARTICLES = this.WIDTH * this.WIDTH;

    // メモリ負荷確認用
    // private stats:any;

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
    private orgnlPositionVariable:any;
    private positionUniforms:any;
    private velocityUniforms:any;
    public particleUniforms:any;
    private effectController:any;

    private positions = new Float32Array( this.PARTICLES * 3 );
    public imgWidth = 97;
    public imgHeight = 145;

    public texture:THREE.Texture;

    public isGpuUpdate:boolean = true;

    constructor(scene:THREE.Scene, camera:THREE.PerspectiveCamera, renderer:THREE.WebGLRenderer)
    {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;

        // this.init();

    }
    public setTexture(imgstr:string)
    {
        let img = new Image();
        img.src = imgstr;
        this.texture.needsUpdate = true;
        this.texture.image = img;
        this.texture.wrapS = THREE.ClampToEdgeWrapping;
        this.texture.wrapT = THREE.ClampToEdgeWrapping;

    }


    public init(width?:number,height?:number,textures?:THREE.Texture) {
        this.imgWidth = (width === undefined? 100 : width);
        this.imgHeight = (height === undefined? 100:height);

        // this.textures = (textures === undefined? :textures);

        this.texture = new THREE.Texture();
        this.setTexture(monalisa);



        window.addEventListener( 'resize', this.onWindowResize, false );

        // ①gpuCopute用のRenderを作る
        this.initComputeRenderer();

        // ②particle 初期化
        this.initPosition();
        // this.animate();

        this.update();

    }

    public initComputeRenderer() {

        // gpgpuオブジェクトのインスタンスを格納
        this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, this.renderer );

        // 今回はパーティクルの位置情報と、移動方向を保存するテクスチャを2つ用意します
        var dtPosition = this.gpuCompute.createTexture();
        var dtVelocity = this.gpuCompute.createTexture();
        var dtOrgnlPosition = this.gpuCompute.createTexture();

        // テクスチャにGPUで計算するために初期情報を埋めていく
        this.fillTextures( dtPosition, dtVelocity, dtOrgnlPosition);

        // shaderプログラムのアタッチ
        let textures = [VelocityFrag, dtVelocity, dtOrgnlPosition];
        this.velocityVariable = this.gpuCompute.addVariable( "textureVelocity", VelocityFrag, dtVelocity, );
        this.positionVariable = this.gpuCompute.addVariable( "texturePosition", PositionFrag, dtPosition );
        this.orgnlPositionVariable = this.gpuCompute.addVariable( "textureOrgnlPosition", OrgnlPositionFrag, dtOrgnlPosition );

        // 一連の関係性を構築するためのおまじない
        let variables = [this.positionVariable, this.velocityVariable, this.orgnlPositionVariable];
        this.gpuCompute.setVariableDependencies( this.velocityVariable, variables );
        this.gpuCompute.setVariableDependencies( this.positionVariable, variables );
        this.gpuCompute.setVariableDependencies( this.orgnlPositionVariable, variables );



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
        var orgnlPosition = this.gpuCompute.createTexture();
        this.fillTextures( dtPosition, dtVelocity, orgnlPosition);
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
        var positions = new Float32Array( this.PARTICLES * 4 );
        //var p = 0;
        let xCounter = 1;
        let yCounter = 1;
        let p = 0.0;
        for ( var k = 0, kl = positions.length; k < kl; k += 4 ) {
            // Position
            xCounter ++;
            if(xCounter % this.WIDTH == 0)
            {
                yCounter++;
                p += 0.05;
            }
            var x, y, z;
            x = (-0.5 + (xCounter%this.WIDTH)/this.WIDTH)*this.imgWidth;
            y = (-0.5 + (yCounter%this.WIDTH)/this.WIDTH)*this.imgHeight;
            z = 0;
            // posArrayの実態は一次元配列なので
            // x,y,z,wの順番に埋めていく。
            // wは今回は使用しないが、配列の順番などを埋めておくといろいろ使えて便利
            positions[ k + 0 ] = x;
            positions[ k + 1 ] = y;
            positions[ k + 2 ] = z;
            positions[ k + 3 ] = 1.0;

        }

        // uv情報の決定。テクスチャから情報を取り出すときに必要
        var uvs = new Float32Array( this.PARTICLES * 2 );
        var xywidth = new Float64Array( 3 );
        xywidth[2] = this.WIDTH;
        p = 0;
        for ( var j = 1; j < this.WIDTH; j++ ) {
            for ( var i = 1; i < this.WIDTH; i++ ) {
                xywidth[0] = i;
                xywidth[1] = j;
                uvs[ p++ ] = xywidth[0] / ( xywidth[2] )-(1.0/xywidth[2]);
                uvs[ p++ ] = xywidth[1] / ( xywidth[2] )-(1.0/xywidth[2]);
            }
        }

        // attributeをgeometryに登録する
        this.geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 4 ) );
        this.geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );



        // uniform変数をオブジェクトで定義
        // 今回はカメラをマウスでいじれるように、計算に必要な情報もわたす。
        this.particleUniforms = {
            texturePosition: { value: null },
            textureVelocity: { value: null },
            pointSize:{value:1.5},
            corner:{value:1.0},
            texture01:{value:this.texture},
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
        particles.matrixAutoUpdate = true;
        particles.updateMatrix();
        particles.frustumCulled = false;
        particles.castShadow = true;
        particles.receiveShadow = true;

        // パーティクルをシーンに追加
        this.scene.add( particles );
    }


    public fillTextures( texturePosition, textureVelocity, orgnlPosition ) {

        // textureのイメージデータをいったん取り出す
        var posArray = texturePosition.image.data;
        var velArray = textureVelocity.image.data;
        var orgnlPosArray = orgnlPosition.image.data;

        // パーティクルの初期の位置は、ランダムなXZに平面おく。
        // 板状の正方形が描かれる
        let xCounter = 1;
        let yCounter = 1;
        let p = 0.0;
        for ( var k = 0, kl = posArray.length; k < kl; k += 4 ) {
            // Position
            xCounter ++;
            if(xCounter % this.WIDTH == 0)
            {
                yCounter++;
                p += 0.05;
            }
            var x, y, z;
            x = (-0.5 + (xCounter%this.WIDTH)/this.WIDTH)*this.imgWidth;
            y = (-0.5 + (yCounter%this.WIDTH)/this.WIDTH)*this.imgHeight;
            z = 0;
            // posArrayの実態は一次元配列なので
            // x,y,z,wの順番に埋めていく。
            // wは今回は使用しないが、配列の順番などを埋めておくといろいろ使えて便利
            posArray[ k + 0 ] = x;
            posArray[ k + 1 ] = y;
            posArray[ k + 2 ] = z;
            posArray[ k + 3 ] = Math.random();

            orgnlPosArray[ k + 0 ] = x;
            orgnlPosArray[ k + 1 ] = y;
            orgnlPosArray[ k + 2 ] = z;
            orgnlPosArray[ k + 3 ] = 0;

            // this.positions[ k + 0 ] = x;
            // this.positions[ k + 1 ] = y;
            // this.positions[ k + 2 ] = z;
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
        // this.camera.aspect = window.innerWidth / window.innerHeight;
        // this.camera.updateProjectionMatrix();
        // this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.particleUniforms.cameraConstant.value = this.getCameraConstant( this.camera );
    }


    public update =(time?)=> {
        if(this.isGpuUpdate)
        {
            this.gpuCompute.compute();

            // 計算した結果が格納されたテクスチャをレンダリング用のシェーダーに渡す

        }

        this.particleUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
        this.particleUniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;



        this.render();
    }



    public render() {


        this.renderer.render( this.scene, this.camera );
    }
}


