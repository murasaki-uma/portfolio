declare function require(x: string): any;

import * as THREE from 'three';

const Stats = require('stats-js');

import * as $ from 'jquery';

import 'imports-loader?THREE=three!../../node_modules/three/examples/js/controls/OrbitControls';

import GPUComputationRenderer from './GPUComputationRenderer';
const TimelineMax = require('gsap/TimelineMax');
console.log(GPUComputationRenderer);
const TimeLineMax = require('gsap/TimelineMax');
const EASE = require('gsap/EasePack.js');
const ComputePositionFrag = require("./GLSL/ComputePosition.frag");
const ComputeVelocityFrag = require("./GLSL/ComputeVelocity.frag");
const GPUParticleFrag = require("./GLSL/GPUParticle.frag");
const GPUParticleVert = require("./GLSL/GPUParticle.vert");
const ComputeAnimationFrag = require('./GLSL/ComputeAnimation.frag');
const ComputeOriginVertsFrag = require('./GLSL/ComputeOriginVerts.frag');
const OverImageFrag = require('./GLSL/OverImage.frag');
const OverImageVerts = require('./GLSL/OverImage.vert');
console.log(ComputePositionFrag);
console.log(ComputeVelocityFrag);
console.log(GPUParticleFrag);
console.log(GPUParticleVert);
console.log(ComputeAnimationFrag);

export default class ParticleGallerySystem
{
    private WIDTH = 200;
    private PARTICLES:number = this.WIDTH * this.WIDTH;

    private stats:any;

    // 基本セット
    private container:any;
    private camera:THREE.PerspectiveCamera;
    private scene:THREE.Scene;
    private renderer:THREE.WebGLRenderer;
    private geometry:THREE.BufferGeometry;
    private controls:THREE.OrbitControls;

    private isFirstUpdate:boolean = true;




    // gpgpuをするために必要なオブジェクト達
    private gpuCompute:any;
    private velocityVariable;
    private positionVariable;
    private animationVariable;
    private originVertsVariable;

    private positionUniforms:any;
    private velocityUniforms:any;
    private particleUniforms;
    private animationUniforms;
    private originVertsUniforms;
    private effectController:any;


    private imgWidth:number = 80.0;
    private imgHeight:number = 100.0;
    public galleryCount =  0;
    public imgNum:number = 2;


    public threshold = {value:0.0};
    public tween_threshold:any;
    public tween_translate:any;
    public tween_sceneTranslate:any;

    public tween_cameraPosition:any;

    public galleryMoveStep:number = -100;
    public scenePos:THREE.Vector3;
    public translatePosition:THREE.Vector3;
    public pre_translatePosition:THREE.Vector3;
    public timer:number = 0;
    public timerSpeed:number = 0.01;

    public animationOriginalArray = [];
    public isAnimationTimeReset:boolean = false;

    public imgUniforms:any;
    public overImgMesh:THREE.Mesh;
    public tween_overImgPos:any;

    public textures:THREE.Texture[] = [];

    constructor()
    {
        this.init();
        this.animate();
    }

