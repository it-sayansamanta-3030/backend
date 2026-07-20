const EMPLOYEES = [
  { empId: 'EM001', name: 'Ramesh Kumar', gender: 'Male', department: 'Server', authorized: true, role: 'Server' },
  { empId: 'EM002', name: 'Priya Sharma', gender: 'Female', department: 'Database', authorized: true, role: 'Database' },
  { empId: 'EM003', name: 'Amit Singh', gender: 'Male', department: 'HR', authorized: false, role: 'HR' }
];

async function initEmployees() {
  console.log('Initializing employees on the backend...');
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  
  for (const emp of EMPLOYEES) {
    try {
      const res = await fetch(`${backendUrl}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      });
      if (res.ok) {
        console.log(`Created: ${emp.name} (${emp.empId})`);
      } else {
        console.error(`Failed to create ${emp.name}`);
      }
    } catch (err) {
      console.error(`Error for ${emp.name}:`, err.message);
    }
  }
}

initEmployees();
