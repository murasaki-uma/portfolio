declare function require(x: string): any;
const Stats = require('stats-js');
import * as $ from "jquery";
import * as THREE from 'three';
import 'imports-loader?THREE=three!../../node_modules/three/examples/js/controls/OrbitControls';

import GUI from './GUI';
// import GUIParameters
export default class VThree
{
    // 現在のシーンの番号
    public NUM:number = 0;
    // シーンを格納する配列
    public scenes:any[] = [];
    // Renderer
    public renderer:THREE.WebGLRenderer;
    private controls:any[] = [];

    public opacityStep:number = 0.1;
    public opacity:number = 1.0;

    public transparent:boolean = false;
    public key_sceneNext:string = "ArrowRight";
    public key_scenePrev:string = "ArrowLeft";
    private isOrbitControls:boolean = false;
    private stats:any;

    public debugMode:boolean = false;
    public cameras:THREE.Camera[] = [];

    public isUpdate:boolean = true;

    private debugCounter:number = 0;

    public oscValue:any[] = [];

    public gui:GUI;

    constructor(config?:any)
    {

        this.debugMode = (config === undefined? false : config.debugMode);


        // 初期化処理後、イベント登録
        this.init();

        window.addEventListener( 'resize', this.onWindowResize, false );
        window.addEventListener( 'click', this.onClick, false );
        window.addEventListener( 'onmousedown', this.onMouseDown, false );
        document.addEventListener("keydown", this.onKeyDown, true);
        document.addEventListener("keyup", this.onKeyUp, true);
        document.addEventListener("mousemove", this.onMouseMove, true);
        // this.gui = new GUI();
    }

    public initOrbitContorols()
    {
    }

