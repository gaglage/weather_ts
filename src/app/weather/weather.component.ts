import { Component, OnInit } from '@angular/core';
import 'core-js';
import RainRenderer from './shared/rain-renderer';
import Raindrops from './shared/raindrops';
import loadImages from './shared/image-loader';
import createCanvas from './shared/create-canvas';
import TweenLite from 'gsap';
import times from './shared/times';
import { random, chance } from './shared/random';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit {

  textureRainFg;
  textureRainBg;
  textureStormLightningFg;
  textureStormLightningBg;
  textureFalloutFg;
  textureFalloutBg;
  textureSunFg;
  textureSunBg;
  textureDrizzleFg;
  textureDrizzleBg;
  dropColor;
  dropAlpha;

  textureFg;
  textureFgCtx;
  textureBg;
  textureBgCtx;
  textureBgSize = {
    width: 384,
    height: 256
  };
  textureFgSize = {
    width: 96,
    height: 64
  };

  raindrops;
  renderer;
  canvas;

  parallax = { x: 0, y: 0 };

  weatherData = null;
  curWeatherData = null;
  blend = { v: 0 };

  constructor() { }



  ngOnInit() {
    this.loadTextures();
  }




  loadTextures() {
    loadImages([
      { name: 'dropAlpha', src: 'assets/weather/drop-alpha.png' },
      { name: 'dropColor', src: 'assets/weather/drop-color.png' },

      { name: 'textureRainFg', src: 'assets/weather/weather/texture-rain-fg.png' },
      { name: 'textureRainBg', src: 'assets/weather/weather/texture-rain-bg.png' },

      { name: 'textureStormLightningFg', src: 'assets/weather/weather/texture-storm-lightning-fg.png' },
      { name: 'textureStormLightningBg', src: 'assets/weather/weather/texture-storm-lightning-bg.png' },

      { name: 'textureFalloutFg', src: 'assets/weather/weather/texture-fallout-fg.png' },
      { name: 'textureFalloutBg', src: 'assets/weather/weather/texture-fallout-bg.png' },

      { name: 'textureSunFg', src: 'assets/weather/weather/texture-sun-fg.png' },
      { name: 'textureSunBg', src: 'assets/weather/weather/texture-sun-bg.png' },

      { name: 'textureDrizzleFg', src: 'assets/weather/weather/texture-drizzle-fg.png' },
      { name: 'textureDrizzleBg', src: 'assets/weather/weather/texture-drizzle-bg.png' },
    ]).then((images) => {
      this.textureRainFg = images.textureRainFg.img;
      this.textureRainBg = images.textureRainBg.img;

      this.textureFalloutFg = images.textureFalloutFg.img;
      this.textureFalloutBg = images.textureFalloutBg.img;

      this.textureStormLightningFg = images.textureStormLightningFg.img;
      this.textureStormLightningBg = images.textureStormLightningBg.img;

      this.textureSunFg = images.textureSunFg.img;
      this.textureSunBg = images.textureSunBg.img;

      this.textureDrizzleFg = images.textureDrizzleFg.img;
      this.textureDrizzleBg = images.textureDrizzleBg.img;

      this.dropColor = images.dropColor.img;
      this.dropAlpha = images.dropAlpha.img;

      this.init();
    });
  }


  init() {
    this.canvas = document.querySelector('#container');

    const dpi = window.devicePixelRatio;
    this.canvas.width = window.innerWidth * dpi;
    this.canvas.height = window.innerHeight * dpi;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';

    this.raindrops = new Raindrops(
      this.canvas.width,
      this.canvas.height,
      dpi,
      this.dropAlpha,
      this.dropColor, {
        trailRate: 1,
        trailScaleRange: [0.2, 0.45],
        collisionRadius: 0.45,
        dropletsCleaningRadiusMultiplier: 0.28,
      }
    );

    this.textureFg = createCanvas(this.textureFgSize.width, this.textureFgSize.height);
    this.textureFgCtx = this.textureFg.getContext('2d');
    this.textureBg = createCanvas(this.textureBgSize.width, this.textureBgSize.height);
    this.textureBgCtx = this.textureBg.getContext('2d');

    this.generateTextures(this.textureRainFg, this.textureRainBg);

    this.renderer = new RainRenderer(this.canvas, this.raindrops.canvas, this.textureFg, this.textureBg, null, {
      brightness: 1.04,
      alphaMultiply: 6,
      alphaSubtract: 3,
      // minRefraction:256,
      // maxRefraction:512
    });

    this.setupEvents();
  }

  setupEvents() {

    this.setupParallax();
    this.setupWeather();
    this.setupFlash();
  }
  setupParallax() {
    document.addEventListener('mousemove', (event) => {
      const x = event.pageX;
      const y = event.pageY;

      TweenLite.to(this.parallax, 1, {
        x: ((x / this.canvas.width) * 2) - 1,
        y: ((y / this.canvas.height) * 2) - 1,
        ease: Quint.easeOut,
        onUpdate: () => {
          this.renderer.parallaxX = this.parallax.x;
          this.renderer.parallaxY = this.parallax.y;
        }
      });
    });
  }
  setupFlash() {
    setInterval(() => {
      if (chance(this.curWeatherData.flashChance)) {
        this.flash(this.curWeatherData.bg, this.curWeatherData.fg, this.curWeatherData.flashBg, this.curWeatherData.flashFg);
      }
    }, 500);
  }
  setupWeather() {
    this.setupWeatherData();
    window.addEventListener('hashchange', (event) => {
      this.updateWeather();
    });
    this.updateWeather();
  }
  setupWeatherData() {
    const defaultWeather = {
      raining: true,
      minR: 20,
      maxR: 50,
      rainChance: 0.35,
      rainLimit: 6,
      dropletsRate: 50,
      dropletsSize: [3, 5.5],
      trailRate: 1,
      trailScaleRange: [0.25, 0.35],
      fg: this.textureRainFg,
      bg: this.textureRainBg,
      flashFg: null,
      flashBg: null,
      flashChance: 0,
      collisionRadiusIncrease: 0.0002
    };

    function weather(data) {
      return Object.assign({}, defaultWeather, data);
    }

    this.weatherData = {
      rain: weather({
        rainChance: 0.35,
        dropletsRate: 50,
        raining: true,
        // trailRate:2.5,
        fg: this.textureRainFg,
        bg: this.textureRainBg
      }),
      storm: weather({
        maxR: 55,
        rainChance: 0.4,
        dropletsRate: 80,
        dropletsSize: [3, 5.5],
        trailRate: 2.5,
        trailScaleRange: [0.25, 0.4],
        fg: this.textureRainFg,
        bg: this.textureRainBg,
        flashFg: this.textureStormLightningFg,
        flashBg: this.textureStormLightningBg,
        flashChance: 0.1
      }),
      fallout: weather({
        minR: 30,
        maxR: 60,
        rainChance: 0.35,
        dropletsRate: 20,
        trailRate: 4,
        fg: this.textureFalloutFg,
        bg: this.textureFalloutBg,
        collisionRadiusIncrease: 0
      }),
      drizzle: weather({
        minR: 10,
        maxR: 40,
        rainChance: 0.15,
        rainLimit: 2,
        dropletsRate: 10,
        dropletsSize: [3.5, 6],
        fg: this.textureDrizzleFg,
        bg: this.textureDrizzleBg
      }),
      sunny: weather({
        rainChance: 0,
        rainLimit: 0,
        droplets: 0,
        raining: false,
        fg: this.textureSunFg,
        bg: this.textureSunBg
      }),
    };
  }
  updateWeather() {
    let hash = window.location.hash;
    let currentSlide = null;
    let currentNav = null;
    if (hash !== '') {
      currentSlide = document.querySelector(hash);
    }
    if (currentSlide == null) {
      currentSlide = document.querySelector('.slide');
      hash = '#' + currentSlide.getAttribute('id');
    }
    currentNav = document.querySelector('[href=\'' + hash + '\']');
    const data = this.weatherData[currentSlide.getAttribute('data-weather')];
    this.curWeatherData = data;

    this.raindrops.options = Object.assign(this.raindrops.options, data);

    this.raindrops.clearDrops();

    TweenLite.fromTo(this.blend, 1, {
      v: 0
    }, {
        v: 1,
        onUpdate: () => {
          this.generateTextures(data.fg, data.bg, this.blend.v);
          this.renderer.updateTextures();
        }
      });

    const lastSlide = document.querySelector('.slide--current');
    if (lastSlide != null) { lastSlide.classList.remove('slide--current'); }

    const lastNav = document.querySelector('.nav-item--current');
    if (lastNav != null) { lastNav.classList.remove('nav-item--current'); }

    currentSlide.classList.add('slide--current');
    currentNav.classList.add('nav-item--current');
  }

  flash(baseBg, baseFg, flashBg, flashFg) {
    const flashValue = { v: 0 };
    function transitionFlash(to, t = 0.025) {
      return new Promise((resolve, reject) => {
        TweenLite.to(flashValue, t, {
          v: to,
          ease: Quint.easeOut,
          onUpdate: () => {
            this.generateTextures(baseFg, baseBg);
            this.generateTextures(flashFg, flashBg, flashValue.v);
            this.trenderer.updateTextures();
          },
          onComplete: () => {
            resolve();
          }
        });
      });
    }
    let lastFlash;
    lastFlash = transitionFlash(1);
    times(random(2, 7), (i) => {
      lastFlash = lastFlash.then(() => {
        return transitionFlash(random(0.1, 1))
      });
    });
    lastFlash = lastFlash.then(() => {
      return transitionFlash(1, 0.1);
    }).then(() => {
      transitionFlash(0, 0.25);
    });

  }
  generateTextures(fg, bg, alpha = 1) {
    this.textureFgCtx.globalAlpha = alpha;
    this.textureFgCtx.drawImage(fg, 0, 0, this.textureFgSize.width, this.textureFgSize.height);

    this.textureBgCtx.globalAlpha = alpha;
    this.textureBgCtx.drawImage(bg, 0, 0, this.textureBgSize.width, this.textureBgSize.height);
  }



}
