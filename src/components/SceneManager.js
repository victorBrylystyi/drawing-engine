import { Canvas } from "@react-three/fiber"


const SceneManager = () => {

    return(
        <Canvas>
            <mesh position={[0,0,-1]}>
                <boxGeometry args={[1,1,1]} />
                <meshBasicMaterial color={'red'} />
            </mesh>
        </Canvas>
    )
}

export default SceneManager 