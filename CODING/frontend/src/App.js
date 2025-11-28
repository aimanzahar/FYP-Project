import { useEffect, useState } from 'react';

function App() {
  const [gpus, setGpus] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/gpus')
      .then(res => res.json())
      .then(data => setGpus(data))
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>GPU List</h1>
      {gpus.map((gpu, index) => (
        <div key={index} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h3>{gpu.title}</h3>
          <p>Price: {gpu.price}</p>
          <a href={gpu.link} target="_blank" rel="noopener noreferrer">View Product</a>
        </div>
      ))}
    </div>
  );
}

export default App;
