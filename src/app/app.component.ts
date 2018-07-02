import { Component } from '@angular/core';


import 'core-js';
import RainRenderer from "./shared/rain-rendere.jsr";
import Raindrops from "./shared/raindrops.js";
import loadImages from "./shared/image-loader.js";
import createCanvas from "./shared/create-canvas.js";
import TweenLite from 'gsap.js';
import times from './shared/times.js';
import {random,chance} from './shared/random.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
}
