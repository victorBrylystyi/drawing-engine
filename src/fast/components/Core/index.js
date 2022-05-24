

import * as THREE from 'three'

import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import DrawingEngine from '../DrawingEngine'
import { DEG2RAD } from 'three/src/math/MathUtils'

class Core {
    constructor (assets, rootElement){
        this.rootElement = rootElement
        this.startDim = 50
        this.shouldDraw = false
        this.paint = false
        this.gui = new GUI()
        this.viewMode = false
        this.assets = assets
        this.sett = {
            pressureBleed: 0.5,
            pressure:1,
            pressureOpacity:1.0,
            nodeOpacityScale:1.0,
            tilt:0.0,
            tiltOpacity:1.0,
        }
        this.init(assets)
        this.addGui()
        this.render()

    }
    init(assets){

        this.stats = new Stats()
        this.rootElement.appendChild( this.stats.dom )

        this.w = this.rootElement.clientWidth
        this.h = this.rootElement.clientHeight

        this.canvas = document.createElement('canvas')
        this.canvas.width = this.w
        this.canvas.height = this.h
        this.rootElement.appendChild(this.canvas)

        this.renderer = new THREE.WebGLRenderer({

            canvas:this.canvas,
            antialias:false,
            alpha:true,
            // premultipliedAlpha: false
        })
        this.renderer.setSize(this.w, this.h)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.scene = new THREE.Scene()
        this.sceneCursor = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera( 70, this.w / this.h, 0.01, 10 )
        this.camera.position.z = 1

        this.scene.background = new THREE.Color('green')
        this.controls = new OrbitControls(this.camera,this.renderer.domElement)
        this.controls.maxDistance = 0
        this.controls.maxDistance = 1.1
        this.controls.enabled = false

        this.drawingEngine = new DrawingEngine(assets,this)


        this.params = {
            'Brush Color': 0xffffff,
            'Clean Screen': () => {
                this.drawingEngine.setCleanScreen()
            },
            'Brush shape': 'brush_1',
            'Grain': 'grain_1',
            'Opacity': 1.0,
            'Brush size': this.startDim,
            'Mode': 'Drawing',
            'Scene color':  this.scene.background.getHex()
        }

        this.resultPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1,1), 
            // new THREE.ShaderMaterial({
            //     transparent:true,

            //     // blending:THREE.NoBlending,
            //     // blending:THREE.CustomBlending,
            //     // blendEquation:THREE.AddEquation,

            //     // blendDst: null,
            //     // blendDstAlpha: null,
            //     // blendSrc: null,
            //     // blendSrcAlpha:null, 

            //     uniforms:{
            //         mainLayer: { value: this.drawingEngine.rt.texture },
            //         tempLayer: { value: this.drawingEngine.quad.material.map },
            //         o:{value:this.params['Opacity']}
            //     },
            //     vertexShader:`

            //         varying vec2 vUv;

            //         void main(){
            //             vUv = uv;
            //             vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            //             gl_Position = projectionMatrix * mvPosition;

            //         }
            //     `,
            //     fragmentShader:`
            //         varying vec2 vUv;
            //         uniform sampler2D mainLayer;
            //         uniform sampler2D tempLayer;
            //         uniform float o;


            //         void main( void ) {

            //             vec4 color1 = texture2D(mainLayer, vUv);
            //             vec4 color2 = texture2D(tempLayer, vUv);

            //             // vec3 a = color1.rgb * color1.a + color2.rgb * (color2.a);
            //             // // a *= color2.a;

            //             // vec4 color = vec4 (color1.rgb+color2.rgb, color1.a+color2.a);

            //             // // vec4 color = vec4((color1.rgb * color1.a) + color2.rgb ,1.0)
                        
            //             // gl_FragColor = vec4( ((color1.rgb * vec3(0.95)) + color1.rgb),color1.a);
            //             // // gl_FragColor = vec4(clamp((color1.rgb * vec3(0.95))+color1.rgb, 0.0,1.0), color1.a);

