async function test() {
  try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@solpack.com', password: 'admin123' })
      });
      const data = await res.json();
      const token = data.token;
      
      const res2 = await fetch('http://localhost:5000/api/preventive/plans', {
          headers: { Authorization: `Bearer ${token}` }
      });
      if(!res2.ok) {
          const errData = await res2.json();
          console.error("ERROR 2:", errData);
      } else {
        const data2 = await res2.json();
        console.log('SUCCESS 2:', data2.length, 'plans');
      }

      const res3 = await fetch('http://localhost:5000/api/master/machines', {
          headers: { Authorization: `Bearer ${token}` }
      });
      if(!res3.ok) {
        const errData = await res3.json();
        console.error("ERROR 3:", errData);
      } else {
        const data3 = await res3.json();
        console.log('SUCCESS 3:', data3.length, 'machines');
      }

  } catch (err) {
      console.error('ERROR:', err);
  }
}
test();
