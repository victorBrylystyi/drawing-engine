
import { animationFrameScheduler, BehaviorSubject, distinct, observeOn } from 'rxjs'
import * as THREE from 'three'


class Canva extends THREE.Object3D {

    isCanva = true
    isAttachToCamera = true
    translateZValue = 0 
    isAddToEngine = false
    strokes = new BehaviorSubject([])
    idStrokes = new BehaviorSubject([])



    constructor(engine,name, id){
        super()
        this.userData = {
            id
        }
        this.name = name
        this.engine = engine
        this.mainLayer = new THREE.Mesh(
            new THREE.PlaneGeometry(1,1), 
            new THREE.MeshBasicMaterial({
                map:  new THREE.FramebufferTexture(this.engine.canvas.clientWidth,this.engine.canvas.clientHeight, THREE.RGBAFormat),
                side: THREE.FrontSide,
                blending:THREE.CustomBlending,
                blendSrc:THREE.OneFactor,        
                blendDst:THREE.OneMinusSrcAlphaFactor,
                blendSrcAlpha:THREE.OneFactor,
                blendDstAlpha:THREE.OneMinusSrcAlphaFactor,
                transparent:true,
            })
        )

        this.mainLayer.name = `mainLayer ${this.name}`
        this.add(this.mainLayer)
        this.visible = true

        this.strokes
        .pipe(
            distinct(),
                observeOn(animationFrameScheduler)
        )
        .subscribe(v => {
            // redraw if 
            // strokes.length !== idStrokes.length || 
            // strokes[i].id !== idStrokes[i].id

            if (v.length !== this.idStrokes.value.length || 
                v.map(stroke => this.idStrokes.value.find(id => id === stroke.id)).find(elem => elem === undefined)){
                console.log('redraw', v)
                this.engine.drawByStore(this.userData.id, v)
            } 

            this.idStrokes
            .next(v.map(stroke => stroke.id))

        })

        this.idStrokes
        .pipe(
            distinct()
        )
        .subscribe(v => console.log(this.name, v ))

    }

    updateFromCamera(camera){

        const A = new THREE.Vector3(-1, 1, -0.99999)
        const B = new THREE.Vector3(1, 1, -0.99999)
        const C = new THREE.Vector3(-1, -1,-0.99999)
        const D = new THREE.Vector3(1, -1,-0.99999)

        camera.updateProjectionMatrix()
        camera.updateMatrixWorld()

        const someV = new THREE.Vector3().copy(camera.position)
        const directionCamera = new THREE.Vector3()

        camera.getWorldDirection(directionCamera)
        directionCamera.setLength(0.9 - camera.near)
        someV.add(directionCamera)
        someV.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix) 

        A.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld)
        B.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld)
        C.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld)
        D.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld)

        this.traverse((object)=>{
            // console.log(object)
            if(object.isMesh){
                object.geometry.attributes.position.setXYZ(0,A.x,A.y,A.z)
                object.geometry.attributes.position.setXYZ(1,B.x,B.y,B.z)
                object.geometry.attributes.position.setXYZ(2,C.x,C.y,C.z)
                object.geometry.attributes.position.setXYZ(3,D.x,D.y,D.z)
                object.geometry.attributes.position.needsUpdate = true
            }

        })

        camera.attach(this)
    }


}

export default Canva
