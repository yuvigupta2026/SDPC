function convert() {
    const text = document.getElementById("mcq").value;
    const status = document.getElementById("status");

    // 1. Clear previous status
    status.innerHTML = "";
    status.style.color = "black";

    if (!text.trim()) {
        status.innerText = "Please enter MCQ content";
        status.style.color = "red";
        return;
    }

    status.innerText = "Converting... please wait.";

    // 2. Send to Backend (Port 3000)
    fetch("http://localhost:3000/api/convert", {
    method: "POST",
    credentials: "include",   // ⭐ ADD THIS LINE
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ mcqText: text })
})
    .then(res => {
        if (!res.ok) {
            throw new Error("Server error: " + res.status);
        }
        return res.json();
    })
    .then(data => {
        console.log("Form URL:", data.formUrl); 

        if (!data.formUrl || !data.formUrl.startsWith("https://")) {
            status.innerText = "Error: Invalid Google Form URL received";
            status.style.color = "red";
            return;
        }

        // 3. Success Message
        status.innerHTML = `
            ✅ Form Created Successfully!<br><br>
            <a href="${data.formUrl}" target="_blank" rel="noopener noreferrer">
                Click here to open Google Form
            </a>
        `;
        status.style.color = "green";
    })
    .catch(err => {
        console.error(err);
        status.innerText = "Error: Backend not reachable. Is the server running on port 3000?";
        status.style.color = "red";
    });
}