import fetch from "node-fetch";

async function check() {
  const res = await fetch("http://0.0.0.0:3000/api/admin/debug-user/cJa1TuWib1QRNg42qentFlyDROj2");
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check().catch(console.error);
