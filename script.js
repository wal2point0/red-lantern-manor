// Voice Restaurant App
$(function() {
  // Data
  let foodMenu = JSON.parse(localStorage.getItem('foodMenu')) || [
    { id: 1, name: '🍕 Pizza', desc: 'Cheese pizza', price: 12.99 },
    { id: 2, name: '🍔 Burger', desc: 'Juicy burger', price: 10.99 },
    { id: 3, name: '🍜 Pasta', desc: 'Italian pasta', price: 13.99 }
  ];
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let orders = JSON.parse(localStorage.getItem('orders')) || [];
  
  // DOM selectors
  const intro = $('#introduction');
  const main = $('#mainContent');
  const cards = $('#cards');
  const cartBadge = $('#cartCount');
  const cartItems = $('#cartItems');
  const cartEmpty = $('#cartEmpty');
  const cartTotal = $('#cartTotal');
  const voiceStart = $('#voiceStartBtn');
  const voiceStop = $('#voiceStopBtn');
  const voiceStatus = $('#voiceStatus');
  const finalSpan = $('#final_span');
  const interimSpan = $('#interim_span');
  
  // Admin functionality is handled in admin.js
  
  // Device detection
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(navigator.userAgent);
  
  // Voice Recognition
  let recognition;
  let finalTranscript = '';
  
  function initVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceStatus.text('⚠️ Voice not supported in this browser');
      voiceStart.prop('disabled', true);
      console.error('Speech Recognition API not available');
      return;
    }
    
    try {
      recognition = new SpeechRecognition();
      recognition.lang = 'en-GB';
      recognition.maxAlternatives = 5;
      recognition.continuous = true; // keep listening for better mobile recognition
      recognition.interimResults = false; // use final transcripts to reduce noise on mobile
      if (isMobile) {
        voiceStatus.text('🎤 Mobile mode: speak clearly and pause after phrase');
      }
      console.log('✓ Speech recognition initialized successfully');
    } catch (e) {
      console.error('Error initializing speech recognition:', e);
      voiceStatus.text('⚠️ Error initializing voice');
      voiceStart.prop('disabled', true);
      return;
    }
    
    recognition.onstart = function() {
      voiceStatus.text('🎤 Listening...');
      if (voiceStop) voiceStop.prop('disabled', false);
      finalSpan.text('');
      interimSpan.text('');
    };
    
    recognition.onresult = function(event) {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      finalSpan.text(finalTranscript.trim());
      interimSpan.text(interim);
    };
    
    recognition.onend = function() {
      voiceStatus.text('✓ Done listening');
      if (voiceStop) voiceStop.prop('disabled', true);
      if (finalTranscript.trim()) {
        processVoiceCommand(finalTranscript);
      }
      finalTranscript = '';
    };
    
    recognition.onerror = function(event) {
      voiceStatus.text('❌ Error: ' + event.error);
    };
  }
  
  function processVoiceCommand(text) {
    text = text.toLowerCase().trim();
    console.log('Processing voice command:', text);
    
    if (text.includes('add')) {
      console.log('User said "add" - looking for food items');
      let foundFood = null;
      
      // Try exact word match with food names
      for (let food of foodMenu) {
        const foodWords = food.name.toLowerCase().split(' ');
        for (let word of foodWords) {
          if (word.length > 2 && text.includes(word)) {
            foundFood = food;
            console.log('Matched food:', food.name);
            break;
          }
        }
        if (foundFood) break;
      }
      
      if (foundFood) {
        addToCart(foundFood);
        finalSpan.text('✓ Added ' + foundFood.name + ' to cart!');
        console.log('Added to cart:', foundFood.name);
      } else {
        finalSpan.text('❌ Could not find that item. Try: pizza, burger, or pasta');
        console.log('No matching food found in:', foodMenu.map(f => f.name));
      }
    } else if (text.includes('show') && text.includes('cart')) {
      new bootstrap.Modal(document.getElementById('modalCart')).show();
      finalSpan.text('📭 Opening cart...');
    } else if (text.includes('cart')) {
      new bootstrap.Modal(document.getElementById('modalCart')).show();
      finalSpan.text('📭 Opening cart...');
    } else if (text.includes('menu')) {
      finalSpan.text('📋 Here is our menu');
    } else {
      finalSpan.text('⚠️ Command not recognized. Try: "add pizza", "show cart", or "show menu"');
      console.log('Unrecognized command:', text);
    }
  }
  
  // Admin functionality relocated to admin.js
  
  // Add to cart
  function addToCart(food) {
    let item = cart.find(i => i.id == food.id);
    if (item) {
      item.qty++;
    } else {
      cart.push({...food, qty: 1});
    }
    saveCart();
    updateCart();
  }
  
  // Save cart to localStorage
  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  
  // Update cart display
  function updateCart() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    cartBadge.text(total);
    
    if (cart.length === 0) {
      cartItems.empty();
      cartEmpty.show();
      cartTotal.text('£0.00');
    } else {
      cartEmpty.hide();
      cartItems.empty();
      
      cart.forEach(item => {
        const itemTotal = (item.price * item.qty).toFixed(2);
        const row = `
          <div class="card mb-2">
            <div class="card-body p-2">
              <div class="row align-items-center">
                <div class="col-5">
                  <h6 class="mb-0">${item.name}</h6>
                  <small>£${item.price.toFixed(2)}</small>
                </div>
                <div class="col-4">
                  <button class="btn btn-xs btn-outline qty-minus" data-id="${item.id}">−</button>
                  <span class="mx-1">${item.qty}</span>
                  <button class="btn btn-xs btn-outline qty-plus" data-id="${item.id}">+</button>
                </div>
                <div class="col-2">£${itemTotal}</div>
                <div class="col-1">
                  <button class="btn btn-xs btn-danger remove" data-id="${item.id}">✕</button>
                </div>
              </div>
            </div>
          </div>
        `;
        cartItems.append(row);
      });
      
      $('.qty-plus').click(function() {
        const id = $(this).data('id');
        const item = cart.find(i => i.id == id);
        if (item) item.qty++;
        saveCart();
        updateCart();
      });
      
      $('.qty-minus').click(function() {
        const id = $(this).data('id');
        const item = cart.find(i => i.id == id);
        if (item) {
          item.qty--;
          if (item.qty <= 0) cart = cart.filter(i => i.id != id);
        }
        saveCart();
        updateCart();
      });
      
      $('.remove').click(function() {
        const id = $(this).data('id');
        cart = cart.filter(i => i.id != id);
        saveCart();
        updateCart();
      });
      
      const sum = cart.reduce((s, i) => s + (i.price * i.qty), 0);
      cartTotal.text('£' + sum.toFixed(2));
    }
  }
  
  
  // Render menu
  function renderMenu() {
    cards.empty();
    foodMenu.forEach(food => {
      const card = `
        <div class="col">
          <div class="card food-card h-100">
            <div class="card-body text-center">
              <div style="font-size: 2rem; margin-bottom: 10px;">${food.name.split(' ')[0]}</div>
              <h5 class="card-title">${food.name}</h5>
              <p class="card-text text-muted">${food.desc}</p>
              <h6 class="text-warning">£${food.price.toFixed(2)}</h6>
            </div>
            <div class="card-footer bg-transparent">
              <button class="btn btn-sm btn-success w-100 add-btn" data-id="${food.id}">Add to Cart</button>
            </div>
          </div>
        </div>
      `;
      cards.append(card);
    });
    
    $('.add-btn').click(function() {
      const id = $(this).data('id');
      const food = foodMenu.find(f => f.id == id);
      addToCart(food);
    });
  }
  
  // Show main content
  $('#introButton').click(function() {
    intro.hide();
    main.fadeIn();
    renderMenu();
  });
  
  voiceStart.click(function() {
    if (recognition) {
      finalTranscript = '';
      recognition.start();
      if (voiceStop) voiceStop.prop('disabled', false);
    }
  });

  voiceStop.click(function() {
    if (recognition) {
      recognition.stop();
      voiceStatus.text('⏹️ Stopped listening');
      voiceStop.prop('disabled', true);
    }
  });
  
  // Checkout
  $('#btnCheckout').click(function() {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    const total = parseFloat(cartTotal.text().replace('£', ''));
    const order = {
      items: [...cart],
      total: total,
      date: new Date().toISOString()
    };
    
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    alert('Thank you for your order! Total: £' + total.toFixed(2));
    cart = [];
    saveCart();
    updateCart();
  });
  
  // Setup mobile stop button and init
  if (isMobile) {
    voiceStop.show();
    voiceStop.prop('disabled', true);
  } else {
    voiceStop.hide();
  }

  initVoice();
  updateCart();
});
