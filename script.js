const API = "https://api.josh.cat";

const fromCoin = document.getElementById("fromCoin");
const toCoin = document.getElementById("toCoin");
const amount = document.getElementById("amount");
const wallet = document.getElementById("wallet");
const confirmModal = document.getElementById("confirmModal");
const confirmDetails = document.getElementById("confirmDetails");
const resultBox = document.getElementById("result");
const progressBox = document.getElementById("progress");

let selectedFrom, selectedTo, totalSend, currentTxId, timerInterval;

const coins = ["btc","eth","ltc","sol","ton","xmr"];
fromCoin.innerHTML = coins.map(c => `<option value="${c}">${c.toUpperCase()}</option>`).join("");
toCoin.innerHTML = coins.map(c => `<option value="${c}">${c.toUpperCase()}</option>`).join("");
toCoin.value = "eth";

function openConfirm() {
  selectedFrom = fromCoin.value;
  selectedTo = toCoin.value;

  const amt = parseFloat(amount.value);
  if (isNaN(amt) || amt <= 0) return alert("Enter valid amount");
  if (!wallet.value) return alert("Enter wallet address");

  totalSend = (amt * 1.05).toFixed(8);

  confirmDetails.innerHTML =
    `**${selectedFrom.toUpperCase()} → ${selectedTo.toUpperCase()}**\n\n` +
    `Amount (incl. fee): \`${totalSend} ${selectedFrom.toUpperCase()}\`\n` +
    `Wallet: \`${wallet.value}\``;

  confirmModal.classList.remove("hidden");
}

function closeModal() { confirmModal.classList.add("hidden"); }

async function confirmSwap() {
  closeModal();
  resultBox.textContent = "Creating swap...";

  const body = {
    from: selectedFrom,
    to: selectedTo,
    amount: parseFloat(amount.value),
    wallet: wallet.value
  };

  const r = await fetch(`${API}/createTx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  }).then(r => r.json());

  if (r.error) return (resultBox.textContent = "Error creating transaction");

  currentTxId = r.id;
  resultBox.textContent =
    `Deposit Address:\n\`${r.payinAddress}\`\n\n` +
    `Send: **${r.totalSend} ${selectedFrom.toUpperCase()}**`;

  startCountdown(35 * 60);
  pollStatus();
}

function startCountdown(seconds) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    progressBox.textContent = `⏳ Expires in ${m}:${s.toString().padStart(2, "0")}`;
    seconds--;
    if (seconds < 0) {
      clearInterval(timerInterval);
      progressBox.textContent = "⚠️ Expired";
    }
  }, 1000);
}

async function pollStatus() {
  const r = await fetch(`${API}/status?id=${currentTxId}`, {
    credentials: "include"
  }).then(r => r.json());

  if (r.state === "finished") {
    progressBox.textContent = `🎉 Completed!\nTx: \`${r.txHash}\``;
    clearInterval(timerInterval);
    return;
  }

  if (r.state === "failed") {
    progressBox.textContent = "❌ Failed";
    clearInterval(timerInterval);
    return;
  }

  setTimeout(pollStatus, 4000);
}
