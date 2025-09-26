const API_KEY = "idlemmo_iyDt8FtSSdBQehyvDBozrbaIYQcE89kaTCJ0XdNKIqUNW4sD";
const BASE_URL = "https://api.idle-mmo.com/v1/item";

let selectedItem = null;
let vendorPrice = 0;
let hashedId = null;
let allItems = [];
let fuse = null;

// Fetch all items for fuzzy search
async function fetchAllItems() {
  let items = [];
  let page = 1;
  let lastPage = 1;
  try {
    do {
      const resp = await fetch(`${BASE_URL}/search?page=${page}&per_page=100`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if (!resp.ok) {
        console.error("Item API response not ok:", resp.status, resp.statusText);
        break;
      }
      const data = await resp.json();
      if (data.items) {
        items = items.concat(data.items);
      } else {
        console.error("No items field in API response:", data);
      }
      lastPage = data.pagination?.last_page || 1;
      page++;
    } while (page <= lastPage);
  } catch (e) {
    console.error("Error fetching all items:", e);
    alert("Error fetching items from IdleMMO API. Please check your connection or API key.");
  }
  return items;
}

async function ensureAllItemsLoaded() {
  if (allItems.length === 0) {
    document.getElementById('itemSelectDiv').innerHTML = '<span>Loading items...</span>';
    allItems = await fetchAllItems();
    if (allItems.length === 0) {
      document.getElementById('itemSelectDiv').innerHTML = '<span style="color:#ff5555">Could not load any items from API!</span>';
      return;
    }
    fuse = new Fuse(allItems, {
      keys: ['name'],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
    });
  }
}

async function searchItem() {
  const name = document.getElementById('itemName').value.trim();
  if (!name) return;
  document.getElementById('itemSelectDiv').style.display = 'none';
  document.getElementById('calcDiv').style.display = 'none';
  document.getElementById('result').innerHTML = '';
  await ensureAllItemsLoaded();
  if (!fuse) return;
  let results = fuse.search(name, { limit: 10 });
  if (results.length === 0) {
    document.getElementById('itemSelectDiv').innerHTML = '<span>No items found.</span>';
    document.getElementById('itemSelectDiv').style.display = 'block';
    return;
  }
  const select = document.createElement('select');
  select.id = 'itemSelect';
  results.forEach((res, idx) => {
    const item = res.item;
    const opt = document.createElement('option');
    opt.value = idx;
    opt.text = `${item.name} (Vendor: ${item.vendor_price ?? 'N/A'})`;
    select.appendChild(opt);
  });
  select.onchange = () => {
    selectedItem = results[select.value].item;
    vendorPrice = selectedItem.vendor_price || 0;
    hashedId = selectedItem.hashed_id;
    showItemImage(selectedItem);
    document.getElementById('calcDiv').style.display = 'block';
  };
  selectedItem = results[0].item;
  vendorPrice = selectedItem.vendor_price || 0;
  hashedId = selectedItem.hashed_id;
  document.getElementById('itemSelectDiv').innerHTML = '<label>Select Item:</label>';
  document.getElementById('itemSelectDiv').appendChild(select);
  showItemImage(selectedItem);
  document.getElementById('itemSelectDiv').style.display = 'block';
  document.getElementById('calcDiv').style.display = 'block';
}

function showItemImage(item) {
  let imgHtml = '';
  if (item && item.image_url) {
    imgHtml = `<img class="item-image" src="${item.image_url}" alt="${item.name}" />`;
  }
  // To prevent image stacking, use a container div for the image and set its innerHTML
  let imgDiv = document.getElementById('itemImageDiv');
  if (!imgDiv) {
    imgDiv = document.createElement('div');
    imgDiv.id = 'itemImageDiv';
    document.getElementById('itemSelectDiv').appendChild(imgDiv);
  }
  imgDiv.innerHTML = imgHtml;
}

function formatGold(n) {
  return n.toLocaleString('en-US');
}

function calculate() {
  if (!selectedItem || !hashedId) return;
  const quantity = parseInt(document.getElementById('quantity').value) || 1;
  const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
  // Vendor calculation
  const vendorTotal = vendorPrice * quantity;
  // Market calculation
  fetch(`${BASE_URL}/${hashedId}/market-history`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  })
    .then(r => r.json())
    .then(data => {
      let vendorHtml = `<h2>Vendor</h2>`;
      vendorHtml += `<div><b>Price per item:</b> <span style='color:#fff'>${formatGold(vendorPrice)}</span></div>`;
      vendorHtml += `<div><b>Total gold:</b> <span style='color:#fff'>${formatGold(vendorTotal)}</span></div>`;

      let marketHtml = `<h2>Market</h2>`;
      if (data.history_data && data.history_data.length > 0) {
        const avgPrice = data.history_data[data.history_data.length-1].average_price;
        const marketTotal = avgPrice * quantity;
        const tax = marketTotal * (taxRate / 100);
        const marketAfterTax = marketTotal - tax;
        marketHtml += `<div><b>Avg price per item:</b> <span style='color:#fff'>${formatGold(avgPrice)}</span></div>`;
        marketHtml += `<div><b>Total before tax:</b> <span style='color:#fff'>${formatGold(marketTotal)}</span></div>`;
        marketHtml += `<div><b>Tax (${taxRate}%):</b> <span style='color:#fff'>${formatGold(tax)}</span></div>`;
        marketHtml += `<div><b>Total after tax:</b> <span style='color:#fff'>${formatGold(marketAfterTax)}</span></div>`;

        // Show difference below columns
        const diff = marketAfterTax - vendorTotal;
        document.getElementById('result').innerHTML =
          `<div class='result-col'>${vendorHtml}</div>` +
          `<div class='result-col'>${marketHtml}</div>` +
          `<div class='result-diff'>Difference (Market - Vendor): <span style='color:${diff>=0?'#00ff99':'#ff5555'}'>${formatGold(diff)}</span></div>`;
      } else {
        marketHtml += '<div style="color:#ff5555">No market history available.</div>';
        document.getElementById('result').innerHTML =
          `<div class='result-col'>${vendorHtml}</div>` +
          `<div class='result-col'>${marketHtml}</div>`;
      }
    })
    .catch((e) => {
      console.error("Error fetching market data:", e);
      document.getElementById('result').innerHTML = '<span style="color:#ff5555">Error fetching market data.</span>';
    });
}