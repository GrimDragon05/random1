const API_KEY = "idlemmo_iyDt8FtSSdBQehyvDBozrbaIYQcE89kaTCJ0XdNKIqUNW4sD";
const BASE_URL = "https://api.idle-mmo.com/v1/item";

let selectedItem = null;
let vendorPrice = 0;
let hashedId = null;

function searchItem() {
  const name = document.getElementById('itemName').value.trim();
  if (!name) return;
  document.getElementById('itemSelectDiv').style.display = 'none';
  document.getElementById('calcDiv').style.display = 'none';
  document.getElementById('result').innerHTML = '';
  fetch(`${BASE_URL}/search?q=${encodeURIComponent(name)}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  })
    .then(r => r.json())
    .then(data => {
      if (data.items && data.items.length > 0) {
        const select = document.createElement('select');
        select.id = 'itemSelect';
        data.items.forEach((item, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.text = `${item.name} (Vendor: ${item.vendor_price ?? 'N/A'})`;
          select.appendChild(opt);
        });
        select.onchange = () => {
          selectedItem = data.items[select.value];
          vendorPrice = selectedItem.vendor_price || 0;
          hashedId = selectedItem.hashed_id;
          showItemImage(selectedItem);
          document.getElementById('calcDiv').style.display = 'block';
        };
        selectedItem = data.items[0];
        vendorPrice = selectedItem.vendor_price || 0;
        hashedId = selectedItem.hashed_id;
        document.getElementById('itemSelectDiv').innerHTML = '<label>Select Item:</label>';
        document.getElementById('itemSelectDiv').appendChild(select);
        showItemImage(selectedItem);
        document.getElementById('itemSelectDiv').style.display = 'block';
        document.getElementById('calcDiv').style.display = 'block';
      } else {
        document.getElementById('itemSelectDiv').innerHTML = '<span>No items found.</span>';
        document.getElementById('itemSelectDiv').style.display = 'block';
      }
    })
    .catch(() => {
      document.getElementById('itemSelectDiv').innerHTML = '<span>Error fetching items.</span>';
      document.getElementById('itemSelectDiv').style.display = 'block';
    });
}

function showItemImage(item) {
  let imgHtml = '';
  if (item && item.image_url) {
    imgHtml = `<img class="item-image" src="${item.image_url}" alt="${item.name}" />`;
  }
  document.getElementById('itemSelectDiv').innerHTML += imgHtml;
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
      let resultHtml = `<div><b>Vendor price per item:</b> <span style='color:#fff'>${formatGold(vendorPrice)}</span></div>`;
      resultHtml += `<div><b>Total vendor gold:</b> <span style='color:#fff'>${formatGold(vendorTotal)}</span></div>`;
      if (data.history_data && data.history_data.length > 0) {
        const avgPrice = data.history_data[data.history_data.length-1].average_price;
        const marketTotal = avgPrice * quantity;
        const tax = marketTotal * (taxRate / 100);
        const marketAfterTax = marketTotal - tax;
        const diff = marketAfterTax - vendorTotal;
        resultHtml += `<div style='margin-top:10px'><b>Latest market average price per item:</b> <span style='color:#fff'>${formatGold(avgPrice)}</span></div>`;
        resultHtml += `<div><b>Total market gold (before tax):</b> <span style='color:#fff'>${formatGold(marketTotal)}</span></div>`;
        resultHtml += `<div><b>Tax deducted:</b> <span style='color:#fff'>${formatGold(tax)}</span></div>`;
        resultHtml += `<div><b>Total market gold (after tax):</b> <span style='color:#fff'>${formatGold(marketAfterTax)}</span></div>`;
        resultHtml += `<div style='margin-top:10px'><b>Difference (Market - Vendor):</b> <span style='color:${diff>=0?'#00ff99':'#ff5555'}'>${formatGold(diff)}</span></div>`;
      } else {
        resultHtml += '<div style="color:#ff5555">No market history available for this item.</div>';
      }
      document.getElementById('result').innerHTML = resultHtml;
    })
    .catch(() => {
      document.getElementById('result').innerHTML = '<span style="color:#ff5555">Error fetching market data.</span>';
    });
}
