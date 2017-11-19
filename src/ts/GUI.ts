declare function require(x: string): any;
import * as dat from "dat-gui";
import GUIParameters from "./GUIParameters";
// const setting = require("./JSON/gui.json");
// console.log(setting);
export default class GUI
{
    public gui:dat.GUI;
    public particle:any;
    public parameters:GUIParameters;
    constructor ()
    {


        this.parameters = new GUIParameters;
        // this.gui = new dat.GUI({load:setting});
        this.gui = new dat.GUI();
        this.gui.width = 400;

        this.gui.remember(this.parameters);
        this.gui.close();
        // this.gui.toggleHide();
        console.log(this.gui);


        this.particle = this.gui.addFolder("particle");


        this.init();

    }

    public save()
    {

    }

    public init()
    {

        this.particle.add(this.parameters,"particleCorner",0.0,1.0);
        this.particle.add(this.parameters,"particleSize",0.0,3.0);


    }




};