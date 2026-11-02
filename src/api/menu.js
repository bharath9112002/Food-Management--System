// The starting menu comes from DummyJSON recipes; after the first load the menu
// lives in localStorage so added, edited and deleted items persist.

const SEED_URL = 'https://dummyjson.com/recipes?limit=0'

export const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Appetizer', 'Snack', 'Dessert', 'Beverage']

// Eggs are deliberately left out so baked goods and desserts stay vegetarian.
const NON_VEG =
  /\b(chicken|beef|pork|lamb|mutton|fish|salmon|shrimps?|prawns?|tuna|bacon|ham|turkey|anchov\w*|crab|squid|sausages?|duck|goat|meat|steak|prosciutto|pepperoni|chorizo|veal|mussels?|clams?|octopus|lobster|scallops?|cod|keema|gelatin|seafood|bulgogi)\b/i

function toFoodItem(recipe) {
  const text = [recipe.name, ...recipe.ingredients].join(' ')
  const isVeg = !NON_VEG.test(text)
  const category = recipe.mealType[0] === 'Snacks' ? 'Snack' : recipe.mealType[0]
  const [first, second, third] = recipe.ingredients.map((i) => i.split(',')[0].toLowerCase())
  const difficulty = recipe.difficulty.toLowerCase()
  const article = /^[aeiou]/.test(difficulty) ? 'An' : 'A'

  return {
    id: String(recipe.id),
    name: recipe.name,
    description: `${article} ${difficulty}-to-make ${recipe.cuisine} favourite prepared with ${first}, ${second} and ${third}.`,
    price: Math.round((99 + recipe.caloriesPerServing * 0.6 + (isVeg ? 0 : 60)) / 10) * 10 - 1,
    category: CATEGORIES.includes(category) ? category : 'Dinner',
    isVeg,
    available: recipe.id % 6 !== 0,
    image: recipe.image,
    cuisine: recipe.cuisine,
    rating: recipe.rating,
    calories: recipe.caloriesPerServing,
    prepTime: recipe.prepTimeMinutes + recipe.cookTimeMinutes,
    ingredients: recipe.ingredients,
    restaurantId: recipe.id,
  }
}

export async function fetchSeedMenu(signal) {
  let response
  try {
    response = await fetch(SEED_URL, { signal })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new Error('Unable to reach the server. Check your internet connection.')
  }
  if (!response.ok) throw new Error(`Something went wrong (error ${response.status}).`)
  const data = await response.json()
  return data.recipes.map(toFoodItem)
}
