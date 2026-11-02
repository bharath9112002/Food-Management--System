// Restaurant data comes from DummyJSON (https://dummyjson.com), a free public API.
// It has no restaurant endpoint, so each recipe (photo, cuisine, rating, reviews)
// is paired with the user of the same id (surname, address) to form a restaurant.
// Delivery time, fee and opening hours are derived from the record so they're stable.

const BASE_URL = 'https://dummyjson.com'
const TIMEOUT_MS = 10000

const NAME_SUFFIXES = ['Kitchen', 'Bistro', 'House', 'Grill', 'Eatery', 'Table']
const DELIVERY_FEES = [0, 29, 39, 49]
// A mix of all-day, lunch-only and dinner-only places so both statuses show up.
const OPENING_HOURS = [
  { open: 8, close: 22 },
  { open: 11, close: 15 },
  { open: 18, close: 23 },
  { open: 10, close: 23 },
  { open: 7, close: 12 },
  { open: 12, close: 22 },
  { open: 17, close: 23 },
]

let cache = null

async function fetchJson(path, signal) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, { signal: combined })
  } catch (err) {
    if (signal?.aborted) throw err
    if (timeout.aborted) throw new Error('The server took too long to respond. Please try again.')
    throw new Error('Unable to reach the server. Check your internet connection.')
  }

  if (response.status === 404 || response.status === 400) throw new Error('Restaurant not found')
  if (!response.ok) throw new Error(`Something went wrong (error ${response.status}).`)
  return response.json()
}

function toRestaurant(recipe, user) {
  const { id } = recipe
  const cookTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes
  const deliveryMin = Math.min(55, Math.max(20, Math.round(cookTime / 5) * 5))

  return {
    id,
    name: `${user?.lastName ?? recipe.name.split(' ')[0]}'s ${recipe.cuisine} ${NAME_SUFFIXES[id % NAME_SUFFIXES.length]}`,
    image: recipe.image,
    cuisine: recipe.cuisine,
    rating: recipe.rating,
    reviewCount: recipe.reviewCount,
    deliveryTime: { min: deliveryMin, max: deliveryMin + 10 },
    deliveryFee: DELIVERY_FEES[id % DELIVERY_FEES.length],
    costForTwo: 200 + (recipe.caloriesPerServing % 6) * 100,
    address: user
      ? `${user.address.address}, ${user.address.city}, ${user.address.stateCode}`
      : 'Address unavailable',
    hours: OPENING_HOURS[id % OPENING_HOURS.length],
    tags: recipe.tags,
    mealType: recipe.mealType,
    signatureDish: {
      name: recipe.name,
      ingredients: recipe.ingredients,
      difficulty: recipe.difficulty,
      calories: recipe.caloriesPerServing,
    },
  }
}

export async function fetchRestaurants(signal) {
  if (cache) return cache

  const [recipes, users] = await Promise.all([
    fetchJson('/recipes?limit=0', signal),
    fetchJson('/users?limit=0&select=lastName,address', signal),
  ])
  const usersById = new Map(users.users.map((u) => [u.id, u]))
  cache = recipes.recipes.map((r) => toRestaurant(r, usersById.get(r.id)))
  return cache
}

export async function fetchRestaurant(id, signal) {
  const cached = cache?.find((r) => r.id === Number(id))
  if (cached) return cached

  const recipe = await fetchJson(`/recipes/${encodeURIComponent(id)}`, signal)
  const user = await fetchJson(`/users/${recipe.id}?select=lastName,address`, signal).catch(
    () => null,
  )
  return toRestaurant(recipe, user)
}

export function isOpenNow({ hours }, date = new Date()) {
  const hour = date.getHours()
  return hour >= hours.open && hour < hours.close
}

export function formatHour(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:00 ${suffix}`
}
