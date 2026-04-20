/**
 * Seed the database:
 *  1. Create a default super-admin from .env (skipped if exists)
 *  2. Import the 8 existing villas with their details
 *
 * Safe to run multiple times.
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { init, users, projects } = require('./db');

init();

/* ---------- 1. Super admin ---------- */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@karolinacorp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';

if (!users.findByEmail(ADMIN_EMAIL)) {
  users.create({
    email: ADMIN_EMAIL,
    password_hash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    name: ADMIN_NAME,
    role: 'super'
  });
  console.log(`✓ Super-admin created: ${ADMIN_EMAIL}`);
} else {
  console.log(`· Super-admin already exists: ${ADMIN_EMAIL} (skipping)`);
}

/* ---------- 2. Villa projects ---------- */
const VILLAS = [
  {
    slug: 'karjat-villas', name: 'Karjat Villas',
    tagline: 'A serene retreat on Mumbai\'s horizon.',
    location: 'Karjat, Maharashtra', region: 'Maharashtra',
    architect: 'TBD', status: 'Under Construction',
    bhk: '—', plot_sqft: '6 Acres', typology: 'Private Villas',
    description: 'A serene retreat on Mumbai\'s horizon. Set on a sprawling six-acre land just two hours from Mumbai, surrounded by hills and lakes — a true escape from city life.',
    cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
    featured: 1, display_order: 1
  },
  {
    slug: 'moonstone-villa', name: 'Moonstone Villa',
    tagline: 'Elevated coastal living in Badem.',
    location: 'Badem, Assagaon', region: 'North Goa',
    architect: 'Meetu Akali', status: 'Completed',
    bhk: '4 BHK', bedrooms: '4 En-suite',
    pool: 'Lap · Sea Alignment', orientation: 'West (Coastline)',
    typology: 'Sea-facing Bungalow',
    description: 'A refined sea-facing bungalow — a study in quiet luxury with restrained fenestration and a palette drawn from the coast. Every room opens to the view.',
    cover_image: 'assets/Badem/DSC09185-Enhanced-NR.jpg',
    hero_video: 'https://res.cloudinary.com/dhcxhztde/video/upload/q_auto/f_auto/v1776687200/hero_bjdg7c.mp4',
    featured: 1, display_order: 2
  },
  {
    slug: 'villa-guirim-a', name: 'Villa Guirim A',
    tagline: 'A timeless countryside escape.',
    location: 'Guirim', region: 'North Goa',
    architect: 'Abhishek Verma', status: 'Ready Q4 2025',
    bhk: '4 BHK', bedrooms: '4 En-suite', bathrooms: '5',
    pool: 'Private · 28 Ft.', plot_sqft: '5,200 Sq. Ft.',
    builtup_sqft: '3,800 Sq. Ft.', orientation: 'North-East',
    parking: '2 Covered + Visitor', ready_date: 'Q4 2025',
    typology: 'Countryside Villa',
    description: 'Open-plan living surrounded by rice fields and swaying palms. Architecture as an unhurried answer to the landscape — susegad philosophy made contemporary.',
    cover_image: 'assets/Guirim Villa A/33.jpg',
    hero_video: 'https://res.cloudinary.com/dhcxhztde/video/upload/q_auto/f_auto/v1776686448/Villa_3_v1_f9am5z.mp4',
    featured: 1, display_order: 3
  },
  {
    slug: 'villa-guirim-b', name: 'Villa Guirim B',
    tagline: 'A warmer take on the countryside.',
    location: 'Guirim', region: 'North Goa',
    architect: 'Abhishek Verma', status: 'Ready Q4 2025',
    bhk: '3 BHK', bedrooms: '3 En-suite', bathrooms: '4',
    pool: 'Private · 24 Ft.', plot_sqft: '4,600 Sq. Ft.',
    builtup_sqft: '3,200 Sq. Ft.', orientation: 'North-West',
    parking: '2 Covered + EV', ready_date: 'Q4 2025',
    typology: 'Courtyard Villa',
    description: 'Indo-Portuguese character with a central open-air courtyard as the social heart. For long lunches, slow afternoons, and unhurried dinners.',
    cover_image: 'assets/Guirim Vill B/3.jpg',
    hero_video: 'https://res.cloudinary.com/dhcxhztde/video/upload/q_auto/f_auto/v1776686753/Pink_villa_1_t9t9ba.mp4',
    featured: 0, display_order: 4
  },
  {
    slug: 'ivy-house', name: 'Ivy House',
    tagline: 'A serene hilltop retreat.',
    location: 'Marna Village', region: 'North Goa',
    architect: 'Meetu Akali', status: 'Completed',
    typology: 'Hilltop Retreat',
    description: 'A nature-inspired villa offering privacy, tranquility, and understated luxury — designed to disappear into its surroundings.',
    cover_image: 'assets/IVY House.png',
    featured: 0, display_order: 5
  },
  {
    slug: 'villament-guirim', name: 'Villament Guirim',
    tagline: 'Villa intimacy, apartment efficiency.',
    location: 'Guirim', region: 'North Goa',
    architect: 'Abhishek Verma', status: 'In Development',
    typology: 'Villament',
    description: 'A new typology blending villa intimacy with apartment efficiency. An elevated countryside sanctuary amidst serene rice fields.',
    cover_image: 'assets/Villament.png',
    featured: 0, display_order: 6
  },
  {
    slug: 'colva-villa', name: 'Colva Villa',
    tagline: 'A lush coastal canvas in South Goa.',
    location: 'Colva', region: 'South Goa',
    status: 'Completed',
    typology: 'Coastal Villa',
    description: 'A lush coastal canvas — generous landscapes and tranquil coastal rhythms. The quietest project in the portfolio, in every sense.',
    cover_image: 'assets/Colva South Goa.png',
    featured: 0, display_order: 7
  },
  {
    slug: 'casa-ziba', name: 'Casa Ziba',
    tagline: 'Mediterranean charm in North Goa.',
    location: 'Guirim', region: 'North Goa',
    status: 'Completed',
    typology: 'Courtyard Villa',
    description: 'Mediterranean charm — warm textures, sun-kissed courtyards, and effortless elegance. A villa that invites slow living under tall skies.',
    cover_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=85',
    featured: 0, display_order: 8
  }
];

let created = 0, skipped = 0;
for (const v of VILLAS) {
  if (projects.findBySlug(v.slug)) { skipped++; continue; }
  projects.create(v);
  created++;
}
console.log(`✓ Villas imported: ${created} new, ${skipped} already existed`);

/* ---------- Villa A gallery images (example seed of the project_images table) ---------- */
const villaA = projects.findBySlug('villa-guirim-a');
if (villaA && projects.images.forProject(villaA.id).length === 0) {
  const frames = [
    ['assets/Guirim Villa A/17.jpg', 'Exterior · Approach'],
    ['assets/Guirim Villa A/23.jpg', 'Living Pavilion · Double Height'],
    ['assets/Guirim Villa A/26.jpg', 'Kitchen & Dining'],
    ['assets/Guirim Villa A/29.jpg', 'Master Suite'],
    ['assets/Guirim Villa A/31.jpg', 'Bath · Natural Stone'],
    ['assets/Guirim Villa A/32.jpg', 'Courtyard · Morning Light'],
    ['assets/Guirim Villa A/33.jpg', 'Pool & Deck · Dusk']
  ];
  frames.forEach(([p, c], i) =>
    projects.images.add({ project_id: villaA.id, path: p, caption: c, display_order: i })
  );
  console.log('✓ Villa Guirim A gallery seeded');
}

console.log('\nSeeding complete. Start server with: npm start\n');
process.exit(0);
