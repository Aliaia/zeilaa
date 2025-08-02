import './App.css';
import { useState } from 'react';
import ReactLeaf from './Pages/ReactLeaf';
import PlaceInputForm from './Components/PlaceInputForm';

export default function App() {
  const [placeQuery, setPlaceQuery] = useState('');

  return (
    <div className="App">
      <PlaceInputForm onPlaceChange={setPlaceQuery}/>
      <ReactLeaf placeQuery={placeQuery}/>
    </div>
  );
}