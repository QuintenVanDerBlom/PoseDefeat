import './App.css'
import Posedetector from './components/Posedetector'
import CanvasDrawing from './components/CanvasDrawing'
import Coordinates from './components/Coordinates'
import Trainer from './components/Trainer'
import { useState } from "react";

function App() {
    const [poseData, setPoseData] = useState([]);
    const [recordedData, setRecordedData] = useState([]);

    const handlePoseDataUpdate = (newPoseData) => {
        setPoseData(newPoseData);
    };

    return (
        <div className="app-container">
            <section className="video-section">
                <Posedetector onPoseDataUpdate={handlePoseDataUpdate}/>
                <CanvasDrawing poseData={poseData}/>
            </section>
            <Coordinates poseData={poseData}/>
            <Trainer
                poseData={poseData}
                recordedData={recordedData}
                setRecordedData={setRecordedData}
            />
        </div>
    )
}

export default App