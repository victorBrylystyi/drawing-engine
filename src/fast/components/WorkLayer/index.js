
import * as THREE from 'three'


class WorkLayer extends THREE.Object3D {

    constructor(engineRef){

        super()
        
        this.engine = engineRef

        this.mainLayerRT = new THREE.WebGLRenderTarget(this.engine.canvas.clientWidth,this.engine.canvas.clientHeight,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
        })
        
        this.temporaryLayerRT = new  THREE.WebGLRenderTarget(this.engine.canvas.clientWidth,this.engine.canvas.clientHeight,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
        })

        this.tempLayer = new THREE.Mesh(
            new THREE.PlaneGeometry(1,1), 
            new THREE.MeshBasicMaterial({
                transparent:true,
                side:THREE.FrontSide,
                map:this.temporaryLayerRT.texture
            })
        )

        this.tempLayer.name = 'tempLayer'

        this.add(this.tempLayer)
    }

    clearMainLayerRT(){

    }

}

export default WorkLayer