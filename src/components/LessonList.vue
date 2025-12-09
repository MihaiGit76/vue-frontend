<template>
  <div>
    <h2>Available Lessons</h2>

    <button :disabled="cart.length === 0" @click="showCart = !showCart">
      {{ showCart ? "Back to Lessons" : "View Cart" }}
    </button>

    <div v-if="!showCart">

      <label>Sort by:
        <select v-model="sortAttribute">
          <option value="subject">Subject</option>
          <option value="location">Location</option>
          <option value="price">Price</option>
          <option value="spaces">Spaces</option>
        </select>
      </label>

      <label>
        <input type="checkbox" v-model="sortDescending" />
        Descending
      </label>

      <br><br>

      <input
        v-model="searchQuery"
        @input="searchLessons"
        placeholder="Search lessons..."
      />

      <div
        v-for="lesson in sortedLessons"
        :key="lesson._id"
        class="lesson-card"
      >
        <img
          :src="lesson.image"
          alt="Lesson image"
          width="80"
          class="lesson-image"
        />

        <h3>{{ lesson.subject }}</h3>
        <p>Location: {{ lesson.location }}</p>
        <p>Price: £{{ lesson.price }}</p>
        <p>Spaces: {{ lesson.spaces }}</p>

        <button :disabled="lesson.spaces === 0" @click="addToCart(lesson)">
          Add to Cart
        </button>
      </div>
    </div>

    <div v-else>
      <h2>Shopping Cart</h2>

      <div v-for="(lesson, i) in cart" :key="i">
        {{ lesson.subject }} — £{{ lesson.price }}
        <button @click="removeFromCart(i)">Remove</button>
      </div>

      <h3>Checkout</h3>

      <input v-model="checkoutName" placeholder="Name" />
      <input v-model="checkoutPhone" placeholder="Phone" />

      <button :disabled="!isFormValid" @click="submitOrder">
        Submit Order
      </button>

      <p v-if="orderSubmitted">✅ Order submitted successfully!</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      lessons: [],  // ✅ Must be EMPTY
      cart: [],
      searchQuery: "",
      sortAttribute: "subject",
      sortDescending: false,
      showCart: false,
      checkoutName: "",
      checkoutPhone: "",
      orderSubmitted: false
    };
  },

  computed: {
    sortedLessons() {
      return [...this.lessons].sort((a, b) => {
        const A = a[this.sortAttribute];
        const B = b[this.sortAttribute];

        let result =
          typeof A === "string"
            ? A.localeCompare(B)
            : A - B;

        return this.sortDescending ? -result : result;
      });
    },

    isFormValid() {
      return (
        /^[A-Za-z\s]+$/.test(this.checkoutName) &&
        /^[0-9]+$/.test(this.checkoutPhone)
      );
    }
  },

  methods: {
    async loadLessons() {
      const res = await fetch(
        "https://express-backend-7apr.onrender.com/lessons"
      );
      this.lessons = await res.json();
    },

    async searchLessons() {
      if (!this.searchQuery.trim()) {
        await this.loadLessons();
        return;
      }

      const res = await fetch(
        `https://express-backend-7apr.onrender.com/search?q=${this.searchQuery}`
      );

      this.lessons = await res.json();
    },

    addToCart(lesson) {
      lesson.spaces--;
      this.cart.push({ ...lesson });
    },

    removeFromCart(index) {
      const removed = this.cart[index];

      const original = this.lessons.find(
        l => l._id === removed._id
      );

      if (original) {
        original.spaces++;
      }

      this.cart.splice(index, 1);
    },

    async submitOrder() {
      await fetch(
        "https://express-backend-7apr.onrender.com/orders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: this.checkoutName,
            phone: this.checkoutPhone,
            cart: this.cart
          })
        }
      );

      for (const item of this.cart) {
        await fetch(
          `https://express-backend-7apr.onrender.com/lesson/${item._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ spaces: item.spaces })
          }
        );
      }

      this.cart = [];
      this.checkoutName = "";
      this.checkoutPhone = "";
      this.showCart = false;
      this.orderSubmitted = true;

      this.loadLessons();
    }
  },

  mounted() {
    this.loadLessons();
  }
};
</script>

<style>
.lesson-card {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px;
}

.lesson-image {
  border-radius: 8px;
  margin-bottom: 5px;
}
</style>
