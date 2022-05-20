
import * as THREE from 'three'
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass'
import { drag } from './utils'
import { lerp, DEG2RAD } from 'three/src/math/MathUtils'
import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { CustomBlending } from 'three'

const drawEngine = (assets) => {

    // console.log(new Core(assets,document.querySelector('#root')) )

    // -------------------------  Support variables  ------------------------------
        // console.log(assets)
        let paint = false
        let shouldDraw = false
        let startDim = 50
        let viewMode = false

        const paramsCircle = {
            'Brush size': 1,
            'Rotation': 0,
        }


        const currentMousePosition =  new THREE.Vector2()
        const prevMousePosition =  new THREE.Vector2()

        const raycaster = new THREE.Raycaster()
        const pointer = new THREE.Vector2()

        const rootElement = document.querySelector('#root')
        const w = rootElement.clientWidth
        const h = rootElement.clientHeight

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h

        rootElement.appendChild(canvas)

        const stats = new Stats()
        rootElement.appendChild( stats.dom )

        const gui = new GUI()

    // -------------------------  WebGLl Renderer & RenderTarget  ------------------------------

        const renderer = new THREE.WebGLRenderer({
            canvas, 
            antialias:true, 
            // logarithmicDepthBuffer:true,
            alpha:true,
            // premultipliedAlpha:false
        })

        renderer.setSize(w, h)
        renderer.setPixelRatio(window.devicePixelRatio)

        const rt = new THREE.WebGLRenderTarget(w,h,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
            // // anisotropy: 4,
        })

        const temporaryLayer = new THREE.WebGLRenderTarget(w,h,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
            // anisotropy: 4,
        })
        const rt3 = new THREE.WebGLRenderTarget(w,h,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
            anisotropy: 4,
        })

    // -------------------------  Orthograhic Scene  ------------------------------
    
        const scene = new THREE.Scene()
        const sceneCursor = new THREE.Scene()

        const camera  = new THREE.OrthographicCamera()
        camera.left   = 0 
        camera.right  = w 
        camera.top    = h 
        camera.bottom = 0
        camera.near   = -2000
        camera.far    = 2000
        camera.position.z = 0.01
        camera.updateProjectionMatrix()  //!!!! 
        

        const quad = new FullScreenQuad(new THREE.MeshBasicMaterial({
            map: rt.texture, 
            transparent:true,           
            side:THREE.FrontSide,
            depthTest:false, 
            depthWrite:false,

            // blending:THREE.CustomBlending,
            // blendSrc:THREE.ZeroFactor,
            // blendDst:THREE.OneMinusSrcAlphaFactor,
            // blendSrcAlpha:THREE.OneFactor,
            // blendDstAlpha:THREE.OneMinusSrcAlphaFactor,

            // blendDst:THREE.OneFactor,

            // // blendSrcAlpha:THREE.OneFactor,
            // blendDstAlpha:THREE.ZeroFactor,
            // blending:THREE.CustomBlending,

            // blendSrc:THREE.OneFactor,
            // blendDst:THREE.ZeroCurvatureEnding,
            // blendSrcAlpha:THREE.SrcAlphaFactor,
            // blendDstAlpha:THREE.OneMinusSrcAlphaFactor

        }))
        const quad3 = new FullScreenQuad(new THREE.MeshBasicMaterial({
            map: temporaryLayer.texture, 
            transparent:true, 
            side:THREE.FrontSide,
            depthTest:false, 
            depthWrite:false,
            // blending:THREE.CustomBlending,

            // blendSrc:THREE.OneFactor,
            // blendDst:THREE.OneMinusSrcAlphaFactor,
            // blendSrcAlpha:THREE.SrcAlphaFactor,
            // blendDstAlpha:THREE.OneMinusSrcAlphaFactor

        }))
        const quad2 = new FullScreenQuad(new THREE.MeshBasicMaterial({
            map: temporaryLayer.texture, 
            transparent:true, 
            side:THREE.FrontSide,
            depthTest:false, 
            depthWrite:false,

            blending:THREE.CustomBlending,

            blendSrc:THREE.SrcAlphaFactor,
            blendDst:THREE.OneMinusSrcAlphaFactor,
            blendSrcAlpha:THREE.OneFactor,
            blendDstAlpha:THREE.OneMinusSrcAlphaFactor,

            // blendSrc:THREE.SrcAlphaFactor,
            // blendDst:THREE.OneFactor,
            // blendSrcAlpha:THREE.OneFactor,
            // blendDstAlpha:THREE.OneFactor

        }))
        const pass = new Pass()


        quad._mesh.position.z = 1
        // quad2._mesh.position.z = 1

        const brush = new THREE.Group()
        const brushMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(startDim,startDim), 
            new THREE.MeshBasicMaterial({
                map:assets[assets.findIndex( texture => texture.name === 'brush_1')] ,
                transparent: true,
                // depthTest:false,
                // depthWrite: false
            })
        )

        // const frame = new THREE.Mesh(
        //     new THREE.PlaneGeometry(40,40), 
        //     new THREE.MeshBasicMaterial({
        //         color:'black',
        //         // map:assets[assets.findIndex( texture => texture.name === 'brush_1')] ,
        //         // transparent: true,
        //         // depthTest:false,
        //         // depthWrite: false
        //     })
        // )

        brush.add(brushMesh)
        // brush.add(frame)
        sceneCursor.add(brush)

        // const r = 5
        const count = 256
        let pointerCount = 0

        const circle = new THREE.InstancedMesh(        // brush 
            // new THREE.CircleGeometry(r, 64),
            new THREE.PlaneGeometry(startDim,startDim),
            new THREE.MeshBasicMaterial({
                transparent:false,
                color:'red',
                side:THREE.FrontSide,
                // color:'red'
                // blendEquation:THREE.NoBlending,
                // blendEquation:THREE.AddEquation,
                // blendSrc:THREE.SrcColorFactor
                // depthTest:false,
                // depthWrite:false
                // depthTest:false, 
                // alphaTest:0
                // map: assets[assets.findIndex( texture => texture.name === 'brush_1')]
            }),
            count
        )
        circle.instanceMatrix.setUsage( THREE.DynamicDrawUsage ) // will be updated every frame
        scene.add(circle)

    
    // -----------------------------------  Perspective Scene  ----------------------------------- 

        const cameraP = new THREE.PerspectiveCamera( 70, rootElement.clientWidth / rootElement.clientHeight, 0.01, 10 )
        cameraP.position.z = 1



        const sceneP = new THREE.Scene()
        sceneP.background = new THREE.Color('green')
        // sceneP.add(cameraPhelper)
        const controls = new OrbitControls(cameraP,renderer.domElement)
        // controls.update()
        controls.maxDistance = 0
        controls.maxDistance = 1.1
        controls.enabled = false
        // controls.enableZoom = false
        // controls.enablePan = true
        // controls.enableDamping = false

        const resultPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1,1), 
            new THREE.MeshBasicMaterial({
                // map:  rt.texture, 
                side: THREE.FrontSide,
                transparent:true,
                // depthTest:false,
                // depthWrite:false,
                // opacity:1

            })
        )
        resultPlane.name = 'layer'
        // resultPlane.visible = false

        const box1 = new THREE.Mesh( new THREE.BoxGeometry( 0.2, 0.2, 0.2 ), new THREE.MeshNormalMaterial() )
        const box2 = new THREE.Mesh( new THREE.BoxGeometry( 0.1, 0.1, 0.1 ), new THREE.MeshNormalMaterial() )

        box1.position.set(0,0,0)
        box2.position.set(0.1,0,0)

        sceneP.add( box1 )
        // sceneP.add( box2 )
        sceneP.add(resultPlane)

        // console.log(resultPlane)

        // const A = new THREE.Vector3(-1,1, 0.9795075974851257)
        // const B = new THREE.Vector3(1,1, 0.9795075974851257)
        // const C = new THREE.Vector3(-1,-1,0.9795075974851257)
        // const D = new THREE.Vector3(1,-1,0.9795075974851257)

        const A = new THREE.Vector3(-1, 1, -0.99999)
        const B = new THREE.Vector3(1, 1, -0.99999)
        const C = new THREE.Vector3(-1, -1,-0.99999)
        const D = new THREE.Vector3(1, -1,-0.99999)

        cameraP.updateProjectionMatrix()
        cameraP.updateMatrixWorld()

        const someV = new THREE.Vector3().copy(cameraP.position)
        const directionCamera = new THREE.Vector3()

        cameraP.getWorldDirection(directionCamera)
        directionCamera.setLength(0.9 - cameraP.near)
        someV.add(directionCamera)
        someV.applyMatrix4(cameraP.matrixWorldInverse).applyMatrix4(cameraP.projectionMatrix) 

        // console.log('someV',someV)

        // console.log(cameraP.projectionMatrixInverse)

        A.applyMatrix4(cameraP.projectionMatrixInverse).applyMatrix4(cameraP.matrixWorld)
        B.applyMatrix4(cameraP.projectionMatrixInverse).applyMatrix4(cameraP.matrixWorld)
        C.applyMatrix4(cameraP.projectionMatrixInverse).applyMatrix4(cameraP.matrixWorld)
        D.applyMatrix4(cameraP.projectionMatrixInverse).applyMatrix4(cameraP.matrixWorld)

        // console.log(A,B,C,D)

        resultPlane.geometry.attributes.position.setXYZ(0,A.x,A.y,A.z)
        resultPlane.geometry.attributes.position.setXYZ(1,B.x,B.y,B.z)
        resultPlane.geometry.attributes.position.setXYZ(2,C.x,C.y,C.z)
        resultPlane.geometry.attributes.position.setXYZ(3,D.x,D.y,D.z)

        resultPlane.geometry.attributes.position.needsUpdate = true
        // resultPlane.matrixAutoUpdate = true

        const tempResulpPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(2,1), 
            new THREE.MeshBasicMaterial({
                // map:  temporaryLayer.texture,
                side: THREE.FrontSide,
                transparent:true,
                // depthTest:false,
                // depthWrite:false,
                // opacity:1

            })
        )
        tempResulpPlane.name='tempLayer'
        tempResulpPlane.geometry.attributes.position.copy(resultPlane.geometry.attributes.position)
        resultPlane.geometry.attributes.position.needsUpdate = true
        tempResulpPlane.material.needsUpdate = true
        tempResulpPlane.visible = false
        sceneP.add(tempResulpPlane)
        // console.log(tempResulpPlane,sceneP)


        resultPlane.geometry.attributes.position.needsUpdate = true
        tempResulpPlane.geometry.attributes.position.needsUpdate = true
        // tempResulpPlane.geometry.attributes.uv.needsUpdate = true
        // resultPlane.geometry.attributes.uv.needsUpdate = true

        const loader = new THREE.ObjectLoader()

        const cameraPDef = cameraP.toJSON()

        const setCameraToDef = () => {
            const parseCamera = loader.parse(cameraPDef)
            cameraP.copy(parseCamera)
        }


    // ----------------------------------- Support functions ----------------------------------- 

        const renderCursor = () => {
            renderer.autoClear = false
            // renderer.setRenderTarget(null)
            renderer.clearDepth()
            renderer.render(sceneCursor,camera)
        }

        const renderMove = () => {
            renderer.autoClear = false
        
            renderer.setRenderTarget(temporaryLayer)
            renderer.clearDepth()
            renderer.render(scene,camera)

            // console.log('temp',temporaryLayer.texture)
        
            renderer.setRenderTarget(null)

            // renderer.clear()
            quad.render(renderer) // что бы видеть прошлое что нарисовали 
            quad2.render(renderer)

            renderer.autoClear = true

            // tempResulpPlane.visible = true

            pointerCount = 0 // clear integrate instancedMeshs index
        }

        const renderUp = () => {
            renderer.autoClear = false
        
            renderer.setRenderTarget(rt)
            // renderer.clearDepth()
            quad2.render(renderer)

            // renderer.render(scene,camera)
            // console.log('rt',rt.texture)
            
            renderer.autoClear = true
        
            renderer.setRenderTarget(null)
            // renderer.render(scene,camera)
            // pass.render(renderer,rt,temporaryLayer,0.1)
            quad.render(renderer)

            // quad3.render(renderer)

            // tempResulpPlane.visible = false
            // resultPlane.visible = true

        }

        const setCleanScreen = () => {
            renderer.setRenderTarget(rt)
            renderer.setClearColor(0x000000, 0)
            renderer.clearColor()
            renderer.setRenderTarget(null)
            renderUp()
        }

        const setClearTempLayer = () => {
            renderer.setRenderTarget(temporaryLayer)
            renderer.setClearColor(new THREE.Color(0x000000), 0)
            renderer.clearColor()
            renderer.setRenderTarget(null)
        }


        const resize = () => {
            // renderer.setSize(rootElement.clientWidth, rootElement.clientHeight)
            // console.log(renderer.getViewport(new THREE.Vector4()))
            
            // renderer.setViewport(new THREE.Vector4(0,0,rootElement.clientWidth,rootElement.clientHeight))
        }

        const down = (event) => {

            if (!viewMode){
                paint = true

                setClearTempLayer()

                pointer.x = ( event.clientX / rootElement.clientWidth) * 2 - 1
                pointer.y = 1 - ( event.clientY / rootElement.clientHeight ) * 2
 
                raycaster.setFromCamera(pointer,cameraP)
                const intersectObjects = raycaster.intersectObjects( sceneP.children )

                const tempLayerObject = intersectObjects.find(item => item.object.name === 'tempLayer')
                // console.log('pointer', pointer.clone(), tempLayerObject.uv.clone())
                // const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
                // console.log('intersectObjects', intersectObjects)
                if (tempLayerObject){
                    const pointerWorldPos = new THREE.Vector3(
                        tempLayerObject.uv.x * rootElement.clientWidth,
                        tempLayerObject.uv.y * rootElement.clientHeight,
                        tempLayerObject.point.z
                    )
    
                    currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)
        
                    circle.count = 1
                    const matrix = new THREE.Matrix4()
                    matrix.makeRotationZ(paramsCircle['Rotation']*DEG2RAD)
                    matrix.setPosition(pointerWorldPos)
                    circle.setMatrixAt(0, matrix)
                    circle.instanceMatrix.needsUpdate = true
        
                    renderMove()
                } 
            }
        }

        const move = (event) => {

            if (!viewMode){
                // const wp = drag(event, rootElement)
                const wp = drag(event, {clientHeight:h,clientWidth:w})

                brush.position.set(wp.x,wp.y,0)

                if (paint){


   

                    prevMousePosition.copy(currentMousePosition)
                    // const pointerWorldPos = drag(event, rootElement)
                    // const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
                    pointer.x = ( event.clientX / rootElement.clientWidth) * 2 - 1
                    pointer.y = 1 - ( event.clientY / rootElement.clientHeight ) * 2
    
                    raycaster.setFromCamera(pointer,cameraP)
                    const intersectObjects = raycaster.intersectObjects( sceneP.children )
                    // console.log('intersectObjects', intersectObjects)
                    const tempLayerObject = intersectObjects.find(item => item.object.name === 'tempLayer')
                    // const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
                    if (tempLayerObject){

                        shouldDraw = true

                        const pointerWorldPos = new THREE.Vector3(
                            tempLayerObject.uv.x * rootElement.clientWidth,
                            tempLayerObject.uv.y * rootElement.clientHeight,
                            tempLayerObject.point.z
                        )
                        currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)
    
                        const distance = Math.floor(prevMousePosition.distanceTo(currentMousePosition))
    
                        circle.count = (distance - 1) + pointerCount
    
                        if (distance > 1){
    
                            for (let i = 0; i < distance; i++){
    
                                const dt = i / (distance-1)
                                const x = lerp(prevMousePosition.x, currentMousePosition.x, dt)
                                const y = lerp(prevMousePosition.y, currentMousePosition.y, dt)
                                const matrix = new THREE.Matrix4()
                                matrix.makeRotationZ(paramsCircle['Rotation']*DEG2RAD)
                                matrix.setPosition(x,y,0)
                                circle.setMatrixAt(i + pointerCount, matrix)
                                circle.instanceMatrix.needsUpdate = true
                            }
                            
                        } else {
                            circle.count = 1
                            const matrix = new THREE.Matrix4()
                            matrix.makeRotationZ(paramsCircle['Rotation']*DEG2RAD)
                            matrix.setPosition(pointerWorldPos)
                            circle.setMatrixAt(0, matrix)
                            circle.instanceMatrix.needsUpdate = true
                        }
                        pointerCount += distance
                    } else {

                        shouldDraw = false
                        // pointerCount = 0 
                    }

                }
            }
        }

        const up = (event) => {
            // event.preventDefault()
            paint = false
            shouldDraw = false

            renderUp()
            // setClearTempLayer()

        }
        
    // --------------------------------------------------- Init ---------------------------------------------------
        // setClearTempLayer()
        // setCleanScreen()
        renderer.setRenderTarget(rt)
        renderer.setClearColor(new THREE.Color(0xffffff), 0)
        renderer.clearColor()
        renderer.setRenderTarget(null)
        renderUp() 

        window.addEventListener('resize', () => resize())
        window.addEventListener('pointerdown', (event) => down(event))
        window.addEventListener('pointermove', (event) => move(event))
        window.addEventListener('pointerup', (event) => up(event))

    // --------------------------------------------------- GUI ---------------------------------------------------
    {
        const params = {
            'Brush Color': circle.material.color.getHex(),
            'Clean Screen': setCleanScreen,
            'Textures': 'brush_1',
            'Opacity': 1,
            'Brush size': startDim,
            'Mode': 'Drawing',
            'Scene color':  sceneP.background.getHex()
        }

        // circle.material.map = assets[assets.findIndex( texture => texture.name === params['Textures'])]
        // circle.material.needsUpdate = true

        gui.add(params,'Clean Screen')

        // gui.addColor(params,'Brush Color')
        // .onChange((color) => {
        //     circle.material.color.setHex( color )
        //     brushMesh.material.color.setHex( color )
        // })

		gui.add( params, 'Textures', [
            'clear',
			'brush_1',
			'brush_2',
			'brush_3',
            'brush_4',
			'brush_5',
			'brush_6',
            'brush_7',
			'brush_8',
            'brush_9',
            'brush_10',
            'brush_11',
			'brush_12',
            'brush_13',
            'brush_14',
            'brush_15'
		])
		.onChange( ( v ) => {
            const texture = (v === 'clear') ? null : assets[assets.findIndex( texture => texture.name === v)]
            circle.material.map = texture
            brushMesh.material.map = texture
            circle.material.color = new THREE.Color(0xeeeeee)
            circle.material.needsUpdate = true
            brushMesh.material.needsUpdate = true
		})

		gui.add( params, 'Opacity', 0, 1, 0.1 )
		.onChange( ( v ) => {
            quad2.material.opacity = v 
            quad3.material.opacity = v
            // circle.material.opacity = v
            // tempResulpPlane.material.opacity=v
            // brushMesh.material.opacity = v
		})    

        gui.add( params, 'Brush size', 10, 60, 1 )
        .onChange((newDim) => {
            const scale = newDim/startDim 
            circle.geometry.scale(scale,scale,scale)
            brushMesh.geometry.scale(scale,scale,scale)
            startDim = newDim
        })

        gui.add( paramsCircle, 'Rotation', -180, 180, 1 )
        .onChange((deg) => {
            brushMesh.rotation.z = deg * DEG2RAD
        })

        const rlstPlaneSett = {
            skew:{
                'X': 0,
                prev: 0,
                matrixDef:resultPlane.matrix.clone()
            },
            t:{
                'Z':0,
                fw:0,
                fh:0
            }
        }
        gui.addColor(params,'Scene color')
        .onChange((color) => {
   
            sceneP.background.setHex( color )

        })
        const rsltPlZ = resultPlane.position.z 

        gui.add( params, 'Mode', [
			'Drawing',
			'View'
		])
		.onChange( ( mode ) => {
            viewMode = (mode === 'View') 


            if (!viewMode){
                // resultPlane.position.set(0,0,0)
                // tempResulpPlane.position.set(0,0,0)

                setCameraToDef()
                gui.removeFolder(gui.__folders['Plane settings'])
                // tempResulpPlane.matrix.copy(rlstPlaneSett.skew.matrixDef.clone())
                // resultPlane.matrix.copy(rlstPlaneSett.skew.matrixDef.clone())

            } else {
                // cameraP.position.z = 1.01
                const mainFolder = gui.addFolder('Plane settings')
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



                    const h = 2 * Math.tan((cameraP.fov) * (Math.PI/360)) * (cameraP.near + z) 
                    const w = h * cameraP.aspect
                    const buff = [...resultPlane.geometry.getAttribute('position').array]
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

                    resultPlane.scale.set( Math.abs(w/fw), Math.abs(w/fw),1) //.scale.set(w/fw,h/fh,1)
                    tempResulpPlane.scale.set( Math.abs(w/fw), Math.abs(w/fw),1)

            

                    resultPlane.geometry.attributes.position.needsUpdate = true
                    tempResulpPlane.geometry.attributes.position.needsUpdate = true

                    
                    resultPlane.position.z = rsltPlZ - z
                    tempResulpPlane.position.z = rsltPlZ - z

                })

                
            }
            controls.enabled = viewMode
		})


    }

    // --------------------------------------------------- Animation ---------------------------------------------------

    const animation = () => {

        stats.begin()

        if (!viewMode){

            // shouldDraw ? renderMove() : quad.render(renderer)
            if (shouldDraw){

                renderMove()
            } 
        }

        // box1.rotation.x += 0.01
        // box1.rotation.y += 0.01

        // box2.rotation.x -= 0.01
        // box2.rotation.y -= 0.01

        // renderer.render(sceneP,cameraP)
        // if (!shouldDraw) renderer.render(sceneP,cameraP) // perspective scene
        // if (viewMode) controls.update()
        // if (!viewMode) renderCursor()
        stats.end()

        requestAnimationFrame (animation)
    }
    
    animation()
    
} 

export default drawEngine