

/* ═══ BUY ME COFFEE ═══ */
document.getElementById("btn-coffee").addEventListener("click", () => {
  document.getElementById("modal-coffee").classList.remove("hidden");
});

document.getElementById("btn-coffee-close").addEventListener("click", () => {
  document.getElementById("modal-coffee").classList.add("hidden");
});

// Close coffee modal on backdrop click
document.getElementById("modal-coffee").addEventListener("click", (e) => {
  if (e.target.id === "modal-coffee") {
    document.getElementById("modal-coffee").classList.add("hidden");
  }
});

// Copy wallet address
document.getElementById("btn-copy-wallet").addEventListener("click", () => {
  const addr = document.getElementById("wallet-addr").textContent;
  navigator.clipboard.writeText(addr).then(() => {
    const msg = document.getElementById("wallet-copied");
    msg.classList.remove("hidden");
    document.getElementById("btn-copy-wallet").textContent = "✅ Copied!";
    setTimeout(() => {
      msg.classList.add("hidden");
      document.getElementById("btn-copy-wallet").textContent = "📋 Copy Address";
    }, 3000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = addr;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    const msg = document.getElementById("wallet-copied");
    msg.classList.remove("hidden");
    document.getElementById("btn-copy-wallet").textContent = "✅ Copied!";
    setTimeout(() => {
      msg.classList.add("hidden");
      document.getElementById("btn-copy-wallet").textContent = "📋 Copy Address";
    }, 3000);
  });
});
