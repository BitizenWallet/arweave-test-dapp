let arConnectInstalled = false;

const connectButton = document.querySelector("#connect");
const userinfo = document.querySelector("#userinfo");
const currentAddressElement = document.querySelector("#address");
const disconnectButton = document.querySelector("#disconnect");
const createTXButton = document.querySelector("#createTX");
const createTXInfo = document.querySelector("#createTXInfo");
const encryptButton = document.querySelector("#encrypt");
const encryptInfo = document.querySelector("#encryptInfo");

// wait for the ArConnect script to be injected into the window object
window.addEventListener("arweaveWalletLoaded", async () => {
  console.log("event arweaveWalletLoaded listener fired")
  connectButton.innerHTML = "Connect to ArConnect";
  arConnectInstalled = true;

  const loggedIn = (await window.arweaveWallet.getPermissions()).length > 0;
  if(loggedIn) await loadData();
});

// update address element on active / current address update
window.addEventListener("walletSwitch", (e) => {
  const newAddress = e.detail.address;
  console.log("event walletSwitch listener fired, new address", newAddress)
  currentAddressElement.innerHTML = newAddress;
})

connectButton.onclick = async () => {
  console.log("connectButton called");
  // open install website if ArConnect is not installed
  if(!arConnectInstalled) return window.open("https://arconnect.io");
  try {
    // connect to ArConnect with permissions and app info
    // !!app info is not available in ArConnect 0.2.2!!
    await window.arweaveWallet.connect(["ACCESS_ADDRESS", "ACCESS_ALL_ADDRESSES", "SIGN_TRANSACTION", "ENCRYPT", "DECRYPT"], { name: "Super Cool App", logo: "https://verto.exchange/logo_dark.svg" });

    await loadData();
  } catch (e) {
    console.log("Failed to connect to ArConnect", e);
  }
}

disconnectButton.onclick = async () => {
  // disconnect from ArConnect / sign out
  await window.arweaveWallet.disconnect();

  // display connect button
  connectButton.style.display = "block";
  
  // hide disconnect and tx button
  disconnectButton.style.display = "none";
  createTXButton.style.display = "none";
  encryptButton.style.display = "none";

  // remove user data
  userinfo.innerHTML = "";

  // remove encrypt info
  encryptInfo.innerHTML = "";

  // remove tx info
  createTXInfo.innerHTML = "";

  // remove current address
  currentAddressElement.innerHTML = "";
}

createTXButton.onclick = async () => {
  try {
    const arweave = Arweave.init();
    const tx = await arweave.createTransaction({
      target: '7DbvFN1Hy2j24-xYNf13mS1X2X5JZyjtVc4ceZT1E6k',
      quantity: '1000000000000000',
      data: '<html><head><meta charset="UTF-8"><title>Hello world!</title></head><body></body></html>'
    });
    tx.addTag("Content-Type", "text/html")

    console.log("TX created: \n", tx);

    const rawTxJson = JSON.stringify(tx,null, 2);
    createTXInfo.innerHTML = `tx before sign:<br />${rawTxJson}
    `

    const signedTx = await window.arweaveWallet.sign(tx);
    console.log("TX signed: \n", signedTx);

    const signedTxJson = JSON.stringify(signedTx,null, 2);
    createTXInfo.innerHTML = `tx before sign:<br />${rawTxJson}<br /><br />tx after sign:<br />${signedTxJson}
    `
  } catch (e) {
    console.log(e);
    alert(e);
  }
};

encryptButton.onclick = async () => {
  // encrypt
  try {
    const inputData = "ABCD1234"

    const data = await window.arweaveWallet.encrypt(inputData, {
      algorithm: "RSA-OAEP",
      hash: "SHA-256",
    });

    console.log("Encrypted:", data);

    // decrypt
    const res = await window.arweaveWallet.decrypt(data, {
      algorithm: "RSA-OAEP",
      hash: "SHA-256",
    });

    console.log("Decrypted:", res);

    if (inputData !== res) {
      throw `The input data ${inputData} is not same as the data after decrypt ${res}`;
    }

    encryptInfo.innerHTML = `
    Input data: ${inputData}<br />
    Encrypted input data: ${data}<br />
    Data after decrypt: ${res}
    `;
  } catch (e) {
    console.log(e)
    alert(e)
  }
};

// load userinfo from ArConnect
async function loadData() {
  // get the currently selected wallet's address from ArConnect
  const address = await window.arweaveWallet.getActiveAddress();

  // get all addresses from ArConnect
  const addresses = await window.arweaveWallet.getAllAddresses();

  // get all permissions from ArConnect
  const permissions = await window.arweaveWallet.getPermissions();

  // remove connect button
  connectButton.style.display = "none";

  // show disconnect and create tx button
  disconnectButton.style.display = "block";
  createTXButton.style.display = "block";
  encryptButton.style.display = "block";

  // fill data in html
  userinfo.innerHTML = `
    Current Permission: 
    <br />${permissions.join("<br/>")}
    <br /><br />
    Addresses added to ArConnect:
    <br />
    ${addresses.join("<br/>")}
  `;

  // fill current address element
  currentAddressElement.innerHTML = address;
}