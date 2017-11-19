import * as THREE from 'three';
import ParticleGallerySystem from './ParticleGallerySystem';
// *********** ひとつめのシーン *********** //
export default class Scene01{

    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    private renderer:THREE.WebGLRenderer;
    private geometry:THREE.BoxGeometry;
    private material:THREE.MeshBasicMaterial;
    private cube:THREE.Mesh;
    private particleGallerySystem:ParticleGallerySystem;

    // ******************************************************
    constructor(renderer:THREE.WebGLRenderer) {
        this.renderer = renderer;
        this.createScene();
    }

    // ******************************************************
    private createScene()
    {

        this.scene = new THREE.Scene();
        // カメラを作成
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        // カメラ位置を設定
        this.camera.position.z = 80;
        // this.camera.position.y = 10;

        this.particleGallerySystem = new ParticleGallerySystem(this.scene,this.camera,this.renderer);
        this.particleGallerySystem.init(97,145);

        let planegeo = new THREE.PlaneGeometry(100,100,1,1);
        let planemat = new THREE.MeshPhongMaterial({color:0xffffff,side:THREE.DoubleSide});
        let plane = new THREE.Mesh(planegeo,planemat);

        plane.rotation.x = -Math.PI/2;

        plane.castShadow = true;
        plane.receiveShadow = true;

        // this.scene.add(plane);



        let boxGeo = new THREE.BoxGeometry(10,10,10);
        // let planemat = new THREE.MeshPhongMaterial({color:0xffffff,side:THREE.DoubleSide});
        let box = new THREE.Mesh(boxGeo,planemat);

        box.castShadow = true;
        box.receiveShadow = true;

        box.position.y = 10;
        // this.scene.add(box);



        var pointLight = new THREE.PointLight( 0xffffff );
        pointLight.castShadow = true;
        pointLight.shadow.camera.near = 1;
        pointLight.shadow.camera.far = 100;
        pointLight.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects
        var geometry = new THREE.SphereGeometry( 0.3, 12, 6 );
        var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        var sphere = new THREE.Mesh( geometry, material );
        // pointLight.add( sphere );

        pointLight.position.set(0,50,0);
        this.scene.add(pointLight);


        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;


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

        this.particleGallerySystem.update()

        // this.particleGallerySystem.particleUniforms.corner.value
    }



}
