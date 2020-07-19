import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from 'react-three-fiber';
import { Damier } from './objects/Damier';
/* import { PlaneTexture } from './experiments/PlaneTexture';
import { PlaneMouseEffect } from './experiments/PlaneMouseEffect'; */
import CameraControls from 'camera-controls';
import * as THREE from 'three';
import { Cylinder } from './objects/Cylinder';
import AboutMe from './projects/AboutMe';
import AndreeLawrance from './projects/AndreeLawrance';
import plantFrontFragmentShader from '../assets/shaders/plane_front.frag';
import plantFrontVertexShader from '../assets/shaders/plane_front.vert';

CameraControls.install({ THREE: THREE });

const Scene = (props) => {
    let time = 0;
    const {
        camera,
        gl: { domElement },
        scene
    } = useThree();

    const [clock] = useState(new THREE.Clock());
    const [cameraControls] = useState(new CameraControls(camera, domElement));
    const [bringPlaneFront, updateBringPlaneFront] = useState(false);
    const [sendPlaneBack, updateSendPlaneBack] = useState(false);

    //  Define front plane for info display
    /* const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }); */
    const [planeFront, updatePlaneFront] = useState(null);
    const [planeFrontOpened, updatePlaneFrontOpened] = useState(false);
    const PLANE_DIM = { width: 40, height: 30 };

    useFrame((event) => {
        const delta = clock.getDelta();
        cameraControls.update(delta);
        time += 0.1;

        if (planeFront) {
            planeFront.material.uniforms.uTime.value += 0.02;
            if (bringPlaneFront) {
                if (planeFront.material.uniforms.uOpeningStartTime.value === 0) {
                    planeFront.material.uniforms.uOpeningStartTime.value = planeFront.material.uniforms.uTime.value;
                }
                if (planeFront.material.uniforms.uTime.value - planeFront.material.uniforms.uOpeningStartTime.value > 2) {
                    updatePlaneFrontOpened(true);
                    updateBringPlaneFront(false);
                    planeFront.material.uniforms.uOpeningStartTime.value = 0;
                    planeFront.material.uniforms.uOpened.value = 1;
                    console.log('reached in')
                }
            }
            if (sendPlaneBack) {
                if (planeFront.material.uniforms.uOpened.value > 0) {
                    planeFront.material.uniforms.uOpened.value = 0;
                }
                if (planeFront.material.uniforms.uClosingStartTime.value === 0) {
                    planeFront.material.uniforms.uClosingStartTime.value = planeFront.material.uniforms.uTime.value + 2;
                }
                if (planeFront.material.uniforms.uClosingStartTime.value - planeFront.material.uniforms.uTime.value < 0) {
                    updatePlaneFrontOpened(false);
                    updateSendPlaneBack(false);
                    planeFront.material.uniforms.uClosingStartTime.value = 0;
                    console.log('reached out')
                }
            }
        }
    });

    useEffect(() => {
        scene.add(camera);
        camera.fov = 20;
        camera.updateProjectionMatrix();
        cameraControls.enabled = false;

        const material = new THREE.RawShaderMaterial({
            vertexShader: plantFrontVertexShader,
            fragmentShader: plantFrontFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uOpeningStartTime: {value: 0},
                uClosingStartTime: {value: 0},
                uOpened: {value: 0}
            },
            transparent: true,
            side: THREE.DoubleSide,
            /* depthTest: false */
        });
        const geometry = new THREE.PlaneBufferGeometry(1, 1, 8, 8);

        if (!planeFront) {
            updatePlaneFront(new THREE.Mesh(geometry, material));
        } else {
            camera.add(planeFront);
            planeFront.position.set(0, 0, -1);
        }
        
        /* planeFront.rotation.set(-1, 0, 0) */
    }, [planeFront]);

    useEffect(() => {
        if (props.quitProject > 0) {
            quitProject();
        }
    }, [props.quitProject]);

    const canMoveX = (posX, delta) => {
        if (delta > 0) {
            if (posX < (PLANE_DIM.width / 2) - 10) {
                return true;
            } else {
                return false;
            }
        } else {
            if (posX > (- PLANE_DIM.width / 2) + 10) {
                return true;
            } else {
                return false;
            }
        }
    }

    const canMoveY = (posY, delta) => {
        if (delta < 0) {
            if (posY < (PLANE_DIM.height / 2) - 16) {
                return true;
            } else {
                return false;
            }
        } else {
            if (posY > (- PLANE_DIM.height / 2) + 0) {
                return true;
            } else {
                return false;
            }
        }
    }

    const quitProject = () => {
        console.log('quitProject');
        updateSendPlaneBack(true);
    } 

    const updateTranslate = (x, y) => {
        let position = cameraControls.getPosition();
        const deltaX = canMoveX(position.x, x) ? x : 0;
        const deltaY = canMoveY(position.y, y) ? y : 0;
        cameraControls.truck(deltaX, deltaY, true);
        position = cameraControls.getPosition();
        cameraControls.setPosition(position.x, position.y, position.z + deltaY / 2, true);
    }

    const onObjectClick = (objectId) => {
        console.log(objectId)
        if (!planeFrontOpened) {
            props.updateOpenedPage(objectId);
            if (!sendPlaneBack) {
                updateBringPlaneFront(true);
            }
        } else {
            props.updateOpenedPage(null);
            if (!bringPlaneFront) {
                updateSendPlaneBack(true);
            }
        }
    }

    return (
        <>
            <group>
                <Damier camera={camera} positions={[[-3, -1, 1.5], [3, 1, 1.5], [3, -3, 1.5], [8, 7, 1.5], [-5, -8, 1.5]]} updateTranslate={updateTranslate} planeFrontOpened={planeFrontOpened}></Damier>
                <Cylinder onObjectClick={onObjectClick.bind(this, 'andree-lawrance')} text={'ANDREE LAWRANCE'} position={[-3, -1, 1.5]} planeFrontOpened={planeFrontOpened}></Cylinder>
                <Cylinder onObjectClick={onObjectClick.bind(this, 'clubbing-feels')} text={'CLUBBING FEELS'} position={[3, 1, 1.5]} planeFrontOpened={planeFrontOpened}></Cylinder>
                <Cylinder onObjectClick={onObjectClick.bind(this, 'data-art')} text={'DATA ART'} position={[3, -3, 1.5]} planeFrontOpened={planeFrontOpened}></Cylinder>
                <Cylinder onObjectClick={onObjectClick.bind(this, 'orbiting-portraits')} text={'ORBITING PORTRAITS'} position={[8, 7, 1.5]} planeFrontOpened={planeFrontOpened}></Cylinder>
                <Cylinder onObjectClick={onObjectClick.bind(this, 'about-me')} text={'ABOUT ME'} position={[-5, -8, 1.5]} planeFrontOpened={planeFrontOpened}></Cylinder>
                {/* <FrontPlane camera={camera}></FrontPlane> */}
                {/* <PlaneTexture camera={camera} updateTranslate={updateTranslate}></PlaneTexture> */}
                {/* <PlaneMouseEffect camera={camera} updateTranslate={updateTranslate}></PlaneMouseEffect> */}
            </group>
        </>
    )
}

export const Home = () => {

    let cameraXPos = 0;
    const [openedPage, updateOpenedPage] = useState(null);
    const [quitProject, doQuitProject] = useState(0);

    const onQuitProject = () => {
        console.log('quit');
        doQuitProject(quitProject+1);
        updateOpenedPage(null);
    }

    return (
        <div className="home-container">
            <div className="canvas-container">
                <Canvas gl={{ antialias: false, alpha: false }} camera={{ position: [cameraXPos, -10, 20] }} onCreated={({ gl, camera }) => {
                    /* camera.lookAt(cameraXPos, 0, 0) */
                    return gl.setClearColor('white')
                }}>
                    <Suspense fallback={null}>
                        <Scene updateOpenedPage={updateOpenedPage} quitProject={quitProject}></Scene>
                    </Suspense>
                </Canvas>
            </div>
            <div className="project-content">
                {(openedPage === 'about-me') ? <AboutMe></AboutMe> : null}
                {(openedPage === 'andree-lawrance') ? <AndreeLawrance onQuitProject={onQuitProject}></AndreeLawrance> : null}
            </div>
        </div>
    );
}

export default Home;