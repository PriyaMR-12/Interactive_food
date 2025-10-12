const token = localStorage.getItem("token");

fetch("http://localhost:4000/auth/profile", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
  }
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
