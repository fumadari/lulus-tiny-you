// Expanded NYC Map Data - Manhattan & Brooklyn
// Map size: 60x80 tiles (much larger!)
// Tile types:
// 0 = grass/park, 1 = road, 2 = building, 3 = water, 4 = park path, 5 = bridge
// 6 = subway entrance, 7 = plaza, 8 = residential building, 9 = commercial building

const MAP_WIDTH = 60;
const MAP_HEIGHT = 80;

// Generate realistic NYC map procedurally
function generateNYCMap() {
    const map = [];
    
    // Initialize with water (East River and Hudson River)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Hudson River on the left (x < 8)
            // East River in the middle (x between 35-42)
            // Brooklyn on the right (x > 42)
            if (x < 8 || (x >= 35 && x < 42)) {
                map[y][x] = 3; // Water
            } else {
                map[y][x] = 2; // Default to building
            }
        }
    }
    
    // Create Manhattan grid (Avenues and Streets)
    // Manhattan area: x from 8 to 35
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 8; x < 35; x++) {
            // Avenues (vertical roads) - every 4 tiles
            if ((x - 8) % 4 === 0) {
                map[y][x] = 1; // Road
            }
            // Streets (horizontal roads) - every 3 tiles
            if (y % 3 === 0) {
                map[y][x] = 1; // Road
            }
            // Buildings between roads
            if (map[y][x] !== 1) {
                // Mix of residential and commercial buildings
                if (y < 20) {
                    // Upper Manhattan - more residential
                    map[y][x] = Math.random() > 0.3 ? 8 : 9;
                } else if (y < 40) {
                    // Midtown - mostly commercial
                    map[y][x] = Math.random() > 0.2 ? 9 : 8;
                } else {
                    // Downtown - mixed
                    map[y][x] = Math.random() > 0.5 ? 8 : 9;
                }
            }
        }
    }
    
    // Create Brooklyn grid (less dense)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 42; x < MAP_WIDTH; x++) {
            // Streets in Brooklyn - more organic layout
            if ((x - 42) % 5 === 0 || y % 4 === 0) {
                map[y][x] = 1; // Road
            } else {
                // More residential in Brooklyn
                map[y][x] = Math.random() > 0.2 ? 8 : (Math.random() > 0.5 ? 2 : 0);
            }
        }
    }
    
    // Add Central Park (Manhattan)
    for (let y = 10; y < 25; y++) {
        for (let x = 16; x < 28; x++) {
            if (x === 16 || x === 27 || y === 10 || y === 24) {
                map[y][x] = 4; // Park path
            } else {
                map[y][x] = 0; // Grass
            }
        }
    }
    
    // Add Upper East Side details (your area) - around x:24-30, y:12-20
    for (let y = 12; y < 20; y++) {
        for (let x = 24; x < 30; x++) {
            if ((x - 24) % 3 === 0 || (y - 12) % 3 === 0) {
                map[y][x] = 1; // Street
            } else {
                map[y][x] = 8; // Residential buildings
            }
        }
    }
    
    // Add Williamsburg (Lulu's area) - around x:43-52, y:35-45
    for (let y = 35; y < 45; y++) {
        for (let x = 43; x < 52; x++) {
            if ((x - 43) % 4 === 0 || (y - 35) % 4 === 0) {
                map[y][x] = 1; // Street
            } else if (Math.random() > 0.7) {
                map[y][x] = 0; // Some green space
            } else {
                map[y][x] = 8; // Hip residential buildings
            }
        }
    }
    
    // Add bridges
    // Brooklyn Bridge
    for (let x = 35; x < 42; x++) {
        map[50][x] = 5; // Bridge
        map[51][x] = 5;
    }
    
    // Manhattan Bridge
    for (let x = 35; x < 42; x++) {
        map[45][x] = 5;
        map[46][x] = 5;
    }
    
    // Williamsburg Bridge
    for (let x = 35; x < 42; x++) {
        map[40][x] = 5;
        map[41][x] = 5;
    }
    
    // Add Times Square area (plaza)
    for (let y = 30; y < 34; y++) {
        for (let x = 20; x < 24; x++) {
            map[y][x] = 7; // Plaza
        }
    }
    
    // Add subway entrances at major intersections
    const subwayLocations = [
        {x: 12, y: 15}, // Upper West Side
        {x: 26, y: 16}, // Upper East Side (your station)
        {x: 22, y: 32}, // Times Square
        {x: 18, y: 45}, // Penn Station area
        {x: 25, y: 55}, // Downtown
        {x: 45, y: 40}, // Williamsburg (Lulu's station)
        {x: 48, y: 50}, // Brooklyn Downtown
    ];
    
    subwayLocations.forEach(loc => {
        if (loc.x < MAP_WIDTH && loc.y < MAP_HEIGHT) {
            map[loc.y][loc.x] = 6; // Subway entrance
        }
    });
    
    return map;
}

// Generate the map
const NYC_MAP_LARGE = generateNYCMap();

