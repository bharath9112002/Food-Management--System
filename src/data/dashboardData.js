// Dummy data for the dashboard until a real API exists.

export const STATS = [
  { key: 'restaurants', label: 'Total Restaurants', value: 248, change: 4.2, icon: '🏪', tone: 'red' },
  { key: 'foodItems', label: 'Total Food Items', value: 3642, change: 7.8, icon: '🍱', tone: 'orange' },
  { key: 'orders', label: 'Total Orders', value: 12480, change: 12.5, icon: '🧾', tone: 'blue' },
  { key: 'active', label: 'Active Orders', value: 86, change: -3.1, icon: '🛵', tone: 'amber' },
  { key: 'delivered', label: 'Delivered Orders', value: 11962, change: 11.9, icon: '✅', tone: 'green' },
  { key: 'customers', label: 'Total Customers', value: 8915, change: 9.4, icon: '👥', tone: 'purple' },
]

// Monthly revenue in INR for the last 12 months (oldest first).
export const MONTHLY_REVENUE = [
  { month: 'Dec', year: 2025, revenue: 412000, orders: 860 },
  { month: 'Jan', year: 2026, revenue: 386000, orders: 812 },
  { month: 'Feb', year: 2026, revenue: 428000, orders: 891 },
  { month: 'Mar', year: 2026, revenue: 465000, orders: 948 },
  { month: 'Apr', year: 2026, revenue: 451000, orders: 925 },
  { month: 'May', year: 2026, revenue: 498000, orders: 1012 },
  { month: 'Jun', year: 2026, revenue: 534000, orders: 1076 },
  { month: 'Jul', year: 2026, revenue: 512000, orders: 1041 },
  { month: 'Aug', year: 2026, revenue: 559000, orders: 1118 },
  { month: 'Sep', year: 2026, revenue: 587000, orders: 1164 },
  { month: 'Oct', year: 2026, revenue: 642000, orders: 1253 },
  { month: 'Nov', year: 2026, revenue: 618000, orders: 1380 },
]

export const RECENT_ORDERS = [
  { id: 'ORD-10482', customer: 'Priya Sharma', restaurant: 'Spice Garden', items: 3, amount: 845, status: 'Preparing', time: '2 min ago' },
  { id: 'ORD-10481', customer: 'Arjun Mehta', restaurant: 'Pizza Palace', items: 2, amount: 1120, status: 'On the way', time: '9 min ago' },
  { id: 'ORD-10480', customer: 'Kavya Reddy', restaurant: 'Sushi Bay', items: 4, amount: 1980, status: 'Delivered', time: '18 min ago' },
  { id: 'ORD-10479', customer: 'Rahul Verma', restaurant: 'Burger Hub', items: 1, amount: 299, status: 'Cancelled', time: '25 min ago' },
  { id: 'ORD-10478', customer: 'Sneha Iyer', restaurant: 'Biryani House', items: 2, amount: 640, status: 'Delivered', time: '34 min ago' },
  { id: 'ORD-10477', customer: 'Vikram Singh', restaurant: 'Green Bowl', items: 3, amount: 760, status: 'On the way', time: '41 min ago' },
  { id: 'ORD-10476', customer: 'Ananya Das', restaurant: 'Sweet Tooth', items: 5, amount: 1240, status: 'Delivered', time: '52 min ago' },
]

export const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value)

// ₹6.4L style for axis ticks and tight spaces.
export function formatCompactINR(value) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
  return `₹${value}`
}
