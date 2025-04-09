import { useState, useEffect } from "react";

function Trainer({ poseData, recordedData, setRecordedData }) {
    const [label, setLabel] = useState('');
    const [neuralNetwork, setNeuralNetwork] = useState(null);
    const [status, setStatus] = useState('Model not initialized');

    // Initialize neural network
    useEffect(() => {
        if (window.ml5) {
            const nn = window.ml5.neuralNetwork({
                task: 'classification',
                debug: true
            });
            setNeuralNetwork(nn);
            setStatus('Model initialized');
        } else {
            setStatus('Error: ml5 not loaded');
            console.error('ml5 is not available. Make sure the CDN script is included.');
        }
    }, []);

    const normalizePoseData = (pose) => {
        const features = [];
        pose.forEach(hand => {
            hand.forEach(landmark => {
                features.push(landmark.x, landmark.y, landmark.z);
            });
        });
        return features;
    };

    const addSample = () => {
        if (label && poseData.length > 0) {
            const features = normalizePoseData(poseData);
            setRecordedData(prev => [...prev, { features, label }]);
            setStatus(`Sample added for "${label}". Total samples: ${recordedData.length + 1}`);
        } else if (!label) {
            setStatus('Please enter a label first');
        } else {
            setStatus('No pose data available to sample');
        }
    };

    const trainModel = () => {
        if (!neuralNetwork) {
            setStatus('Model not initialized');
            return;
        }
        if (recordedData.length === 0) {
            setStatus('No data to train');
            return;
        }

        // Check for unique labels
        const uniqueLabels = [...new Set(recordedData.map(data => data.label))];
        if (uniqueLabels.length < 2) {
            setStatus('Error: Need at least 2 different labels to train');
            return;
        }

        setStatus('Training model...');
        recordedData.forEach(data => {
            neuralNetwork.addData(data.features, { label: data.label });
        });

        neuralNetwork.normalizeData();
        neuralNetwork.train({ epochs: 50 }, () => {
            setStatus('Training complete - ready to export');
            setRecordedData([]); // Clear recorded data after training
        });
    };

    const predict = () => {
        if (!neuralNetwork) {
            setStatus('Model not initialized');
            return;
        }
        if (poseData.length > 0) {
            const features = normalizePoseData(poseData);
            neuralNetwork.classify(features, (error, results) => {
                if (error) {
                    setStatus('Prediction error');
                    console.error(error);
                    return;
                }
                setStatus(`Prediction: ${results[0].label} (${(results[0].confidence * 100).toFixed(2)}%)`);
            });
        }
    };

    const exportModel = () => {
        if (!neuralNetwork) {
            setStatus('Model not initialized');
            return;
        }
        setStatus('Exporting model...');
        neuralNetwork.save((err) => {
            if (err) {
                setStatus('Error exporting model');
                console.error(err);
                return;
            }
            setStatus('Model exported successfully as "hand-sign-model"');
        });
    };

    return (
        <section className="trainer">
            <h2>Training Controls</h2>
            <div>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Enter sign label"
                />
                <button onClick={addSample}>
                    Add Sample
                </button>
                <button onClick={trainModel} disabled={!neuralNetwork}>
                    Train Model
                </button>
                <button onClick={predict} disabled={!neuralNetwork}>
                    Predict
                </button>
                <button onClick={exportModel} disabled={!neuralNetwork}>
                    Export Model
                </button>
            </div>
            <p>Status: {status}</p>
            <p>Samples collected: {recordedData.length}</p>
            {recordedData.length > 0 && (
                <p>Unique labels: {[...new Set(recordedData.map(data => data.label))].join(', ')}</p>
            )}
        </section>
    );
}

export default Trainer;