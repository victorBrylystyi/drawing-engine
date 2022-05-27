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
            './assets/brush/brush_1.png',
            './assets/brush/brush_2.png',
            './assets/brush/brush_3.png',
            './assets/brush/brush_4.png',
            './assets/brush/brush_5.png',
            './assets/brush/brush_6.png',
            './assets/brush/brush_7.png',
            './assets/brush/brush_8.png',
            './assets/brush/brush_9.png',

            './assets/grain/grain_1.png',
            './assets/grain/grain_2.png',
            './assets/grain/grain_3.png',
            './assets/grain/grain_4.png',
            './assets/grain/grain_5.png',
            './assets/grain/grain_6.png',
            './assets/grain/grain_7.png',
            './assets/grain/grain_8.png',
            './assets/grain/uv_grid.png',
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
                        texture.wrapS = THREE.RepeatWrapping
                        texture.wrapT = THREE.RepeatWrapping
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

export default App