    public reset()
    {
        for(let i = 0; i < this.scenes.length; i++)
        {
            this.scenes[i].reset();
        }
    }
    public init()
    {


        // Rendererを作る
        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha:true});
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.sortObjects = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.domElement.id = "main";
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        document.body.appendChild( this.renderer.domElement );

        this.updateCanvasAlpha();
        this.stats = new Stats();
        document.body.appendChild(this.stats.domElement);


        this.debug();

    }

    // 管理したいシーンを格納する関数

    public addScene(scene:any)
    {

        this.scenes.push(scene);
        this.cameras.push(scene.camera);
        let controls = new THREE.OrbitControls( scene.camera, this.renderer.domElement );
        controls.enableKeys = false;
        controls.enabled = false;
        this.controls.push(controls);

    }


    public onMouseDown = (e:MouseEvent) =>
    {
        this.scenes[this.NUM].onMouseDown(e);
    }


    // ウィンドウの幅が変わったときの処理
    public onWindowResize = () =>
    {
        var windowHalfX = window.innerWidth / 2;
        var windowHalfY = window.innerHeight / 2;
        this.scenes[this.NUM].camera.aspect = window.innerWidth / window.innerHeight;
        this.scenes[this.NUM].camera.updateProjectionMatrix();
        this.scenes[this.NUM].onWindowResize();
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        console.log("resize");
    }

    // 現在のシーン番号が、不適切な値にならないようにチェック
    public checkNum = () =>
    {
        if(this.NUM <0)
        {
            this.NUM = this.scenes.length-1;
        }

        if(this.NUM >= this.scenes.length)
        {
            this.NUM = 0;
        }

    }

    public  onClick = () => {
        this.scenes[this.NUM].click();
    }
    // ←→キーでシーン番号を足し引き

    public onKeyUp = (e:KeyboardEvent) => {
        this.scenes[this.NUM].keyUp(e);
    }


    public nextScene()
    {
        this.NUM++;
        this.checkNum();
        // this.checkGuiOpen();
    }
    public onMouseMove = (e:MouseEvent) =>
    {
        try {
            this.scenes[this.NUM].mouseMove(e);
        } catch(e) {

        }
    }


    public onKeyDown = (e:KeyboardEvent) => {

        console.log(e);
        // console.log(this.NUM);
        try {
            if (e.key == this.key_sceneNext) {
                this.NUM++;
                this.checkNum();
            }
            if (e.key == this.key_scenePrev) {

                this.NUM--;
                this.checkNum();
            }


            if (e.key == "ArrowUp") {
                this.opacity += this.opacityStep;

                if (this.opacity > 1.0) {

                    this.opacity = 1.0;
                }

                this.updateCanvasAlpha();

            }
            if (e.key == "ArrowDown") {

                this.opacity -= this.opacityStep;

                if (this.opacity < 0.0) {

                    this.opacity = 0.0;
                }
                this.updateCanvasAlpha();
            }

            if (e.key == "d") {
                //this.debugCounter++;
            }

            if (e.code == "Space") {
                // this.StartStop();
                if($(".blackScreen").hasClass("start"))
                {
                    $(".blackScreen").removeClass("start");
                    $(".blackScreen").addClass("end");
                } else
                {
                    $(".blackScreen").addClass("start");
                    $(".blackScreen").removeClass("end");
                }

            }


            if (this.debugCounter >= 5) {
                this.changeDebug();
                this.debugCounter = 0;
            }

            console.log(this.NUM);
            this.scenes[this.NUM].keyDown(e);
            for(let i = 0; i < this.controls.length; i++)
            {
                if(i == this.NUM)
                {
                    this.controls[i].enabled = true;
                } else
                {
                    this.controls[i].enabled = false;
                }
            }

        }
        catch (e)
        {

        }

    }


    public StartStop()
    {
        this.isUpdate = !this.isUpdate;
        if(this.isUpdate)
        {
            requestAnimationFrame(this.draw.bind(this));
        }
    }


    public checkGuiOpen()
    {
        for(let i = 0; i < this.scenes.length; i++)
        {
            if(this.NUM == i)
            {


                this.scenes[i].guiOpen();
            }else {
                this.scenes[i].guiClose();
            }
        }
    }


    public updateCanvasAlpha()
    {
        if(this.transparent)
        {
            this.renderer.domElement.style.opacity = this.opacity.toString();
        }

    }

    public nowScene()
    {
        return this.scenes[this.NUM];
    }

    public changeDebug()
    {
        this.debugMode = !this.debugMode;
        this.debug();
    }

    public debug()
    {
        if(this.debugMode)
        {


            $('.dg').css('display','block');
        } else
        {
            $('.dg').css('display','none');
        }
    }

    public start()
    {


    }

    // 最終的な描写処理と、アニメーション関数をワンフレームごとに実行
    public draw(time?) {

        //
        if(this.oscValue.length > 0)
        {
            if(this.oscValue[0] == "/Note1" && this.oscValue[1] == 64 )
            {
                this.NUM = 1;
                this.checkNum();
            }

            if(this.oscValue[0] == "/Note1" && this.oscValue[1] == 63 )
            {
                this.NUM = 0;
                this.checkNum();
            }

            if(this.oscValue[1] == 1)
            {
                // this.scenes[1].replaceShader_WireWave(this.scenes[1].pal_objects[0],0,false);
                // this.scenes[1].isShaderReplace = true;
            }

            if(this.oscValue[1] == 67 )
            {
                this.NUM = 2;
                this.checkNum();
                this.scenes[2].isAnimationStart = true;
            }

            if(this.oscValue[1] == 72 )
            {
                this.NUM = 1;
                this.checkNum();
            }

            if(this.oscValue[1] == 73 )
            {
                this.NUM = 2;
                this.checkNum();
            }


        }



        this.stats.update(time);
        this.scenes[this.NUM].update(time);
        if(!this.scenes[this.NUM].isPostProcessing)
        {
            this.renderer.render(this.scenes[this.NUM].scene, this.scenes[this.NUM].camera);
        }

        if(this.isUpdate)
        {
            requestAnimationFrame(this.draw.bind(this));
        }


        this.oscValue = [];

    }
}

