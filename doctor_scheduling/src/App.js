import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/doctors')
      .then(res => setDoctors(res.data));
  }, []);

  const bookSlot = async (doctorId, slotId) => {
    try {
      // Make API call to book the slot
      const response = await axios.post(`http://localhost:5000/api/doctors/${doctorId}/slots/${slotId}/book`);
      
      // Update the UI by fetching the latest doctor data
      const updatedDoctors = await axios.get('http://localhost:5000/api/doctors');
      setDoctors(updatedDoctors.data);
      
      alert('Slot booked successfully!');
    } catch (error) {
      console.error('Error booking slot:', error);
      alert('Failed to book slot');
    }
  };

  return (
    <div className="App">
      <h1>Doctor Scheduler</h1>
      {doctors.map(doctor => (
        <div key={doctor._id}>
          <h3>{doctor.name} ({doctor.specialty})</h3>
          {doctor.slots.map(slot => (
            <button 
              key={slot._id} 
              onClick={() => bookSlot(doctor._id, slot._id)}
              disabled={slot.booked}  // Optional: disable if already booked
            >
              {slot.date} at {slot.time} {slot.booked ? '(Booked)' : ''}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;