            //             // gl_FragColor = vec4(color1.rgb * vec3(o), 1.0);
            //             // gl_FragColor = vec4(color1.rgb, 0.0);
            //             float c = 0.0;
            //             if (color1.a > 0.0){
            //                 c =  (1.0 - o)*color2.a;
            //             } else {
            //                 c = color1.a;
            //             }
            //             gl_FragColor = color1;
            //         }
            //     `
            // })
            new THREE.MeshBasicMaterial({
                map:  this.drawingEngine.rt.texture, 
                side: THREE.FrontSide,


            blending:THREE.CustomBlending,

            blendSrc:THREE.OneFactor,        
            blendDst:THREE.OneMinusSrcAlphaFactor,
            blendSrcAlpha:THREE.OneFactor,
            blendDstAlpha:THREE.OneMinusSrcAlphaFactor,

                // blending:THREE.CustomBlending,
                // blendSrc:THREE.OneFactor,
                // blendDst:THREE.OneMinusSrcAlphaFactor,
                // blendSrcAlpha:THREE.OneFactor,
                // blendDstAlpha:THREE.OneMinusSrcAlphaFactor,

                transparent:true,
                // depthWrite:false,
                // depthTest:false,
    
            })
        )
        this.resultPlane.name = 'layer'
        // this.resultPlane.renderOrder = 999

        this.box1 = new THREE.Mesh( new THREE.BoxGeometry( 0.2, 0.2, 0.2 ), new THREE.MeshNormalMaterial() )
        this.box1.position.set(0,0,0)
        // this.box1.renderOrder = -999

        this.scene.add(this.box1)
        this.scene.add(this.resultPlane)


        // const A = new THREE.Vector3(-1,1, 0.9795075974851257)
        // const B = new THREE.Vector3(1,1, 0.9795075974851257)
        // const C = new THREE.Vector3(-1,-1,0.9795075974851257)
        // const D = new THREE.Vector3(1,-1,0.9795075974851257)

        const A = new THREE.Vector3(-1, 1, -0.99999)
        const B = new THREE.Vector3(1, 1, -0.99999)
        const C = new THREE.Vector3(-1, -1,-0.99999)
        const D = new THREE.Vector3(1, -1,-0.99999)

        this.camera.updateProjectionMatrix()
        this.camera.updateMatrixWorld()

        const someV = new THREE.Vector3().copy(this.camera.position)
        const directionCamera = new THREE.Vector3()

        this.camera.getWorldDirection(directionCamera)
        directionCamera.setLength(0.9 - this.camera.near)
        someV.add(directionCamera)
        someV.applyMatrix4(this.camera.matrixWorldInverse).applyMatrix4(this.camera.projectionMatrix) 

        // console.log('someV',someV)

        // console.log(cameraP.projectionMatrixInverse)

        A.applyMatrix4(this.camera.projectionMatrixInverse).applyMatrix4(this.camera.matrixWorld)
        B.applyMatrix4(this.camera.projectionMatrixInverse).applyMatrix4(this.camera.matrixWorld)
        C.applyMatrix4(this.camera.projectionMatrixInverse).applyMatrix4(this.camera.matrixWorld)
        D.applyMatrix4(this.camera.projectionMatrixInverse).applyMatrix4(this.camera.matrixWorld)

        // console.log(A,B,C,D)

        this.resultPlane.geometry.attributes.position.setXYZ(0,A.x,A.y,A.z)
        this.resultPlane.geometry.attributes.position.setXYZ(1,B.x,B.y,B.z)
        this.resultPlane.geometry.attributes.position.setXYZ(2,C.x,C.y,C.z)
        this.resultPlane.geometry.attributes.position.setXYZ(3,D.x,D.y,D.z)
        console.log(this.resultPlane.geometry) 



        this.resultPlane.geometry.attributes.position.needsUpdate = true
        // resultPlane.matrixAutoUpdate = true

        this.tempResulpPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(2,1), 
            this.drawingEngine.quad.material // use quad 
            // new THREE.MeshBasicMaterial({
            //     map: this.drawingEngine.temporaryLayer.texture,
            //     // blending:THREE.NoBlending,
            //     side: THREE.FrontSide,
            //     transparent:true,

            //     depthWrite:false,
            //     depthTest:false,
            //     // blending:THREE.CustomBlending,

            //     // blendDst: THREE.OneMinusSrcAlphaFactor,
            //     // blendDstAlpha: THREE.OneFactor,
            //     // blendSrc: THREE.OneFactor, 
            //     // blendSrcAlpha: THREE.OneFactor, 
            //     // // color:'red'
            //     // depthTest:false,
            //     // depthWrite:false,
            //     // opacity:1

            // })
        )
        this.tempResulpPlane.name='tempLayer'
        this.tempResulpPlane.geometry.attributes.position.copy(this.resultPlane.geometry.attributes.position)
        this.resultPlane.geometry.attributes.position.needsUpdate = true
        this.tempResulpPlane.material.needsUpdate = true
        // this.tempResulpPlane.visible = false
        this.scene.add(this.tempResulpPlane)
        // console.log(tempResulpPlane,sceneP)


        this.resultPlane.geometry.attributes.position.needsUpdate = true
        this.tempResulpPlane.geometry.attributes.position.needsUpdate = true

        // this.drawingEngine = new DrawingEngine(assets,this)

        // this.resultPlane.material.map = this.drawingEngine.rt.texture
        // this.tempResulpPlane.material.map = this.drawingEngine.temporaryLayer.texture

        // this.resultPlane.material.needsUpdate = true
        // this.tempResulpPlane.material.needsUpdate = true


        this.renderer.setRenderTarget(this.drawingEngine.rt)
        this.renderer.setClearColor(new THREE.Color(0x000000), 0)
        this.renderer.clearColor()
        this.renderer.setRenderTarget(null)
        this.drawingEngine.renderUp() 

        // window.addEventListener('resize', () => resize())
        window.addEventListener('pointerdown', (event) => this.drawingEngine.down(event))
        window.addEventListener('pointermove', (event) => this.drawingEngine.move(event))
        window.addEventListener('pointerup', (event) => this.drawingEngine.up(event))

        const loader = new THREE.ObjectLoader()

        const cameraPDef = this.camera.toJSON()

        this.parseCamera = loader.parse(cameraPDef)


    }
    setCameraToDef(){
        this.camera.copy(this.parseCamera)
    }

    render(){
        this.stats.begin()

        if (!this.viewMode){

            // shouldDraw ? renderMove() : quad.render(renderer)
            if (this.shouldDraw){
                this.drawingEngine.renderMove()
            } 
        }

        this.box1.rotation.x += 0.01
        this.box1.rotation.y += 0.01

        // box2.rotation.x -= 0.01
        // box2.rotation.y -= 0.01

        this.renderer.render(this.scene,this.camera)
        // if (!shouldDraw) renderer.render(sceneP,cameraP) // perspective scene
        if (this.viewMode) this.controls.update()
        if (!this.viewMode) this.drawingEngine.renderCursor()

        this.stats.end()

		this.processId = requestAnimationFrame( () => {
			this.render()
		} )
    }
    clean(){
        
    }
    addGui(){
    
            // this.drawingEngine.circle.material.alphaMap =  this.assets[this.assets.findIndex( texture => texture.name === this.params['Textures'])]
            // this.drawingEngine.circle.material.needsUpdate = true
    
            this.gui.add(this.params,'Clean Screen')
    
            this.gui.addColor(this.params,'Brush Color')
            .onChange((c) => {
                // this.drawingEngine.circle.material.color.setHex( c )
                const color = new THREE.Color(c)
                this.drawingEngine.circle.material.uniforms.color.value.set(color.r,color.g,color.b, 1.0)// = new THREE.Vector4(color.r,color.g,color.b, 1.0)
                // this.drawingEngine.circle.material.uniformsNeedUpdate = true
                // this.drawingEngine.brushMesh.material.color.setHex( color )
            })
    
            this.gui.add( this.params, 'Brush shape', [
                // 'clear',
                'brush_1',
                'brush_2',
                'brush_3',
                'brush_4',
                'brush_5',
                'brush_6',
                'brush_7',
                'brush_8',
                'brush_9',
            ])
            .onChange( ( v ) => {
                // const texture = (v === 'clear') ? null : this.assets[this.assets.findIndex( texture => texture.name === v)]
                const texture = this.assets[this.assets.findIndex( texture => texture.name === v)]
                // this.drawingEngine.circle.material.map = texture
                // this.drawingEngine.brushMesh.material.map = texture
                // this.drawingEngine.circle.material.color = new THREE.Color(0x000000)

                this.drawingEngine.circle.material.uniforms.alphaMap.value = texture
                // this.drawingEngine.circle.material.uniformsNeedUpdate = true
                // this.drawingEngine.brushMesh.material.needsUpdate = true
            })

            this.gui.add( this.params, 'Grain', [
                // 'clear',
                'grain_1',
                'grain_2',
                'grain_3',
                'grain_4',
                'grain_5',
                'grain_6',
                'grain_7',
                'grain_8',
                'uv_grid'
            ])
            .onChange( ( v ) => {
                // const texture = (v === 'clear') ? null : this.assets[this.assets.findIndex( texture => texture.name === v)]
                const texture = this.assets[this.assets.findIndex( texture => texture.name === v)]
                // this.drawingEngine.circle.material.map = texture
                // this.drawingEngine.brushMesh.material.map = texture
                // this.drawingEngine.circle.material.color = new THREE.Color(0x000000)
                texture.wrapS = THREE.RepeatWrapping
                texture.wrapT = THREE.RepeatWrapping

                this.drawingEngine.circle.material.uniforms.grainMap.value = texture
                // this.drawingEngine.circle.material.uniformsNeedUpdate = true
                // this.drawingEngine.brushMesh.material.needsUpdate = true
            })

            const pr = this.gui.addFolder('Pressure sett')
            // pressureBleed: 0.5,
            // pressure:1
            // pressureOpacity:{value:1.0},
            // nodeOpacityScale:{value:1.0},
            // tilt:{value:90.0},
            // tiltOpacity:{value:1.0}
            console.log(this.sett)
            pr.add( this.sett, 'pressureBleed',0,1,0.01)
            .onChange( ( v ) => {
                this.drawingEngine.circle.material.uniforms.pressureBleed.value = v
            })    
            pr.add( this.sett, 'pressure', 0, 1, 0.01 )
            .onChange( ( v ) => {
                this.drawingEngine.circle.material.uniforms.pressure.value = v
            })    
            pr.add( this.sett, 'pressureOpacity', 0, 1, 0.01 )
            .onChange( ( v ) => {
                this.drawingEngine.circle.material.uniforms.pressureOpacity.value = v
            })    
            pr.add( this.sett, 'nodeOpacityScale', 0, 1, 0.01 )
            .onChange( ( v ) => {
                this.drawingEngine.circle.material.uniforms.nodeOpacityScale.value = v
            })    
            pr.add( this.sett, 'tilt', 0, 90, 0.01 )
            .onChange( ( v ) => {
                this.drawingEngine.circle.material.uniforms.tilt.value = v
            })    
            pr.add( this.sett, 'tiltOpacity', 0, 1, 0.01 )
            .onChange( ( v ) => {
                this.drawingEngine.circle.material.uniforms.tiltOpacity.value = v
            })    

    
            this.gui.add( this.params, 'Opacity', 0, 1, 0.1 )
            .onChange( ( v ) => {
                // console.log(this.resultPlane.material.uniforms.o)
                // this.resultPlane.material.uniforms.o.value = v
                // this.resultPlane.material.uniformsNeedUpdate = true
                this.drawingEngine.quad.material.opacity = v
                // this.tempResulpPlane.material.opacity = v
                // this.resultPlane
                // this.resultPlane.material.opacity=v
                this.drawingEngine.brushMesh.material.opacity = v
            })    
    
            this.gui.add( this.params, 'Brush size', 10, 60, 1 )
            .onChange((newDim) => {
                const scale = newDim/this.startDim 
                this.drawingEngine.circle.geometry.scale(scale,scale,scale)
                this.drawingEngine.brushMesh.geometry.scale(scale,scale,scale)
                this.startDim = newDim
                this.drawingEngine.circle.material.uniforms.brushSize.value = newDim
            })
    
            this.gui.add( this.drawingEngine.paramsCircle, 'Rotation', -180, 180, 1 )
            .onChange((deg) => {
                this.drawingEngine.brushMesh.rotation.z = deg * DEG2RAD
            })
    
            const rlstPlaneSett = {
                skew:{
                    'X': 0,
                    prev: 0,
                    matrixDef:this.resultPlane.matrix.clone()
                },
                t:{
                    'Z':0,
                    fw:0,
                    fh:0
                }
            }
            this.gui.addColor(this.params,'Scene color')
            .onChange((color) => {
       
                this.scene.background.setHex( color )
    
            })
            const rsltPlZ = this.resultPlane.position.z 
    
            this.gui.add( this.params, 'Mode', [
                'Drawing',
                'View'
            ])
            .onChange( ( mode ) => {
                this.viewMode = (mode === 'View') 
    
    
                if (!this.viewMode){
                    // resultPlane.position.set(0,0,0)
                    // tempResulpPlane.position.set(0,0,0)
    
                    this.setCameraToDef()
                    this.gui.removeFolder(this.gui.__folders['Plane settings'])
                    // tempResulpPlane.matrix.copy(rlstPlaneSett.skew.matrixDef.clone())
                    // resultPlane.matrix.copy(rlstPlaneSett.skew.matrixDef.clone())
    
                } else {
                    // cameraP.position.z = 1.01
                    const mainFolder = this.gui.addFolder('Plane settings')
                    // const skewFolder = mainFolder.addFolder('Skew')
                    const translatFolder = mainFolder.addFolder('Translate')
                    // const rotFolder = mainFolder.addFolder('Rotation')
                    // const scaleFolder = mainFolder.addFolder('Scale')
    
    
                    // skewFolder.add(rlstPlaneSett.skew,'X',-10,10,0.01)
                    // .onChange((x) => {
    
                    //     // const neg = -1 
                    //     // const pos = 1
    
                    //     // let dir = 1
    
                    //     // if (x===rlstPlaneSett.skew.prev) return
    
                    //     // if (x>0){
                    //     //     if (x>rlstPlaneSett.skew.prev){
                    //     //         dir = pos 
                    //     //     } else {
                    //     //         dir = neg
                    //     //     }
    
    
                    //     // } else if (x<0){
                    //     //     if (x<rlstPlaneSett.skew.prev){
                    //     //         dir = pos 
                    //     //     } else {
                    //     //         dir = neg
                    //     //     }
    
                    //     // }
    
                    //     // console.log(dir)
    
                    //     // const newX = x * dir 
    
                    //     // const matrix = new THREE.Matrix4();
     
                    //     // matrix.makeShear(0, newX*DEG2RAD,0, 0, 0, 0);
                    //     // // console.log(resultPlane.matrixAutoUpdate )
                    //     // // apply shear matrix to geometry                  
                    //     // resultPlane.matrix.multiply(matrix.clone())
                    //     // tempResulpPlane.matrix.multiply(matrix.clone())
                    //     // resultPlane.matrixAutoUpdate=false
                    //     // tempResulpPlane.matrixAutoUpdate=false
    
                    //     // rlstPlaneSett.skew.prev = x
                    // })
    
                    translatFolder.add(rlstPlaneSett.t,'Z',0,1,0.01)
                    .onChange((z) => {
    
    
    
                        const h = 2 * Math.tan((this.camera.fov) * (Math.PI/360)) * (this.camera.near + z) 
                        const w = h * this.camera.aspect
                        const buff = [...this.resultPlane.geometry.getAttribute('position').array]
                        const fw = Math.abs(buff[0]) + Math.abs(buff[3]) 
                        // const fh = Math.abs(buff[1]) + Math.abs(buff[7]) 
                        // resultPlane.translateZ(-z)
                        // resultPlane.scale.set(w/fw,h/fh,h/fh) //.scale.set(w/fw,h/fh,1)
                        // tempResulpPlane.scale.set(w/fw,h/fh,h/fh)
                        // const m = cameraP.projectionMatrix.clone().makeTranslation(0,0,z)
                        // const vert = new Float32Array( buff.map((item,index) => { 
                        //     if (index === 2 || index === 5 || index === 8 || index === 11) return item 
                        //     return item * Math.abs(w/fw)
                        // } ) )
                        // resultPlane.geometry.setAttribute('position', new THREE.BufferAttribute( vert, 3 ))
                        // tempResulpPlane.geometry.setAttribute('position', new THREE.BufferAttribute( vert, 3 ))
    
                        this.resultPlane.scale.set( Math.abs(w/fw), Math.abs(w/fw),1) //.scale.set(w/fw,h/fh,1)
                        this.tempResulpPlane.scale.set( Math.abs(w/fw), Math.abs(w/fw),1)
    
                
    
                        this.resultPlane.geometry.attributes.position.needsUpdate = true
                        this.tempResulpPlane.geometry.attributes.position.needsUpdate = true
    
                        
                        this.resultPlane.position.z = rsltPlZ - z
                        this.tempResulpPlane.position.z = rsltPlZ - z
    
                    })
    
                    
                }

                this.controls.enabled = this.viewMode
            })
    
    
        
    }

}

export default Core
