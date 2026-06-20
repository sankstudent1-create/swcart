export const CATEGORIES = [
  {name:"Electronics", img:"https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80"},
  {name:"Fashion", img:"https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=200&q=80"},
  {name:"Home", img:"https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=200&q=80", label:"Home & Kitchen"},
  {name:"Grocery", img:"https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80"},
  {name:"Beauty", img:"https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=200&q=80"},
  {name:"Sports", img:"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=200&q=80"},
  {name:"Toys", img:"https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=200&q=80", label:"Toys & Games"},
  {name:"Books", img:"https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=200&q=80"},
  {name:"Tools", img:"https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=200&q=80"},
];

const SVG_COLORS = ["E8472A","FF8A3D","2E2E2E","9a8f86","FFD166","06D6A0","118AB2","EF476F","8338EC","FB5607"];

export function placeholderImg(seed: string, label?: string){
  if(seed.startsWith("p")){
    const num = parseInt(seed.substring(1));
    if(num <= 15) return `/images/p${num}.png`;
    const unsplash = [
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
      "https://images.unsplash.com/photo-1623992797616-43b6791bdf07?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1522771730849-f5218d6e326c?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80"
    ];
    if(num >= 16 && num <= 25) return unsplash[num];
  }
  let hash = 0; 
  for(let i=0; i<seed.length; i++){ hash = (hash * 31 + seed.charCodeAt(i)) >>> 0; }
  const bg = SVG_COLORS[hash % SVG_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="100%" height="100%" fill="#${bg}"/><text x="50%" y="50%" font-family="Arial" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">${label||""}</text></svg>`;
  return "data:image/svg+xml;base64," + btoa(svg);
}

export const PRODUCTS = [
  {id:"p1", name:"Over-ear Wireless Headphones", cat:"Electronics", price:1999, old:2499, tag:"-20%"},
  {id:"p2", name:"Fitness Smartwatch, AMOLED", cat:"Electronics", price:2799},
  {id:"p3", name:"Portable Bluetooth Speaker", cat:"Electronics", price:1299, tag:"Bestseller"},
  {id:"p4", name:"20,000mAh Fast-Charge Power Bank", cat:"Electronics", price:1599},
  {id:"p5", name:"1080p HD Webcam with Mic", cat:"Electronics", price:1099, tag:"New"},
  {id:"p6", name:"Mechanical RGB Keyboard", cat:"Electronics", price:2299},
  {id:"p7", name:"Everyday Running Sneakers", cat:"Fashion", price:1399, old:1999, tag:"-30%"},
  {id:"p8", name:"Lightweight Bomber Jacket", cat:"Fashion", price:2199},
  {id:"p9", name:"Structured Tote Handbag", cat:"Fashion", price:1799},
  {id:"p10", name:"Polarised Aviator Sunglasses", cat:"Fashion", price:899, tag:"New"},
  {id:"p11", name:"Minimalist Analog Watch", cat:"Fashion", price:1649},
  {id:"p12", name:"Water-resistant Travel Backpack", cat:"Fashion", price:1529, old:1799, tag:"-15%"},
  {id:"p13", name:"Non-stick Cookware Set, 5pc", cat:"Home", price:2899},
  {id:"p14", name:"Airtight Storage Jars, Set of 6", cat:"Home", price:899, old:1199, tag:"-25%"},
  {id:"p15", name:"All-purpose Cleaning Kit", cat:"Grocery", price:699},
  {id:"p16", name:"Daily Essentials Pantry Combo", cat:"Grocery", price:1049},
  {id:"p17", name:"Cotton Bedsheet Set, King", cat:"Home", price:1349, tag:"New"},
  {id:"p18", name:"Wooden Base Table Lamp", cat:"Home", price:999},
  {id:"p19", name:"Hydrating Face Serum, 30ml", cat:"Beauty", price:649, tag:"New"},
  {id:"p20", name:"Matte Lipstick Set, 3pc", cat:"Beauty", price:799},
  {id:"p21", name:"Yoga Mat, Non-slip 6mm", cat:"Sports", price:899},
  {id:"p22", name:"Adjustable Dumbbell Set", cat:"Sports", price:3299, old:3999, tag:"-18%"},
  {id:"p23", name:"Building Blocks Set, 500pc", cat:"Toys", price:1199},
  {id:"p24", name:"Bestselling Fiction Bundle, 3 Books", cat:"Books", price:899},
  {id:"p25", name:"Cordless Drill Machine", cat:"Tools", price:2499, tag:"Bestseller"},
];
