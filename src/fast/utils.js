import * as THREE from 'three'


const viewPointP = new THREE.Vector3()
const viewPoint = new THREE.Vector3()

const dragPerspective = (event, z, camera, rootElement) => {

    viewPointP.x = (event.clientX / rootElement.clientWidth) * 2 - 1
    viewPointP.y = 1 - (event.clientY / rootElement.clientHeight) * 2
    viewPointP.z = z || 0
    return viewPointP.clone().unproject(camera)
}

const drag = (event, rootElement, z = 0) => {

    // viewPoint.x = ((event.clientX / rootElement.clientWidth) * 2 - 1 ) * rootElement.clientWidth * 0.5
    // viewPoint.y = (1 - (event.clientY / rootElement.clientHeight) * 2 ) * rootElement.clientHeight * 0.5

    viewPoint.x = ((event.clientX / rootElement.clientWidth) ) * rootElement.clientWidth 
    viewPoint.y = (1 - (event.clientY / rootElement.clientHeight)  ) * rootElement.clientHeight 
    viewPoint.z = z || 0

    return viewPoint.clone()
}


export { drag, dragPerspective }