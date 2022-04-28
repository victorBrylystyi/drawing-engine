
import * as THREE from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import { drag } from './utils'
import { lerp, DEG2RAD } from 'three/src/math/MathUtils'
import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'


const drawEngine = (assets) => {

    // -------------------------  Support variables  ------------------------------
        // console.log(assets)
        let paint = false
        let shouldDraw = false
        let startDim = 50
        const paramsCircle = {
            'Brush size': 1,
            'Rotation': 0,
        }

        const currentMousePosition =  new THREE.Vector2()
        const prevMousePosition =  new THREE.Vector2()

        // const raycaster = new THREE.Raycaster()
        // const pointer = new THREE.Vector2()

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
            logarithmicDepthBuffer:true,
            alpha:true
        })

        renderer.setSize(w, h)
        renderer.setPixelRatio(window.devicePixelRatio)

        const rt = new THREE.WebGLRenderTarget(w,h,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
            // anisotropy: 4
        })

        const temporaryLayer = new THREE.WebGLRenderTarget(w,h,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
            // anisotropy: 4
        })

        renderer.setRenderTarget(temporaryLayer)
        renderer.setClearColor(new THREE.Color(0x000000), 0)
        renderer.clearColor()
        renderer.setRenderTarget(null)


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
        

        const quad = new FullScreenQuad(new THREE.MeshBasicMaterial({map: rt.texture}))
        const quad2 = new FullScreenQuad(new THREE.MeshBasicMaterial({
            map: temporaryLayer.texture, 
            transparent:true, 
            depthTest:false, 
            depthWrite:false
        }))

        quad._mesh.position.z = 1

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
                transparent:true,
                depthTest:false, 
                alphaTest:0
                // map: assets[assets.findIndex( texture => texture.name === 'brush_1')]
            }),
            count
        )
        circle.instanceMatrix.setUsage( THREE.DynamicDrawUsage ) // will be updated every frame
        scene.add(circle)
    
    // -----------------------------------  Perspective Scene  ----------------------------------- 

        const cameraP = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 )
        cameraP.position.z = 1

        const sceneP = new THREE.Scene()
        sceneP.background = new THREE.Color('green')

        const resultPlane = new THREE.Mesh(new THREE.PlaneGeometry(2,1), new THREE.MeshBasicMaterial({map: rt.texture, side: THREE.DoubleSide}))
        // resultPlane.visible = false

        const box = new THREE.Mesh( new THREE.BoxGeometry( 0.2, 0.2, 0.2 ), new THREE.MeshNormalMaterial() )

        sceneP.add( box )
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

        // console.log(circle)

    // ----------------------------------- Support functions ----------------------------------- 


        // const render = () => {
        //     renderer.autoClear = false
        
        //     renderer.setRenderTarget(rt)
        //     renderer.clearDepth()
        
        //     renderer.render(scene,camera)
        
        //     renderer.autoClear = true
        
        //     renderer.setRenderTarget(null)
        //     quad.render(renderer)

        //     pointerCount = 0 // clear integrate instancedMeshs index
        // }

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
        
            renderer.setRenderTarget(null)

            quad.render(renderer)
            quad2.render(renderer)

            renderer.autoClear = true

            pointerCount = 0 // clear integrate instancedMeshs index

            // shouldDraw = false
        }

        const renderUp = () => {
            renderer.autoClear = false
        
            renderer.setRenderTarget(rt)
            renderer.clearDepth()
            quad2.render(renderer)

            renderer.autoClear = true
        
            renderer.setRenderTarget(null)

            quad.render(renderer)

        }


        const resize = () => {
            // renderer.setSize(rootElement.clientWidth, rootElement.clientHeight)
            // console.log(renderer.getViewport(new THREE.Vector4()))
            
            // renderer.setViewport(new THREE.Vector4(0,0,rootElement.clientWidth,rootElement.clientHeight))
        }

        const down = (event) => {

            paint = true

            setClearTempLayer()

            // const pointerWorldPos = drag(event, rootElement)
            const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
            currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)

            circle.count = 1
            const matrix = new THREE.Matrix4()
            matrix.makeRotationZ(paramsCircle['Rotation']*DEG2RAD)
            matrix.setPosition(pointerWorldPos)
            circle.setMatrixAt(0, matrix)
            circle.instanceMatrix.needsUpdate = true

            renderMove()
           
        }

        const move = (event) => {

            // const wp = drag(event, rootElement)
            const wp = drag(event, {clientHeight:h,clientWidth:w})
            brush.position.set(wp.x,wp.y,0)

            if (paint){

                shouldDraw = true

                prevMousePosition.copy(currentMousePosition)
                // const pointerWorldPos = drag(event, rootElement)
                const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
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
            }

        }

        const up = () => {
            
            paint = false
            shouldDraw = false

            renderUp()
        }
        
        const setCleanScreen = () => {
            renderer.setRenderTarget(rt)
            renderer.setClearColor(new THREE.Color(0xeeeeee), 1)
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

    // --------------------------------------------------- Init ---------------------------------------------------

        renderer.setRenderTarget(rt)
        renderer.setClearColor(new THREE.Color(0xeeeeee), 1)
        renderer.clearColor()
        renderer.setRenderTarget(null)
        // renderer.setClearColor(new THREE.Color('black'), 1)
        renderUp() 

        window.addEventListener('resize', () => resize())
        window.addEventListener('pointerdown', (event) => down(event))
        window.addEventListener('pointermove', (event) => move(event))
        window.addEventListener('pointerup', () => up())

    // --------------------------------------------------- GUI ---------------------------------------------------
    
        const params = {
            'Brush Color': circle.material.color.getHex(),
            'Clean Screen': setCleanScreen,
            'Textures': 'brush_1',
            'Opacity': 1,
            'Brush size': startDim,
            "Rotation brush": 0
        }

        circle.material.map = assets[assets.findIndex( texture => texture.name === params['Textures'])]
        circle.material.needsUpdate = true

        gui.add(params,'Clean Screen')

        gui.addColor(params,'Brush Color')
        .onChange((color) => {
            circle.material.color.setHex( color )
            brushMesh.material.color.setHex( color )
        })

		gui.add( params, 'Textures', [
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
            const texture = assets[assets.findIndex( texture => texture.name === v)]
            circle.material.map = texture
            brushMesh.material.map = texture
            circle.material.needsUpdate = true
            brushMesh.material.needsUpdate = true
		})

		gui.add( params, 'Opacity', 0, 1, 0.01 )
		.onChange( ( v ) => {
            quad2.material.opacity = v
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


    // --------------------------------------------------- Animation ---------------------------------------------------

    const animation = () => {

        stats.begin()

        shouldDraw ? renderMove() : quad.render(renderer)

        renderCursor()

        // renderer.render(sceneP,cameraP) // perspective scene

        stats.end()

        requestAnimationFrame (animation)
    }
    
    animation()
    
} 

export default drawEngine