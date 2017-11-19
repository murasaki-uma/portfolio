declare function require(x: string): any;
import * as THREE from 'three';
const SimplexNoise = require( '../../node_modules/simplex-noise/simplex-noise.js');
// *********** ひとつめのシーン *********** //
export default class Scene01{

    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    private renderer:THREE.WebGLRenderer;
    private geometry:THREE.BoxGeometry;
    private material:THREE.MeshBasicMaterial;
    private boxs:THREE.Mesh[] = [];
    private simplex = new SimplexNoise();

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
        this.camera.position.z = 100;
        this.camera.position.y = 20;



        let planegeo = new THREE.PlaneGeometry(100,100,1,1);
        let planemat = new THREE.MeshPhongMaterial({color:0xffffff,side:THREE.DoubleSide});
        let plane = new THREE.Mesh(planegeo,planemat);

        plane.rotation.x = -Math.PI/2;
        plane.position.y = -10;

        plane.castShadow = true;
        plane.receiveShadow = true;

        this.scene.add(plane);



        let boxGeo = new THREE.BoxGeometry(5,5,5);
        // let planemat = new THREE.MeshPhongMaterial({color:0xffffff,side:THREE.DoubleSide});
        for(let i = 0; i < 5; i++)
        {
            let box = new THREE.Mesh(boxGeo,planemat);

            box.castShadow = true;
            box.receiveShadow = true;

            box.position.y = 10;
            box.position.x = -i*6;
            this.boxs.push(box);
            this.scene.add(box);
        }






        var pointLight = new THREE.PointLight( 0xffffff );
        pointLight.castShadow = true;
        pointLight.shadow.camera.near = 1;
        pointLight.shadow.camera.far = 100;
        pointLight.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects
        var geometry = new THREE.SphereGeometry( 0.3, 12, 6 );
        var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
        var sphere = new THREE.Mesh( geometry, material );
        pointLight.add( sphere );

        pointLight.position.set(0,50,0);
        this.scene.add(pointLight);


        let d = new THREE.DirectionalLight(0xffffff,0.2);
        d.position.set(0,10,10);
        this.scene.add(d);
        this.scene.add(new THREE.AmbientLight(0xffffff,0.1));



        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;

        // this.scene.add(this.createRibbon());
    }

    public createRibbon()
    {
        var geometry = new THREE.BufferGeometry();
// create a simple square shape. We duplicate the top left and bottom right
// vertices because each vertex needs to appear once per triangle.
        var vertices = new Float32Array( [
            -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,
            1.0,  1.0,  1.0,

            1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0, -1.0,  1.0
        ] );

// itemSize = 3 because there are 3 values (components) per vertex
        geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        var mesh = new THREE.Mesh( geometry, material );
        return mesh;
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

    private snoiseVec3( x:THREE.Vector3 ){

        let s  = this.simplex.noise3D( x.x,x.y,x.z );
        let s1 = this.simplex.noise3D( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 );
        let s2 = this.simplex.noise3D( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 );
        let c = new THREE.Vector3( s , s1 , s2 );
        return c;

    }

    private curlNoise( p:THREE.Vector3)
    {

        let e = 0.1;
        let dx = new THREE.Vector3( e   , 0.0 , 0.0 );
        let dy = new THREE.Vector3( 0.0 , e   , 0.0 );
        let dz = new THREE.Vector3( 0.0 , 0.0 , e   );


        var _p  = new THREE.Vector3(p.x,p.y,p.z).sub(dx);
        let p_x0 = this.snoiseVec3( _p);

        _p  = new THREE.Vector3(p.x,p.y,p.z).add(dx);
        let p_x1 = this.snoiseVec3( _p );

        _p = new THREE.Vector3(p.x,p.y,p.z).sub(dy);
        let p_y0 = this.snoiseVec3( _p );

        _p = new THREE.Vector3(p.x,p.y,p.z).add(dy);
        let p_y1 = this.snoiseVec3( _p );

        _p = new THREE.Vector3(p.x,p.y,p.z).sub(dz);
        let p_z0 = this.snoiseVec3( _p );

        _p = new THREE.Vector3(p.x,p.y,p.z).add(dz);
        let p_z1 = this.snoiseVec3( _p );

        let x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
        let y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
        let z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

        //console.log(p_z0);
        let divisor = 1.0 / ( 2.0 * e );
        let noisevec = new THREE.Vector3( x , y , z );
        noisevec.multiplyScalar(divisor);
        return noisevec;

    }

    // ******************************************************
    public update(time)
    {

        console.log(time);
        // let recordPos = new THREE.Vector3();
        //
        // let destination = new THREE.Vector3(0,0,0);
        // if(Math.random() < 0.01)
        // {
        //     destination.x = Math.random() *50 -30;
        //     destination.y = Math.random() *50 -30;
        //     destination.z = Math.random() *50 -30;
        // }
        // for(let i = 0; i < this.boxs.length; i++)
        // {
        //     let boxpos = this.boxs[i].position;
        //     let baseVex = destination.sub(boxpos).normalize();
        //     let scale = 0.1;
        //     // if(i == 0)
        //     // {
        //
        //         let vector = this.curlNoise(new THREE.Vector3(boxpos.x*scale,boxpos.y*scale,boxpos.z*scale));
        //         console.log(vector);
        //         vector.normalize();
        //         vector.multiplyScalar(0.1);
        //         this.boxs[i].position.add(vector);
        //         recordPos = this.boxs[i].position;
        //     // } else
        //     // {
        //     //     this.boxs[i].position.set(recordPos.x,recordPos.y,recordPos.z);
        //     // }
        //
        // }
        // this.particleGallerySystem.particleUniforms.corner.value
    }



}
