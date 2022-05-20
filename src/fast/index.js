import * as THREE from 'three'
import path from 'path-browserify'
import { LoaderIndicator } from '../components/Loader/LoaderIndicator'
import drawEngine from './drawEngine'
import Core from './components/Core'


class App {
    constructor (root) {
        this.rootElement = root
        this.drawEngine = drawEngine
        this.urls = [
            './assets/brush_1.png',
            './assets/brush_2.png',
            './assets/brush_3.png',
            './assets/brush_4.png',
            './assets/brush_5.png',
            './assets/brush_6.png',
            './assets/brush_7.png',
            './assets/brush_8.png',
            './assets/brush_9.png',
            './assets/brush_10.png',
            './assets/brush_11.png',
            './assets/brush_12.png',
            './assets/brush_13.png',
            './assets/brush_14.png',
            './assets/brush_15.png',
            './assets/brush_16.png',
            './assets/brush_17.png',
            './assets/brush_18.png',
            './assets/mouse.png',
        ]
        this.assets = []
        this.count = 0
    }
    init (){
        this.loadElement = new LoaderIndicator(this.rootElement)

        const textureLoader = new THREE.TextureLoader()
        const promiseRes = []

        for (let i = 0; i < this.urls.length; i++) {
            promiseRes[i] = new Promise((resolve, reject) => {
                textureLoader.load(
                    this.urls[i],
                    (texture) => {
                        texture.name = path.parse(this.urls[i]).name
                        // texture.minFilter = THREE.NearestFilter
                        // texture.magFilter = THREE.NearestFilter
                        texture.generateMipmaps = false
                        this.loadElement.updateText(`${this.increment()} of ${this.urls.length}`)
                        this.assets.push(texture)
                        if (this.assets.length === this.urls.length) this.goDrawEngine()
                    },
                    undefined,
                    ( err ) => {
                        reject(err)
                        console.error( 'An error happened.' );
                    }
                )
            })
        }
    }
    increment (){
        this.count += 1 
        return this.count
    }
    goDrawEngine (){
        this.rootElement.removeChild( this.loadElement.holder )
        // this.drawEngine(this.assets,this.rootElement)
        const core = new Core(this.assets,this.rootElement)
    }

}


// const app = () => {

//     const assets = []
//     let count = 0

//     const rootElement = document.querySelector('#root')
//     const loadElement = new LoaderIndicator(rootElement)

//     const textureLoader = new THREE.TextureLoader()
//     const urls = [
//         './assets/brush_1.png',
//         './assets/brush_2.png',
//         './assets/brush_3.png',
//         './assets/brush_4.png',
//         './assets/brush_5.png',
//         './assets/brush_6.png',
//         './assets/brush_7.png',
//         './assets/brush_8.png',
//         './assets/brush_9.png',
//         './assets/brush_10.png',
//         './assets/brush_11.png',
//         './assets/brush_12.png',
//         './assets/brush_13.png',
//         './assets/brush_14.png',
//         './assets/brush_15.png',
//     ]

//     const goApp = () => {
//         rootElement.removeChild( loadElement.holder )
//         drawEngine(assets)
//     }

//     const calculate = () => count +=1

//     for (let i = 0; i < urls.length; i++) {
//         new Promise((resolve, reject) => {
//             textureLoader.load(
//                 urls[i],
//                 (texture) => {
//                     texture.name = path.parse(urls[i]).name
//                     // texture.minFilter = THREE.NearestFilter
//                     // texture.magFilter = THREE.NearestFilter
//                     texture.generateMipmaps = false
//                     loadElement.updateText(`${calculate()} of ${urls.length}`)
//                     assets.push(texture)
//                     if (assets.length === urls.length) goApp()
//                 },
//                 undefined,
//                 ( err ) => {
//                     reject(err)
//                     console.error( 'An error happened.' );
//                 }
//             )
//         })
//     }
// }

export default App


