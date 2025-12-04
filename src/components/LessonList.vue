<template>
  <div>
    <h2>Available Lessons</h2>

    <!-- Cart toggle button -->
    <button :disabled="cart.length === 0" @click="showCart = !showCart">
      {{ showCart ? 'Back to Lessons' : 'View Cart' }}
    </button>

    <!-- Sorting controls -->
    <label for="sortAttribute">Sort by:</label>
    <select v-model="sortAttribute" id="sortAttribute">
      <option value="subject">Subject</option>
      <option value="location">Location</option>
      <option value="price">Price</option>
      <option value="spaces">Spaces</option>
    </select>

    <label>
      <input type="checkbox" v-model="sortDescending" />
      Descending
    </label>

    <!-- Search bar -->
    <label for="searchBox">Search:</label>
    <input
      id="searchBox"
      type="text"
      v-model="searchQuery"
      @input="searchLessons"
      placeholder="Type to search lessons..."
    />

    <!-- Lesson cards -->
    <div v-if="!showCart">
      <div v-for="lesson in sortedLessons" :key="lesson._id" class="lesson-card">
        <h3>{{ lesson.subject }}</h3>
        <p>Location: {{ lesson.location }}</p>
        <p>Price: £{{ lesson.price }}</p>
        <p>Spaces: {{ lesson.spaces }}</p>
        <i class="fas fa-book fa-2x"></i>

        <button :disabled="lesson.spaces === 0" @click="addToCart(lesson)">
          Add to Cart
        </button>
      </div>
    </div>

    <!-- Cart view -->
    <div v-else>
      <h2>Shopping Cart</h2>
      <div v-for="(lesson, index) in cart" :key="index" class="lesson-card">
        <h3>{{ lesson.subject }}</h3>
        <p>Location: {{ lesson.location }}</p>
        <p>Price: £{{ lesson.price }}</p>
        <button @click="removeFromCart(index)">Remove</button>
      </div>

      <!-- Checkout form -->
      <h3>Checkout</h3>
      <form @submit.prevent="submitOrder">
        <label>
          Name:
          <input v-model="checkoutName" type="text" required />
        </label>
        <br />
        <label>
          Phone:
          <input v-model="checkoutPhone" type="text" required />
        </label>
        <br />
        <button :disabled="!isFormValid">Submit Order</button>
      </form>

      <p v-if="orderSubmitted">Order submitted successfully!</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sortAttribute: 'subject',
      sortDescending: false,
      showCart: false,
      checkoutName: '',
      checkoutPhone: '',
      orderSubmitted: false,
      lessons: [],
      cart: [],
      searchQuery: ''
    };
  },

  computed: {
    sortedLessons() {
      return [...this.lessons].sort((a, b) => {
        const valA = a[this.sortAttribute];
        const valB = b[this.sortAttribute];

        let result;
        if (typeof valA === 'string') {
          result = valA.localeCompare(valB);
        } else {
          result = valA - valB;
        }

        return this.sortDescending ? -result : result;
      });
    },
    isFormValid() {
      const nameValid = /^[A-Za-z\s]+$/.test(this.checkoutName);
      const phoneValid = /^[0-9]+$/.test(this.checkoutPhone);
      return nameValid && phoneValid;
    }
  },

  methods: {
    async loadLessons() {
      try {
        const res = await fetch('https://lesson-backend.onrender.com/lessons');
        const data = await res.json();
        this.lessons = data;
      } catch (err) {
        console.error('Failed to fetch lessons:', err);
      }
    },

    async searchLessons() {
      if (this.searchQuery.trim() === '') {
        // If search box is empty, reload all lessons
        await this.loadLessons();
        return;
      }
      try {
        const res = await fetch(
          `https://lesson-backend.onrender.com/search?q=${this.searchQuery}`
        );
        const data = await res.json();
        this.lessons = data;
      } catch (err) {
        console.error('Search failed:', err);
      }
    },

    addToCart(lesson) {
      if (lesson.spaces > 0) {
        lesson.spaces -= 1;
        this.cart.push({ ...lesson });
      }
    },

    removeFromCart(index) {
      const removedLesson = this.cart[index];
      const original = this.lessons.find(l => l._id === removedLesson._id);
      if (original) {
        original.spaces += 1;
      }
      this.cart.splice(index, 1);
    },

    async submitOrder() {
      if (this.isFormValid) {
        try {
          // 1. Send order to backend
          await fetch('https://lesson-backend.onrender.com/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: this.checkoutName,
              phone: this.checkoutPhone,
              cart: this.cart
            })
          });

          // 2. Update spaces for each lesson in backend
          for (let item of this.cart) {
            await fetch(`https://lesson-backend.onrender.com/lesson/${item._id}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ spaces: item.spaces })   
          });
          }

          // 3. Reset cart + form
          this.cart = [];
          this.checkoutName = '';
          this.checkoutPhone = '';
          this.orderSubmitted = true;
          this.showCart = false;

          // 4. Refresh lessons
          await this.loadLessons();

          alert('Your order has been placed successfully!');
        } catch (err) {
          console.error('Checkout failed:', err);
          alert('Something went wrong during checkout.');
        }
      }
    }
  },

  mounted() {
    this.loadLessons();
  }
};
</script>

<style scoped>
.lesson-card {
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 10px;
}
</style>
