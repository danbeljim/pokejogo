// Test item equipping logic
const ITEMS = [
  { id: 'muscle-band', name: 'Muscle Band', description: '+5 Attack', bonus: { attack: 5 } },
  { id: 'metal-coat', name: 'Metal Coat', description: '+5 Defense', bonus: { defense: 5 } },
  { id: 'quick-claw', name: 'Quick Claw', description: '+5 Speed', bonus: { speed: 5 } },
];

function unequipItem(pokemon) {
  if (!pokemon.heldItem) return null
  const heldItemName = pokemon.heldItem
  const item = ITEMS.find(i => i.name === heldItemName)
  if (!item) return null
  
  pokemon.attack -= item.bonus.attack || 0
  pokemon.defense -= item.bonus.defense || 0
  pokemon.speed -= item.bonus.speed || 0
  if (item.bonus.hp) {
    pokemon.maxHp -= item.bonus.hp
    pokemon.hp = Math.min(pokemon.hp - item.bonus.hp, pokemon.maxHp)
    if (pokemon.maxHp < 1) pokemon.maxHp = 1
    if (pokemon.hp < 1) pokemon.hp = 1
  }
  pokemon.heldItem = undefined
  return item
}

function equipItem(pokemon, item) {
  const oldItem = unequipItem(pokemon)
  
  pokemon.attack += item.bonus.attack || 0
  pokemon.defense += item.bonus.defense || 0
  pokemon.speed += item.bonus.speed || 0
  if (item.bonus.hp) {
    pokemon.maxHp += item.bonus.hp
    pokemon.hp = Math.min(pokemon.hp + item.bonus.hp, pokemon.maxHp)
    if (pokemon.maxHp < 1) pokemon.maxHp = 1
    if (pokemon.hp < 1) pokemon.hp = 1
  }
  pokemon.heldItem = item.name
  
  return oldItem
}

// Test 1: Equip item to Pokémon with no held item
console.log('Test 1: Equip to empty Pokémon');
const poke1 = { attack: 10, defense: 10, speed: 10, heldItem: undefined };
const returned1 = equipItem(poke1, ITEMS[0]); // Muscle Band (+5 attack)
console.log('  Returned item:', returned1);
console.log('  Pokémon attack:', poke1.attack, '(should be 15)');
console.log('  Pokémon held:', poke1.heldItem, '(should be Muscle Band)');
console.assert(!returned1, '❌ Should return null for first equip');
console.assert(poke1.attack === 15, '❌ Attack should be 15');
console.assert(poke1.heldItem === 'Muscle Band', '❌ Should hold Muscle Band');
console.log('  ✅ PASS');

// Test 2: Equip different item - old one should return
console.log('\nTest 2: Swap items');
const returned2 = equipItem(poke1, ITEMS[1]); // Metal Coat (+5 defense)
console.log('  Returned item:', returned2?.name, '(should be Muscle Band)');
console.log('  Pokémon attack:', poke1.attack, '(should be 10, reverted)');
console.log('  Pokémon defense:', poke1.defense, '(should be 15, new)');
console.log('  Pokémon held:', poke1.heldItem, '(should be Metal Coat)');
console.assert(returned2?.name === 'Muscle Band', '❌ Should return Muscle Band');
console.assert(poke1.attack === 10, '❌ Attack should be 10');
console.assert(poke1.defense === 15, '❌ Defense should be 15');
console.assert(poke1.heldItem === 'Metal Coat', '❌ Should hold Metal Coat');
console.log('  ✅ PASS');

// Test 3: Swap again
console.log('\nTest 3: Swap to different item');
const returned3 = equipItem(poke1, ITEMS[2]); // Quick Claw (+5 speed)
console.log('  Returned item:', returned3?.name, '(should be Metal Coat)');
console.log('  Pokémon defense:', poke1.defense, '(should be 10, reverted)');
console.log('  Pokémon speed:', poke1.speed, '(should be 15, new)');
console.log('  Pokémon held:', poke1.heldItem, '(should be Quick Claw)');
console.assert(returned3?.name === 'Metal Coat', '❌ Should return Metal Coat');
console.assert(poke1.defense === 10, '❌ Defense should be 10');
console.assert(poke1.speed === 15, '❌ Speed should be 15');
console.assert(poke1.heldItem === 'Quick Claw', '❌ Should hold Quick Claw');
console.log('  ✅ PASS');

console.log('\n✅ All tests passed!');
