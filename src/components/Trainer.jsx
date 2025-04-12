import { useState, useEffect } from "react";

function Trainer({ poseData, recordedData, setRecordedData }) {
    const [label, setLabel] = useState('');
    const [neuralNetwork, setNeuralNetwork] = useState(null);
    const [status, setStatus] = useState('Model not initialized');
    const [confusionMatrix, setConfusionMatrix] = useState(null);

    // Initialize neural network
    useEffect(() => {
        if (window.ml5) {
            const nn = window.ml5.neuralNetwork({
                task: 'classification',
                debug: true
            });
            setNeuralNetwork(nn);
            setStatus('Model in werking.');
        } else {
            setStatus('Error: ml5 not loaded');
            console.error('ML5 werkt momenteel niet.');
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

        // Split data: 80% train, 20% test
        const trainRatio = 0.8;
        const shuffledData = [...recordedData].sort(() => Math.random() - 0.5); // Shuffle data
        const trainSize = Math.floor(shuffledData.length * trainRatio);
        const trainData = shuffledData.slice(0, trainSize);
        const testData = shuffledData.slice(trainSize);

        // Train on trainData
        trainData.forEach(data => {
            neuralNetwork.addData(data.features, { label: data.label });
        });

        neuralNetwork.normalizeData();
        neuralNetwork.train({ epochs: 50 }, () => {
            setStatus('Training complete - ready to predict or export');
            // Store testData for confusion matrix
            setRecordedData(testData); // Keep test data for evaluation
        });
    };

    const predict = () => {
        if (!neuralNetwork) {
            setStatus('Model not initialized');
            return;
        }
        if (poseData.length === 0) {
            setStatus('No pose data available for prediction');
            return;
        }

        try {
            const features = normalizePoseData(poseData);
            console.log('Prediction features:', features);

            if (recordedData.length > 0 && features.length !== recordedData[0].features.length) {
                setStatus(`Error: Feature length mismatch. Expected ${recordedData[0].features.length}, got ${features.length}`);
                return;
            }

            neuralNetwork.classify(features, (error, results) => {
                if (error) {
                    setStatus('Prediction error');
                    console.error('Prediction error:', error);
                    return;
                }
                if (results && results.length > 0) {
                    setStatus(`Prediction: ${results[0].label} (${(results[0].confidence * 100).toFixed(2)}%)`);
                } else {
                    setStatus('No prediction results returned');
                }
            });
        } catch (error) {
            setStatus('Error processing pose data for prediction');
            console.error('Predict error:', error);
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

    const exportJSON = () => {
        if (recordedData.length === 0) {
            setStatus('No recorded data to export');
            return;
        }

        const simplifiedData = recordedData.map(data => {
            const landmarks = [];
            for (let i = 0; i < data.features.length; i += 3) {
                landmarks.push([
                    data.features[i],
                    data.features[i + 1],
                    data.features[i + 2]
                ]);
            }
            const hands = [];
            const landmarksPerHand = 21;
            for (let i = 0; i < landmarks.length; i += landmarksPerHand) {
                hands.push(landmarks.slice(i, i + landmarksPerHand));
            }

            return {
                label: data.label,
                hands: hands
            };
        });

        const jsonString = JSON.stringify(simplifiedData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'hand_pose_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setStatus('JSON exported successfully');
    };

    const generateConfusionMatrix = async () => {
        if (!neuralNetwork) {
            setStatus('Model not initialized');
            setConfusionMatrix(null);
            return;
        }
        if (recordedData.length === 0) {
            setStatus('No test data available for confusion matrix');
            setConfusionMatrix(null);
            return;
        }

        setStatus('Generating confusion matrix...');

        const uniqueLabels = [...new Set(recordedData.map(data => data.label))].sort();
        const matrix = uniqueLabels.reduce((acc, label) => {
            acc[label] = uniqueLabels.reduce((inner, predLabel) => {
                inner[predLabel] = 0;
                return inner;
            }, {});
            return acc;
        }, {});

        // Predict on test data
        for (const data of recordedData) {
            try {
                const result = await new Promise((resolve, reject) => {
                    neuralNetwork.classify(data.features, (error, results) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                    });
                });

                if (result && result.length > 0) {
                    const predictedLabel = result[0].label;
                    const trueLabel = data.label;
                    matrix[trueLabel][predictedLabel]++;
                }
            } catch (error) {
                console.error('Error predicting for confusion matrix:', error);
            }
        }

        setConfusionMatrix({ labels: uniqueLabels, matrix });
        setStatus('Confusion matrix generated');
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
                <button onClick={exportJSON}>
                    Export JSON
                </button>
                <button onClick={generateConfusionMatrix} disabled={!neuralNetwork}>
                    Confusion Matrix
                </button>
            </div>
            <p>Status: {status}</p>
            <p>Samples collected: {recordedData.length}</p>
            {recordedData.length > 0 && (
                <p>Unique labels: {[...new Set(recordedData.map(data => data.label))].join(', ')}</p>
            )}
            {confusionMatrix && (
                <div>
                    <h3>Confusion Matrix</h3>
                    <table style={{ borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                        <tr>
                            <th style={{ border: '1px solid black', padding: '5px' }}>True \ Predicted</th>
                            {confusionMatrix.labels.map(label => (
                                <th key={label} style={{ border: '1px solid black', padding: '5px' }}>{label}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {confusionMatrix.labels.map(trueLabel => (
                            <tr key={trueLabel}>
                                <td style={{ border: '1px solid black', padding: '5px' }}>{trueLabel}</td>
                                {confusionMatrix.labels.map(predLabel => (
                                    <td key={predLabel} style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                                        {confusionMatrix.matrix[trueLabel][predLabel]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default Trainer;