declare function require(x: string): any;
var css = require('../styl/main.styl');

import ParticleGallerySystem from './ParticleGallerySystem';

"use strict"
declare function require(x: string): any;
import * as $ from "jquery";

import VThree from "./VThree";
import Scene01 from "./Scene01";
import Scene02 from "./Scene02";
import MosaicBlockParticle from "./MosaicBlockParticle";


class Main
{
    public vthree:VThree;
    public scene01:Scene01;
    public scene02:Scene02;
    public scene03:MosaicBlockParticle;


    constructor() {


        this.vthree = new VThree();
        this.scene01 = new Scene01(this.vthree.renderer);
        this.scene02 = new Scene02(this.vthree.renderer);
        this.scene03 = new MosaicBlockParticle(this.vthree.renderer);

        this.vthree.addScene(this.scene03);
        // this.vthree.addScene(this.scene02);
        // this.vthree.addScene(this.scene01);


        this.vthree.draw();

        this.vthree.isUpdate = true;

    }


}


window.onload = function() {



    const main = new Main();



}

