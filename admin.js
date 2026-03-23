// Admin script for admin.html
$(function() {
  let foodMenu = JSON.parse(localStorage.getItem('foodMenu')) || [
    { id: 1, name: '🍕 Pizza', desc: 'Cheese pizza', price: 12.99 },
    { id: 2, name: '🍔 Burger', desc: 'Juicy burger', price: 10.99 },
    { id: 3, name: '🍜 Pasta', desc: 'Italian pasta', price: 13.99 }
  ];

  let orders = JSON.parse(localStorage.getItem('orders')) || [];

  const adminLoginScreen = $('#adminLoginScreen');
  const adminPanel = $('#adminPanel');
  const adminUsername = $('#adminUsername');
  const adminPassword = $('#adminPassword');
  const adminLoginBtn = $('#adminLoginBtn');
  const adminLogoutBtn = $('#adminLogout');
  const adminCreateBtn = $('#adminCreateFood');
  const adminMenuList = $('#adminMenuList');
  const adminOrdersList = $('#adminOrdersList');

  function renderAdminDashboard() {
    adminMenuList.empty();
    foodMenu.forEach(food => {
      const item = `
        <div class="card mb-2 bg-dark-2">
          <div class="card-body p-2">
            <div class="row align-items-center">
              <div class="col-7">
                <h6 class="mb-0">${food.name}</h6>
                <small class="text-muted">£${food.price.toFixed(2)}</small>
              </div>
              <div class="col-5 text-end">
                <button class="btn btn-xs btn-danger delete-food" data-id="${food.id}">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `;
      adminMenuList.append(item);
    });

    $('.delete-food').click(function() {
      const id = $(this).data('id');
      if (confirm('Delete this item?')) {
        foodMenu = foodMenu.filter(f => f.id != id);
        localStorage.setItem('foodMenu', JSON.stringify(foodMenu));
        renderAdminDashboard();
      }
    });

    renderOrdersList();
  }

  function renderOrdersList() {
    adminOrdersList.empty();
    if (orders.length === 0) {
      adminOrdersList.html('<p class="text-muted">No orders yet</p>');
      return;
    }

    orders.forEach((order, idx) => {
      const itemsHtml = order.items.map(item =>
        `${item.name} x${item.qty} (£${(item.price * item.qty).toFixed(2)})`
      ).join('<br>');

      const orderHtml = `
        <div class="card mb-2 bg-dark-2">
          <div class="card-body p-2">
            <div><strong>Order #${idx + 1}</strong></div>
            <small class="text-muted">${new Date(order.date).toLocaleString()}</small>
            <div class="mt-1">${itemsHtml}</div>
            <div class="mt-1"><strong>Total: £${order.total.toFixed(2)}</strong></div>
          </div>
        </div>
      `;
      adminOrdersList.append(orderHtml);
    });
  }

  adminLoginBtn.click(function() {
    const username = adminUsername.val();
    const password = adminPassword.val();

    if (username === 'admin' && password === 'password') {
      adminLoginScreen.hide();
      adminPanel.show();
      renderAdminDashboard();
      alert('✓ Admin login successful!');
    } else {
      alert('❌ Invalid credentials');
    }
  });

  adminLogoutBtn.click(function() {
    adminPanel.hide();
    adminLoginScreen.show();
    adminUsername.val('');
    adminPassword.val('');
  });

  adminCreateBtn.click(function() {
    const name = $('#adminFoodName').val().trim();
    const desc = $('#adminFoodDesc').val().trim();
    const price = $('#adminFoodPrice').val().trim();

    if (!name || !price) {
      alert('Please fill in all required fields');
      return;
    }

    const newFood = {
      id: Math.max(...foodMenu.map(f => f.id), 0) + 1,
      name: name,
      desc: desc || 'Delicious food',
      price: parseFloat(price)
    };

    foodMenu.push(newFood);
    localStorage.setItem('foodMenu', JSON.stringify(foodMenu));
    $('#adminFormFood')[0].reset();
    renderAdminDashboard();
    alert('✓ Food item created!');
  });

  adminPanel.hide();
});
