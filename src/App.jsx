import './App.css'
import Posedetector from './components/Posedetector'
import CanvasDrawing from './components/CanvasDrawing'
import Coordinates from './components/Coordinates'
import { useEffect, useState } from "react";

function App() {
    const [poseData, setPoseData] = useState([]);

    const handlePoseDataUpdate = (newPoseData) => {
        setPoseData(newPoseData);
    };

    return (
        <>
            <section className="videosection">
                <Posedetector onPoseDataUpdate={handlePoseDataUpdate}/>
                <CanvasDrawing poseData={poseData}/>
            </section>
            <Coordinates poseData={poseData}/>
        </>
    )
}

export default App