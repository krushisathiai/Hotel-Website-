/**
 * Shared Data Store with Indian Restaurant Data
 * Ensures actual dynamic data works seamlessly both with live backend API
 * and persistent local state when offline.
 */

const STORAGE_KEY_PREFIX = 'dineflow_';

// Initial Indian Menu Items
export const initialIndianMenuItems = [
  { id: 1, name: 'Paneer Butter Masala', category: 'Mains', price: 340, isVeg: true, prepTime: 20, isAvailable: true, description: 'Fresh cottage cheese cubes simmered in rich creamy tomato and butter gravy with aromatic spices.' },
  { id: 2, name: 'Butter Chicken (Murgh Makhani)', category: 'Mains', price: 420, isVeg: false, prepTime: 25, isAvailable: true, description: 'Tender chicken pieces cooked in clay tandoor and tossed in silky velvet tomato cashew sauce.' },
  { id: 3, name: 'Dal Makhani Slow-Cooked', category: 'Mains', price: 280, isVeg: true, prepTime: 18, isAvailable: true, description: 'Whole black lentils & kidney beans slow-simmered overnight with butter and cream.' },
  { id: 4, name: 'Hyderabadi Dum Biryani', category: 'Mains', price: 390, isVeg: false, prepTime: 25, isAvailable: true, description: 'Fragrant long-grain aged basmati rice cooked on dum with marinated chicken and saffron.' },
  { id: 5, name: 'Tandoori Paneer Tikka', category: 'Starters', price: 290, isVeg: true, prepTime: 15, isAvailable: true, description: 'Succulent cubes of cottage cheese marinated with hung curd, ajwain, and Kashmiri chillies.' },
  { id: 6, name: 'Amritsari Fish Tikka', category: 'Starters', price: 450, isVeg: false, prepTime: 18, isAvailable: true, description: 'Crispy fried river sole seasoned with carom seeds, ginger garlic, and fresh mint chutney.' },
  { id: 7, name: 'Dahi Ke Kebab', category: 'Starters', price: 260, isVeg: true, prepTime: 12, isAvailable: true, description: 'Delicate melt-in-the-mouth kebabs made with hung yogurt, bell peppers, and fresh coriander.' },
  { id: 8, name: 'Garlic Butter Naan', category: 'Breads', price: 65, isVeg: true, prepTime: 6, isAvailable: true, description: 'Fluffy tandoor-baked leavened bread brushed with melted butter and toasted garlic.' },
  { id: 9, name: 'Tandoori Roti (Butter)', category: 'Breads', price: 35, isVeg: true, prepTime: 5, isAvailable: true, description: 'Whole wheat round bread baked in clay oven topped with desi ghee.' },
  { id: 10, name: 'Warm Gulab Jamun (2 pcs)', category: 'Desserts', price: 140, isVeg: true, prepTime: 5, isAvailable: true, description: 'Soft golden milk dumplings soaked in cardamom and saffron sugar syrup, served warm.' },
  { id: 11, name: 'Kesar Rasmalai', category: 'Desserts', price: 170, isVeg: true, prepTime: 4, isAvailable: true, description: 'Spongy cottage cheese patties immersed in rich chilled saffron-infused evaporated milk.' },
  { id: 12, name: 'Special Masala Chaas', category: 'Beverages', price: 90, isVeg: true, prepTime: 3, isAvailable: true, description: 'Refreshing churned buttermilk spiced with roasted cumin, green chillies, and rock salt.' },
  { id: 13, name: 'Kullad Masala Chai', category: 'Beverages', price: 60, isVeg: true, prepTime: 5, isAvailable: true, description: 'Traditional Indian cutting tea boiled with cardamom, ginger, and lemongrass.' },
  { id: 14, name: 'Alphonso Mango Lassi', category: 'Beverages', price: 150, isVeg: true, prepTime: 4, isAvailable: true, description: 'Thick creamy yogurt drink blended with Ratnagiri Alphonso mango pulp and pistachios.' },
];

export const initialIndianCategories = [
  { id: 1, name: 'Starters', itemCount: 3, description: 'Tandoori kebabs, crispy bites, and street delicacies', status: 'active', displayOrder: 1 },
  { id: 2, name: 'Mains', itemCount: 4, description: 'Rich curries, handi preparations, and dum biryanis', status: 'active', displayOrder: 2 },
  { id: 3, name: 'Breads', itemCount: 2, description: 'Clay tandoor rotis, garlic naans, and laccha parathas', status: 'active', displayOrder: 3 },
  { id: 4, name: 'Desserts', itemCount: 2, description: 'Authentic Indian mithai, kulfis, and sweet treats', status: 'active', displayOrder: 4 },
  { id: 5, name: 'Beverages', itemCount: 3, description: 'Mango lassi, kullad chai, fresh lime, and coolers', status: 'active', displayOrder: 5 },
];