// Points of Interest for the larger map
const MAP_POIS_LARGE = [
    // Manhattan POIs
    { name: "Central Park", x: 22, y: 17, emoji: "🌳", id: "central_park", description: "The heart of Manhattan" },
    { name: "Your Apartment", x: 26, y: 15, emoji: "🏠", id: "your_home", description: "Dario's Upper East Side apartment" },
    { name: "Times Square", x: 22, y: 32, emoji: "🎭", id: "times_square", description: "The crossroads of the world" },
    { name: "Empire State", x: 23, y: 35, emoji: "🏢", id: "empire_state", description: "Iconic skyscraper" },
    { name: "One World Trade", x: 20, y: 65, emoji: "🏙️", id: "one_wtc", description: "Downtown landmark" },
    { name: "Museum Mile", x: 25, y: 18, emoji: "🏛️", id: "museum_mile", description: "Met Museum area" },
    { name: "Columbus Circle", x: 19, y: 25, emoji: "⭕", id: "columbus_circle", description: "Major intersection" },
    { name: "Union Square", x: 21, y: 42, emoji: "🟩", id: "union_square", description: "Popular park and market" },
    { name: "Washington Sq", x: 19, y: 48, emoji: "⛲", id: "washington_sq", description: "NYU area" },
    { name: "Battery Park", x: 18, y: 72, emoji: "🗽", id: "battery_park", description: "Statue of Liberty views" },
    { name: "High Line", x: 16, y: 40, emoji: "🌿", id: "high_line", description: "Elevated park" },
    { name: "Grand Central", x: 24, y: 33, emoji: "🚉", id: "grand_central", description: "Historic train station" },
    
    // Brooklyn POIs
    { name: "Lulu's Place", x: 47, y: 40, emoji: "💕", id: "lulu_home", description: "Lulu's Williamsburg apartment" },
    { name: "Brooklyn Bridge", x: 38, y: 50, emoji: "🌉", id: "brooklyn_bridge", description: "Iconic bridge" },
    { name: "DUMBO", x: 43, y: 48, emoji: "🎨", id: "dumbo", description: "Trendy neighborhood" },
    { name: "Prospect Park", x: 50, y: 55, emoji: "🌲", id: "prospect_park", description: "Brooklyn's Central Park" },
    { name: "Coney Island", x: 45, y: 75, emoji: "🎢", id: "coney_island", description: "Beach and amusement park" },
    { name: "Williamsburg", x: 45, y: 38, emoji: "🎭", id: "williamsburg", description: "Hip neighborhood" },
    { name: "Brooklyn Museum", x: 48, y: 53, emoji: "🖼️", id: "brooklyn_museum", description: "Art and culture" },
    { name: "Smorgasburg", x: 46, y: 42, emoji: "🍔", id: "smorgasburg", description: "Food market" },
    
    // Special romantic spots
    { name: "Our First Date", x: 22, y: 47, emoji: "💝", id: "first_date", description: "Where we first met" },
    { name: "Favorite Cafe", x: 46, y: 39, emoji: "☕", id: "fav_cafe", description: "Our morning coffee spot" },
    { name: "Secret Spot", x: 24, y: 19, emoji: "✨", id: "secret_spot", description: "Our special place in Central Park" },
];

// Neighborhood names for different areas
const NEIGHBORHOODS = {
    // Manhattan
    "8,5": "Upper West Side",
    "26,5": "Upper East Side",
    "22,12": "Central Park",
    "20,30": "Midtown West",
    "25,30": "Midtown East",
    "22,32": "Times Square",
    "20,40": "Chelsea",
    "25,40": "Murray Hill",
    "19,48": "Greenwich Village",
    "24,48": "East Village",
    "20,55": "Tribeca",
    "24,55": "Lower East Side",
    "20,65": "Financial District",
    
    // Brooklyn
    "45,38": "Williamsburg",
    "43,48": "DUMBO",
    "48,50": "Downtown Brooklyn",
    "50,55": "Park Slope",
    "45,60": "Sunset Park",
    "50,65": "Bay Ridge",
    "45,75": "Coney Island",
};

// Subway lines connecting different areas
const SUBWAY_LINES = [
    {
        name: "4/5/6 Line",
        color: "#00933C",
        stops: [
            {x: 26, y: 16}, // Your UES stop
            {x: 24, y: 33}, // Grand Central
            {x: 21, y: 42}, // Union Square
        ]
    },
    {
        name: "L Line", 
        color: "#A7A9AC",
        stops: [
            {x: 21, y: 42}, // Union Square
            {x: 45, y: 40}, // Williamsburg (Lulu's stop)
        ]
    },
    {
        name: "N/Q/R/W",
        color: "#FCCC0A", 
        stops: [
            {x: 22, y: 32}, // Times Square
            {x: 21, y: 42}, // Union Square
            {x: 43, y: 48}, // Brooklyn
        ]
    }
];

// Export for use in game
window.NYC_MAP_LARGE = NYC_MAP_LARGE;
window.MAP_POIS_LARGE = MAP_POIS_LARGE;
window.NEIGHBORHOODS = NEIGHBORHOODS;
window.SUBWAY_LINES = SUBWAY_LINES;
window.MAP_WIDTH = MAP_WIDTH;
window.MAP_HEIGHT = MAP_HEIGHT;