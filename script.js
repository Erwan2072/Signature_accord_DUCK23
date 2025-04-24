// frontend/script.js

document.getElementById("signatureForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstname = document.getElementById("firstname").value;
    const lastname = document.getElementById("lastname").value;
    const discord = document.getElementById("discord").value;
    const email = document.getElementById("email").value;
    const city = document.getElementById("city").value;
    const date = document.getElementById("date").value;

    showToast("📄 Génération du PDF en cours...", "info");

    try {
      const response = await fetch("http://localhost:3001/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstname, lastname, discord, email, city, date }),
      });

      if (!response.ok) {
        throw new Error("Une erreur est survenue lors de la génération du PDF.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Engagement_${lastname}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast("✅ PDF généré et envoyé avec succès !", "success");
    } catch (error) {
      showToast("❌ Une erreur est survenue : " + error.message, "error");
    }
  });

  // Fonction de toast notification
  function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    toast.textContent = message;

    toast.className = `toast visible ${type}`;
    setTimeout(() => {
      toast.className = "toast hidden";
    }, 4000);
  }
