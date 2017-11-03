declare function require(x: string): any;

import * as THREE from 'three';

const Stats = require('stats-js');
import 'imports-loader?THREE=three!../../node_modules/three/examples/js/controls/OrbitControls';

export default class SceneManager
{
    private stats:any;
    private container;
    private camera:THREE.PerspectiveCamera;
    private renderer:THREE.WebGLRenderer;
    private controls:THREE.OrbitControls;
    constructor()
    {
        this.container = document.createElement( 'div' );
        document.body.appendChild( this.container );
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 5, 15000 );
        this.camera.position.y = 120;
        this.camera.position.z = 200;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor( 0x000000 );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild( this.renderer.domElement );
        this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.stats = new Stats();
        this.container.appendChild( this.stats.domElement );
        window.addEventListener( 'resize', this.onWindowResize, false );
    }

    public onWindowResize = ()=>
    {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );

    }
    public update = () =>
    {
        requestAnimationFrame( this.update );
        this.render();
        this.stats.update();
    }

    public render()
    {
        this.renderer.render( this.scene, this.camera );
    }

}