export const initialIndianTables = [
  { id: 1, number: 'Table 1', table_number: 'Table 1', capacity: 2, section: 'Main Hall', status: 'available', currentOrder: null, waiter: 'Anil', timeOccupied: null },
  { id: 2, number: 'Table 2', table_number: 'Table 2', capacity: 4, section: 'Main Hall', status: 'available', currentOrder: null, waiter: 'Mohan', timeOccupied: null },
  { id: 3, number: 'Table 3', table_number: 'Table 3', capacity: 4, section: 'Family Section', status: 'available', currentOrder: null, waiter: 'Anil', timeOccupied: null },
  { id: 4, number: 'Table 4', table_number: 'Table 4', capacity: 6, section: 'VIP Lounge', status: 'available', currentOrder: null, waiter: 'Sita', timeOccupied: null },
  { id: 5, number: 'Table 5', table_number: 'Table 5', capacity: 2, section: 'Patio Garden', status: 'available', currentOrder: null, waiter: 'Mohan', timeOccupied: null },
  { id: 6, number: 'Table 6', table_number: 'Table 6', capacity: 4, section: 'Patio Garden', status: 'available', currentOrder: null, waiter: 'Anil', timeOccupied: null },
  { id: 7, number: 'Table 7', table_number: 'Table 7', capacity: 8, section: 'Family Section', status: 'available', currentOrder: null, waiter: 'Mohan', timeOccupied: null },
  { id: 8, number: 'Table 8', table_number: 'Table 8', capacity: 4, section: 'Main Hall', status: 'available', currentOrder: null, waiter: 'Sita', timeOccupied: null },
  { id: 9, number: 'Table 9', table_number: 'Table 9', capacity: 2, section: 'Rooftop Terrace', status: 'available', currentOrder: null, waiter: 'Anil', timeOccupied: null },
  { id: 10, number: 'Table 10', table_number: 'Table 10', capacity: 6, section: 'Rooftop Terrace', status: 'available', currentOrder: null, waiter: 'Sita', timeOccupied: null },
];

export const initialIndianOrders = [];

export const initialIndianInvoices = [];

export const initialIndianStaff = [
  { id: 1, name: 'Sanjay Deshmukh', role: 'admin', email: 'sanjay@dineflow.com', phone: '+91 98201 12345', shift: 'Full Day', status: 'active', joined: 'Jan 2024' },
  { id: 2, name: 'Sita Devi', role: 'manager', email: 'sita.d@dineflow.com', phone: '+91 98202 23456', shift: 'Morning (8AM - 4PM)', status: 'active', joined: 'Mar 2024' },
  { id: 3, name: 'Chef Ramesh Kumar', role: 'chef', email: 'ramesh.k@dineflow.com', phone: '+91 98203 34567', shift: 'Evening (3PM - 11PM)', status: 'active', joined: 'Feb 2024' },
  { id: 4, name: 'Anil Sharma', role: 'waiter', email: 'anil.s@dineflow.com', phone: '+91 98204 45678', shift: 'Evening (4PM - 12AM)', status: 'active', joined: 'Jun 2024' },
  { id: 5, name: 'Priya Gupta', role: 'cashier', email: 'priya.g@dineflow.com', phone: '+91 98205 56789', shift: 'Morning (9AM - 5PM)', status: 'active', joined: 'Jul 2024' },
  { id: 6, name: 'Mohan Das', role: 'waiter', email: 'mohan.d@dineflow.com', phone: '+91 98206 67890', shift: 'Evening (4PM - 12AM)', status: 'active', joined: 'Aug 2024' },
];

export const initialSettings = {
  name: 'The Golden Plate Bistro & Lounge',
  tagline: 'Authentic Indian Flavors & Contemporary Dining',
  phone: '+91 (80) 2553-9000',
  email: 'contact@goldenplatebistro.com',
  address: 'Plot 42, 80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
  gstin: '29AABCT3518Q1Z2',
  currency: '₹ (INR)',
  openingTime: '11:00 AM',
  closingTime: '11:30 PM',
  taxRate: 5.0,
  serviceCharge: 5.0,
  receiptHeader: 'THE GOLDEN PLATE BISTRO',
  receiptFooter: 'Thank you for dining with us! Follow us on Instagram @goldenplate',
  soundAlerts: true,
  emailDailyReport: true,
};

// Safe LocalStorage helpers
export const getStored = (key, fallback) => {
  try {
    const val = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

export const setStored = (key, data) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch {
    // quota exceeded or SSR
    
  }
};