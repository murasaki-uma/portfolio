declare function require(x: string): any;
import * as THREE from 'three';
import BasicParticleGallerySystem from "./BasicParticleGallerySystem";
const monalisa = require("./texture/MonaLisa.jpg");
// *********** ひとつめのシーン *********** //
export default class SceneTemplate{

    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    private renderer:THREE.WebGLRenderer;
    private geometry:THREE.BoxGeometry;
    private material:THREE.MeshBasicMaterial;
    private cube:THREE.Mesh;
    public particleGarllerySystem:BasicParticleGallerySystem;

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

        // カメラを作成
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        // カメラ位置を設定
        this.camera.position.z = 90;



        this.particleGarllerySystem = new BasicParticleGallerySystem(this.scene,this.camera,this.renderer);
        // this.particleGarllerySystem.setTexture(monalisa);
        this.particleGarllerySystem.init(97,147,monalisa);
        this.particleGarllerySystem.particleUniforms.pointSize.value = 1.0;
        this.particleGarllerySystem.positionUniforms.threshold.value = 1.5;





    }

    public onWindowResize()

    {
        this.particleGarllerySystem.onWindowResize();
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
    public update(time)
    {

        this.particleGarllerySystem.update(time);
        if(this.particleGarllerySystem.positionUniforms.threshold.value > 0.0)
        {
            this.particleGarllerySystem.positionUniforms.threshold.value -= 0.004;

            if(this.particleGarllerySystem.positionUniforms.threshold.value < 0.0)
            {
                this.particleGarllerySystem.positionUniforms.threshold.value  = 0.0;
            }
        }

        this.particleGarllerySystem.velocityUniforms.threshold.value = this.particleGarllerySystem.positionUniforms.threshold.value;

    }



}
