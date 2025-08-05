import './App.css';
import { useState } from 'react';
import ReactLeaf from './Pages/ReactLeaf';
import CollapsibleTable from './Components/CollapsibleTable';
import PlaceTypeInputForm from './Components/PlaceTypeInputForm';

export default function App() {
  const [searchData, setSearchData] = useState('');
  const [data, setData] = useState([]);

  return (
    <div className="App">
      <PlaceTypeInputForm onSearchChange={setSearchData}/>
      <ReactLeaf searchData={searchData} OnDataChange={setData}/>
      <CollapsibleTable data={data}/>
    </div>
  );
}