    public init() {

        this.textures.push(new THREE.TextureLoader().load( "texture/MonaLisa.jpg" ));
        this.textures.push(new THREE.TextureLoader().load( "texture/PearlGirl.jpg" ));

        // 一般的なThree.jsにおける定義部分
        this.container = document.createElement( 'div' );
        this.container.id = "test";
        document.body.appendChild( this.container );
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 5, 15000 );
        this.camera.position.y = 0;
        this.camera.position.x = 0;
        this.camera.position.z = 150;
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor( 0x000000 );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );
        // this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        window.addEventListener( 'resize', this.onWindowResize, false );
        this.container.addEventListener('click',this.onClick,false);

        this.initValues();

        this.initComputeRenderer();

        this.initPosition();

        this.onWindowResize();

        this.stats = new Stats();
        document.body.appendChild( this.stats.domElement );


    }

    public initValues()
    {
        this.scenePos = new THREE.Vector3(0,0,0);
        this.translatePosition = new THREE.Vector3(0,0,0);
        this.pre_translatePosition = new THREE.Vector3(0,0,0);
        this.tween_sceneTranslate = new TimelineMax({delay:0.0,repeat:0});
        this.tween_threshold = new TimelineMax({delay:0.0,repeat:0});
        this.tween_translate = new TimelineMax({delay:0,repeat:0});
        this.tween_cameraPosition = new TimelineMax({delay:0,repeat:0});
        this.tween_overImgPos = new TimeLineMax({delay:0,repeat:0});
    }


    public initComputeRenderer() {

        this.gpuCompute = new GPUComputationRenderer( this.WIDTH, this.WIDTH, this.renderer );

        let dtPosition = this.gpuCompute.createTexture();
        let dtVelocity = this.gpuCompute.createTexture();
        let dtAnimation = this.gpuCompute.createTexture();
        let dtOriginVerts = this.gpuCompute.createTexture();
        this.fillTextures( dtPosition, dtVelocity ,dtAnimation, dtOriginVerts);

        this.velocityVariable = this.gpuCompute.addVariable( "textureVelocity", ComputeVelocityFrag, dtVelocity );
        this.positionVariable = this.gpuCompute.addVariable( "texturePosition", ComputePositionFrag, dtPosition );
        this.animationVariable = this.gpuCompute.addVariable('textureAnimation', ComputeAnimationFrag,dtAnimation);
        this.originVertsVariable = this.gpuCompute.addVariable('textureOriginVerts', ComputeOriginVertsFrag,dtOriginVerts);

        let valArray = [ this.positionVariable, this.velocityVariable,this.animationVariable, this.originVertsVariable ];
        this.gpuCompute.setVariableDependencies( this.velocityVariable, valArray );
        this.gpuCompute.setVariableDependencies( this.positionVariable, valArray );
        this.gpuCompute.setVariableDependencies( this.animationVariable, valArray );
        this.gpuCompute.setVariableDependencies( this.originVertsVariable, valArray );



        this.positionUniforms = this.positionVariable.material.uniforms;
        this.velocityUniforms = this.velocityVariable.material.uniforms;
        this.animationUniforms = this.animationVariable.material.uniforms;
        this.originVertsUniforms = this.originVertsVariable.material.uniforms;

        this.positionUniforms.translatePos = {value:this.translatePosition};
        this.positionUniforms.preTranslatePos = {value:this.pre_translatePosition};
        this.positionUniforms.threshold = this.threshold;
        this.positionUniforms.galleryCount = {value: this.galleryCount};
        this.positionUniforms.texImgWidth  = {value:this.imgWidth};
        this.positionUniforms.texImgHeight = {value:this.imgHeight};
        this.positionUniforms.galleryMoveStep = {value:this.galleryMoveStep};
        this.positionUniforms.scenePos = {value:this.scenePos};

        this.velocityUniforms.translatePos = {value:this.translatePosition};
        this.velocityUniforms.threshold = this.threshold;
        this.velocityUniforms.galleryCount = {value: this.galleryCount};
        this.velocityUniforms.texImgWidth  = {value:this.imgWidth};
        this.velocityUniforms.texImgHeight = {value:this.imgHeight};


        this.animationUniforms.translatePos = {value:this.translatePosition};
        this.animationUniforms.threshold = this.threshold;
        this.animationUniforms.texImgWidth  = {value:this.imgWidth};
        this.animationUniforms.texImgHeight = {value:this.imgHeight};
        this.animationUniforms.galleryCount = {value: this.galleryCount};
        this.animationUniforms.isReset = {value:false};


        this.originVertsUniforms.translatePos = {value:this.translatePosition};
        this.originVertsUniforms.threshold = this.threshold;
        this.originVertsUniforms.texImgWidth  = {value:this.imgWidth};
        this.originVertsUniforms.texImgHeight = {value:this.imgHeight};
        this.originVertsUniforms.galleryCount = {value: this.galleryCount};
        this.originVertsUniforms.isReset = {value:false};

        var error = this.gpuCompute.init();
        if ( error !== null ) {
            console.error( error );
        }
    }

    public restartSimulation() {
        var dtPosition = this.gpuCompute.createTexture();
        var dtVelocity = this.gpuCompute.createTexture();
        let dtAnimation = this.gpuCompute.createTexture();
        let dtOriginVerts = this.gpuCompute.createTexture();
        this.fillTextures( dtPosition, dtVelocity ,dtAnimation, dtOriginVerts);
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
            textureAnimation: {value: null},
            textureOriginVerts: {value: null},
            scenePos: {value:this.scenePos},
            translatePos:{value: this.translatePosition},
            cameraConstant: { value: this.getCameraConstant(this.camera) },
            map : {value: this.textures[0]},
            mapNext : {value: this.textures[1]},
            texImgWidth : {value:this.imgWidth},
            texImgHeight : {value:this.imgHeight}
        };



        // Shaderマテリアル これはパーティクルそのものの描写に必要なシェーダー
        var material = new THREE.ShaderMaterial( {
            uniforms:       this.particleUniforms,
            vertexShader:   GPUParticleVert,
            fragmentShader: GPUParticleFrag
        });
        material.extensions.drawBuffers = true;
        var particles = new THREE.Points( this.geometry, material );
        particles.matrixAutoUpdate = false;
        particles.updateMatrix();
        particles.frustumCulled = true;

        // パーティクルをシーンに追加
        this.scene.add( particles );


        this.imgUniforms = {
            threshold:this.threshold,
            textureOriginVerts: {value: null},
            textureAnimation: {value: null},
            texturePosition: { value: null },
            map : {value: this.textures[0]},
            mapNext : {value: this.textures[1]},
            texImgWidth : {value:this.imgWidth},
            texImgHeight : {value:this.imgHeight},
            scenePos: {value:this.scenePos},
            galleryMoveStep: {value:this.galleryMoveStep}
        }

        let planeMaterial = new THREE.ShaderMaterial( {
            uniforms:       this.imgUniforms,
            vertexShader:   OverImageVerts,
            fragmentShader: OverImageFrag,
            transparent: true
        });

        let plane = new THREE.PlaneGeometry(this.imgWidth,this.imgHeight);

        this.overImgMesh = new THREE.Mesh(plane, planeMaterial);
        this.overImgMesh.position.z = 6;

        this.scene.add(this.overImgMesh);
    }


    public fillTextures( texturePosition, textureVelocity, textureAnimation, textureOriginVerts ) {

        // textureのイメージデータをいったん取り出す
        var posArray = texturePosition.image.data;
        var velArray = textureVelocity.image.data;
        let amArray = textureAnimation.image.data;
        let vertsArray = textureOriginVerts.image.data;
        let xCounter = 1;
        let yCounter = 1;
        // パーティクルの初期の位置は、ランダムなXZに平面おく。
        // 板状の正方形が描かれる

        for ( var k = 0, kl = posArray.length; k < kl; k += 4 ) {
            // Position
            xCounter ++;
            if(xCounter % this.WIDTH == 0)
            {
                yCounter++;
            }
            var x, y, z;
            x = (-0.5 + (xCounter%this.WIDTH)/this.WIDTH)*this.imgWidth;
            y = (-0.5 + (yCounter%this.WIDTH)/this.WIDTH)*this.imgHeight;
            // x = Math.random()*10-5;
            // z = Math.random()*10-5;
            z = 0;
            // posArrayの実態は一次元配列なので
            // x,y,z,wの順番に埋めていく。
            // wは今回は使用しないが、配列の順番などを埋めておくといろいろ使えて便利
            posArray[ k + 0 ] = x;
            posArray[ k + 1 ] = y;
            posArray[ k + 2 ] = z;
            posArray[ k + 3 ] = Math.random()*30.0+Math.random()*20.0;

            // 移動する方向はとりあえずランダムに決めてみる。
            // これでランダムな方向にとぶパーティクルが出来上がるはず。
            velArray[ k + 0 ] = 0;
            velArray[ k + 1 ] = 0;
            velArray[ k + 2 ] = 0;
            velArray[ k + 3 ] = 0;

            amArray[ k + 0 ] = y;
            amArray[ k + 1 ] = 0;
            amArray[ k + 2 ] = y;
            amArray[ k + 3 ] = 0;

            vertsArray[ k + 0 ] = x;
            vertsArray[ k + 1 ] = y;
            vertsArray[ k + 2 ] = z;
            vertsArray[ k + 3 ] = 0;

            this.animationOriginalArray[ k + 0 ] = y;
            this.animationOriginalArray[ k + 1 ] = 0;
            this.animationOriginalArray[ k + 2 ] = y;
            this.animationOriginalArray[ k + 3 ] = 0;
        }
        console.log(this.animationOriginalArray);
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

    public onClick =(evt:MouseEvent)=>
    {
       if(evt.button == 0)
       {


           let num = this.galleryCount%2;
           let numNext = num +1;
           if(numNext >= this.textures.length)
           {
               numNext = 0;
           }

           this.particleUniforms.map.value = this.textures[num];
           this.particleUniforms.mapNext.value = this.textures[numNext];

           this.imgUniforms.map.value = this.textures[num];
           this.imgUniforms.mapNext.value = this.textures[numNext];

           this.galleryCount++;
           this.isAnimationTimeReset = true;
           console.log('click');

           this.animationUniforms.galleryCount.value = this.galleryCount;

           this.threshold.value = 0.0;
           // this.camera.position.y = 0;

           this.overImgMesh.position.y = 0;


           console.log(EASE.Expo.easeInOut);
           this.tween_threshold = new TimeLineMax({delay:0.5}).to(this.threshold,2.0,{value:1.5});

           this.pre_translatePosition.y = this.translatePosition.y;
           this.translatePosition.y +=  this.galleryMoveStep;
           this.positionUniforms.translatePos.value = this.translatePosition;
           this.positionUniforms.preTranslatePos.value = this.pre_translatePosition;

           this.tween_sceneTranslate = new TimeLineMax({delay:0.0,ease:EASE.Expo.easeOut}).to(this.scenePos,0.6,{y:-this.translatePosition.y});

           this.tween_overImgPos = new TimeLineMax({delay:0.0,ease:EASE.Expo.easeOut}).to(this.overImgMesh.position,0.7,{y:-this.galleryMoveStep});
           // this.velocityUniforms.translatePos = {value:this.translatePosition};


       }
    }


    public animate =(time?)=> {
        if(this.isFirstUpdate)
        {
            this.gpuCompute.compute();
            this.isFirstUpdate = false;
        } else
        {




            // this.overImgMesh.position.y = this.scenePos.y;//+this.galleryCount * this.galleryMoveStep;
            this.timer += this.timerSpeed;
            this.positionUniforms.threshold = this.threshold;
            this.animationUniforms.threshold = this.threshold;
            this.velocityUniforms.threshold = this.threshold;
            this.originVertsUniforms.threshold = this.threshold;
            this.originVertsUniforms.isReset.value = this.isAnimationTimeReset;
            this.animationUniforms.isReset.value = this.isAnimationTimeReset;
            this.particleUniforms.scenePos.value = this.scenePos;
            this.imgUniforms.scenePos.value = this.scenePos;

            console.log(this.threshold.value);
            this.render();
            this.stats.update();
        }

        this.isAnimationTimeReset = false;
        requestAnimationFrame( this.animate );
    }



    public render() {

        // 計算用のテクスチャを更新
        this.gpuCompute.compute();

        // 計算した結果が格納されたテクスチャをレンダリング用のシェーダーに渡す
        this.particleUniforms.textureAnimation.value = this.gpuCompute.getCurrentRenderTarget( this.animationVariable ).texture;
        this.particleUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
        this.particleUniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture;
        this.particleUniforms.textureOriginVerts.value = this.gpuCompute.getCurrentRenderTarget( this.originVertsVariable ).texture;


        this.imgUniforms.textureAnimation.value = this.gpuCompute.getCurrentRenderTarget( this.animationVariable ).texture;
        this.imgUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture;
        this.imgUniforms.textureOriginVerts.value = this.gpuCompute.getCurrentRenderTarget( this.originVertsVariable ).texture;

        this.renderer.render( this.scene, this.camera );
        // console.log(this.animationVariable )
    }
}