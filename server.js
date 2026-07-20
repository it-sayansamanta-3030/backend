const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initial static data
const ROOMS = [
  { id: 'r1', name: 'Lobby', capacity: 20 },
  { id: 'r2', name: 'Meeting Room A', capacity: 10 },
  { id: 'r3', name: 'Meeting Room B', capacity: 8 },
  { id: 'r4', name: 'Cafeteria', capacity: 50 },
  { id: 'r5', name: 'Engineering Bay', capacity: 40 },
];

let employees = [
  { id: 'e1', name: 'Raj Singh', role: 'DataBase', empId: 25, status: 'In', currentRoom: 'r1', timeInRoom: 15, totalHoursToday: 4.5, lastKnownRoom: 'r1', history: [] },
  { id: 'e2', name: 'Amit Sharma', role: 'Frontend', empId: 26, status: 'In', currentRoom: 'r5', timeInRoom: 120, totalHoursToday: 6.2, lastKnownRoom: 'r5', history: [] },
  { id: 'e3', name: 'Priya Patel', role: 'Backend', empId: 27, status: 'In', currentRoom: 'r4', timeInRoom: 30, totalHoursToday: 5.0, lastKnownRoom: 'r4', history: [] },
  { id: 'e4', name: 'Alice Admin', role: 'admin', empId: 1, status: 'Out', currentRoom: null, timeInRoom: 0, totalHoursToday: 8.0, lastKnownRoom: 'r2', history: [] },
];

// --- REST API ENDPOINTS ---

// Get all state (for the React Dashboard)
app.get('/api/state', (req, res) => {
  res.json({ employees, rooms: ROOMS });
});

// CRUD for Employees
app.post('/api/employees', (req, res) => {
  const newEmployee = {
    id: `e${Date.now()}`,
    status: 'Out',
    currentRoom: null,
    timeInRoom: 0,
    totalHoursToday: 0,
    lastKnownRoom: null,
    history: [],
    ...req.body
  };
  employees.push(newEmployee);
  res.status(201).json(newEmployee);
});

app.put('/api/employees/:id', (req, res) => {
  const index = employees.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Not found' });
  
  employees[index] = { ...employees[index], ...req.body };
  res.json(employees[index]);
});

app.delete('/api/employees/:id', (req, res) => {
  employees = employees.filter(e => e.id !== req.params.id);
  res.status(204).send();
});

// --- ESP32 HARDWARE ENDPOINT ---
// An actual ESP32 would send a POST request here when it detects an employee beacon in a room
app.post('/api/esp32/ping', (req, res) => {
  const { employeeId, roomId } = req.body; // e.g. { employeeId: 'e1', roomId: 'r2' }
  
  const empIndex = employees.findIndex(e => e.id === employeeId);
  if (empIndex !== -1) {
    const emp = employees[empIndex];
    if (emp.currentRoom !== roomId) {
      const newHistory = {
        id: Math.random().toString(36).substr(2, 9),
        room: roomId,
        entryTime: new Date(),
        exitTime: null,
      };
      
      employees[empIndex] = {
        ...emp,
        status: 'In',
        currentRoom: roomId,
        lastKnownRoom: roomId,
        timeInRoom: 0,
        history: [newHistory, ...emp.history].slice(0, 50)
      };
      console.log(`ESP32: Moved ${emp.name} to ${roomId}`);
    }
  }
  res.json({ success: true });
});

// --- SIMULATION LOOP ---
// Mimics ESP32s pinging the server every 2 seconds
setInterval(() => {
  employees = employees.map(emp => {
    // Only randomly move employees who are 'In'
    if (emp.status === 'In' && Math.random() > 0.8) {
      const randomRoom = ROOMS[Math.floor(Math.random() * ROOMS.length)].id;
      if (randomRoom !== emp.currentRoom) {
        const newHistory = {
          id: Math.random().toString(36).substr(2, 9),
          room: randomRoom,
          entryTime: new Date(),
          exitTime: null,
        };
        return {
          ...emp,
          currentRoom: randomRoom,
          lastKnownRoom: randomRoom,
          timeInRoom: 0,
          history: [newHistory, ...emp.history].slice(0, 50),
        };
      }
    }
    // Increment time in room for all 'In' employees
    if (emp.status === 'In') {
       return { ...emp, timeInRoom: emp.timeInRoom + (2/60), totalHoursToday: emp.totalHoursToday + (2/3600) };
    }
    return emp;
  });
}, 2000);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`ESP32 Endpoint Ready: POST http://localhost:${PORT}/api/esp32/ping`);
});
