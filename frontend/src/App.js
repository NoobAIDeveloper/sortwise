import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [folders, setFolders] = useState([]);
  const [sortOptions, setSortOptions] = useState({
    exifDate: true,
    cameraModel: true,
    fileType: true,
    location: false,
    orientation: false,
    livePhotos: false,
    deduplication: false,
  });
  const [fileOperation, setFileOperation] = useState('move');
  const [conflictResolution, setConflictResolution] = useState('rename');
  const [progress, setProgress] = useState(0);
  const [logFile, setLogFile] = useState(null);

  useEffect(() => {
    window.electronAPI.onSortProgress((event, progress) => {
      setProgress(progress);
    });
  }, []);

  const handleSelectFolders = async () => {
    const result = await window.electronAPI.selectFolders();
    if (result) {
      setFolders(result);
    }
  };

  const handleUndoSort = async () => {
    if (!logFile) {
      alert('No sort operation to undo.');
      return;
    }

    const result = await window.electronAPI.undoSort(logFile);
    alert(result.message);
    setLogFile(null);
  };

  const handleSort = async () => {
    if (folders.length === 0) {
      alert('Please select one or more folders to sort.');
      return;
    }

    const options = {
      folders: folders,
      sortOptions: sortOptions,
      fileOperation: fileOperation,
      conflictResolution: conflictResolution,
    };

    const result = await window.electronAPI.sortFiles(options);
    setLogFile(result.logFile);
    alert(result.message);
    setProgress(0);
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSortOptions({
      ...sortOptions,
      [name]: checked,
    });
  };

  return (
    <div className="App">
      <h1 className="title">SortWise</h1>
      <button className="select-button" onClick={handleSelectFolders}>Select Folders</button>

      <div className="options-container">
        <p>Selected Folders: {folders.join(', ')}</p>

        <div>
          <h3>Sorting Options</h3>
          <label>
            <input
              type="checkbox"
              name="exifDate"
              checked={sortOptions.exifDate}
              onChange={handleCheckboxChange}
            />
            EXIF Date
          </label>
          <label>
            <input
              type="checkbox"
              name="cameraModel"
              checked={sortOptions.cameraModel}
              onChange={handleCheckboxChange}
            />
            Camera Model
          </label>
          <label>
            <input
              type="checkbox"
              name="fileType"
              checked={sortOptions.fileType}
              onChange={handleCheckboxChange}
            />
            File Type
          </label>
          <label>
            <input
              type="checkbox"
              name="location"
              checked={sortOptions.location}
              onChange={handleCheckboxChange}
            />
            Location
          </label>
          <label>
            <input
              type="checkbox"
              name="orientation"
              checked={sortOptions.orientation}
              onChange={handleCheckboxChange}
            />
            Orientation
          </label>
          <label>
            <input
              type="checkbox"
              name="livePhotos"
              checked={sortOptions.livePhotos}
              onChange={handleCheckboxChange}
            />
            Live Photos
          </label>
          <label>
            <input
              type="checkbox"
              name="deduplication"
              checked={sortOptions.deduplication}
              onChange={handleCheckboxChange}
            />
            Deduplication
          </label>
        </div>

        <div>
          <h3>File Handling</h3>
          <label>
            <input
              type="radio"
              name="fileOperation"
              value="move"
              checked={fileOperation === 'move'}
              onChange={(e) => setFileOperation(e.target.value)}
            />
            Move Files
          </label>
          <label>
            <input
              type="radio"
              name="fileOperation"
              value="copy"
              checked={fileOperation === 'copy'}
              onChange={(e) => setFileOperation(e.target.value)}
            />
            Copy Files
          </label>
        </div>

        <div>
          <h3>Conflict Resolution</h3>
          <label>
            <input
              type="radio"
              name="conflictResolution"
              value="rename"
              checked={conflictResolution === 'rename'}
              onChange={(e) => setConflictResolution(e.target.value)}
            />
            Rename Duplicates
          </label>
          <label>
            <input
              type="radio"
              name="conflictResolution"
              value="overwrite"
              checked={conflictResolution === 'overwrite'}
              onChange={(e) => setConflictResolution(e.target.value)}
            />
            Overwrite Existing Files
          </label>
        </div>
      </div>

      {progress > 0 && (
        <div className="progress-container">
          <progress className="progress-bar" value={progress} max="100" />
          <div className="progress-text">{`${progress}%`}</div>
        </div>
      )}
      <button className="sort-button" onClick={handleSort}>Sort Files</button>
      <button className="undo-button" onClick={handleUndoSort} disabled={!logFile}>Undo Sort</button>
    </div>
  );
}

export default App;