declare function require(x: string): any;
import * as THREE from 'three';
import BasicParticleGallerySystem from "./BasicParticleGallerySystem";
const monalisa = require("./texture/monalisa_min.jpg");
const OverImageVert = require('./GLSL/OverImage.vert');
const OverImageFrag = require('./GLSL/OverImage.frag');

const MotionBlurVert = require('./GLSL/MotionBlur.vert');
const MotionBlurFrag = require('./GLSL/MotionBlur.frag');

// *********** ひとつめのシーン *********** //
export default class SceneTemplate{

    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    private renderer:THREE.WebGLRenderer;
    private geometry:THREE.BoxGeometry;
    private material:THREE.MeshBasicMaterial;
    private cube:THREE.Mesh;
    public particleGarllerySystem:BasicParticleGallerySystem;

    public mouseAcceleration:THREE.Vector2;
    public mouseXY:THREE.Vector2;
    public pre_mouseXY:THREE.Vector2;
    public mouseTrack:THREE.Vector2;

    public isStart:boolean = false;

    public sceneRotate:THREE.Vector3;


    public overImageUniforms:any;
    public motionBlurUniforms:any;

    public target:THREE.WebGLRenderTarget;

    public isCameraIn:boolean = false;

    // ******************************************************
    constructor(renderer:THREE.WebGLRenderer) {
        this.renderer = renderer;
        this.renderer.setPixelRatio(1);
        this.createScene();

        console.log("scene created!")
    }

    // ******************************************************
    private createScene()
    {

        this.scene = new THREE.Scene();

        // 立方体のジオメトリーを作成

        // カメラを作成
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        // カメラ位置を設定
        this.camera.position.z = 80;


        this.mouseAcceleration = new THREE.Vector2(0,0);
        this.mouseXY = new THREE.Vector2(0,0);
        this.pre_mouseXY = new THREE.Vector2(0,0);
        this.mouseTrack = new THREE.Vector2(0,0);

        this.sceneRotate = new THREE.Vector3(0,0,0);


        this.particleGarllerySystem = new BasicParticleGallerySystem(this.scene,this.camera,this.renderer);
        // this.particleGarllerySystem.setTexture(monalisa);
        this.particleGarllerySystem.init(97*0.97,147*0.97,monalisa);
        this.particleGarllerySystem.particleUniforms.pointSize.value = 1.0;
        this.particleGarllerySystem.positionUniforms.threshold.value = 1.2;



        this.overImageUniforms = {
            threshold:this.particleGarllerySystem.threshold,
            texture:{value:this.particleGarllerySystem.texture},
            imgWidth:{value:97.0},
            imgHeight:{value:147.0},
            textureOriginal:{value:null}

        };
        let planeGeo = new THREE.PlaneGeometry(97.0,147.0);
        let planeMat = new THREE.ShaderMaterial({
            uniforms:this.overImageUniforms,
            vertexShader: OverImageVert,
            fragmentShader: OverImageFrag,
            side:THREE.DoubleSide
        });

        // let planeMat02 = new THREE.MeshBasicMaterial({color:0xffffff});


        let mesh = new THREE.Mesh(planeGeo,planeMat);
        mesh.position.z = 0.15;
        this.scene.add(mesh);


        this.motionBlurUniforms = {
            texture:{value:null},
            alpha:{value:0.0}
        };

        let motionBlurPlaneGeo = new THREE.PlaneGeometry(2,2);
        let motionBlurPlaneMat = new THREE.ShaderMaterial({
            uniforms:this.motionBlurUniforms,
            vertexShader: MotionBlurVert,
            fragmentShader: MotionBlurFrag,
            side:THREE.DoubleSide,
            transparent:true
        });


        let motionblurmesh = new THREE.Mesh(motionBlurPlaneGeo,motionBlurPlaneMat);
        this.scene.add(motionblurmesh);


        this.target = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
        this.target.texture.format = THREE.RGBAFormat;

        let control = new THREE.OrbitControls(this.camera,this.renderer.domElement);

    }

    public onWindowResize()

    {
        this.particleGarllerySystem.onWindowResize();
    }


    // ******************************************************
    public click()
    {
        this.isStart = !this.isStart;
    }

    // ******************************************************
    public keyUp(e:KeyboardEvent)
    {

    }

    // ******************************************************
    public mouseMove(e:MouseEvent)
    {
        // console.log(e);
        this.mouseXY.set(e.x,e.y);

        let x = e.x/window.innerWidth - 0.5;
        let y = e.y/window.innerHeight - 0.5;
        this.particleGarllerySystem.velocityUniforms.mouseXY.value = new THREE.Vector2(x,y);
    }

    // ******************************************************
    public keyDown(e:KeyboardEvent)
    {


        if(e.key === 'z')
        {
            this.renderer.render(this.scene,this.camera,this.target);
            this.motionBlurUniforms.texture.value = this.target.texture;
            this.motionBlurUniforms.alpha.value = 0.6;
            this.isCameraIn = !this.isCameraIn;
        }
    }

    // ******************************************************
    public onMouseDown(e:MouseEvent)
    {


    }

    // ******************************************************
    public update(time)
    {




        if(this.particleGarllerySystem.threshold.value <= 0.1)
        {
            // this.sceneRotate.x += (-Math.PI/2.0 - this.sceneRotate.x) * 0.01;
            // this.sceneRotate.y += 0.01;
            // this.scene.rotation.set(this.sceneRotate.x,this.sceneRotate.y,0);


        }

        // this.camera.position.z += (50.0 - this.camera.position.z) * 0.01;
        this.mouseTrack.x += (this.mouseXY.x - this.mouseTrack.x) * 0.03;
        this.mouseTrack.y += (this.mouseXY.y - this.mouseTrack.y) * 0.03;


        this.mouseAcceleration.set(
            (this.mouseXY.x - this.mouseTrack.x)/window.innerWidth,
            -(this.mouseXY.y - this.mouseTrack.y)/window.innerHeight
        );

        // console.log(this.mouseAcceleration);
        this.particleGarllerySystem.velocityUniforms.mouseAcceleration.value = this.mouseAcceleration;
        this.particleGarllerySystem.positionUniforms.mouseAcceleration.value = this.mouseAcceleration;

        if(this.isStart)
        {

            if(this.particleGarllerySystem.threshold.value > 0.0)
            {
                this.particleGarllerySystem.threshold.value -= 0.008;

                if(this.particleGarllerySystem.threshold.value < 0.0)
                {
                    this.particleGarllerySystem.threshold.value  = 0.0;
                }


            }
        }
        if(!this.isCameraIn)
        {
            this.camera.position.z += (80.0 - this.camera.position.z) * 0.1;
        }
        else
        {
            this.camera.position.z += (40.0 - this.camera.position.z) * 0.1;
        }

        // if(this.motionBlurUniforms.alpha.value > 0.01)
        // {
            this.motionBlurUniforms.alpha.value += (0.0 - this.motionBlurUniforms.alpha.value ) * 0.15;
        // }


        this.overImageUniforms.textureOriginal.value = this.particleGarllerySystem.gpuCompute.getCurrentRenderTarget( this.particleGarllerySystem.originalVariable ).texture;

        this.particleGarllerySystem.update(time);
        this.pre_mouseXY.set(
            this.mouseXY.x,
            this.mouseXY.y
        )


    }


}
