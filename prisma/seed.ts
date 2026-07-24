import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { newId } from "../lib/ids";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const existing = await db.restaurant.count();
  if (existing > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  await db.$transaction(async (tx) => {
    const rid = "rest_demo1";
    await tx.restaurant.create({
      data: { id: rid, name: "Bella Vista Trattoria", slug: "bella-vista", address: "12 Market Street, Berlin", currency: "EUR", taxRate: 0.1, openingHours: "12:00-23:00" },
    });

    const rid2 = "rest_demo2";
    await tx.restaurant.create({
      data: { id: rid2, name: "Burger House", slug: "burger-house", address: "5 High Street, Hamburg", currency: "EUR", taxRate: 0.1, openingHours: "11:00-22:00" },
    });

    async function mkUser(email: string, pw: string, name: string, role: any, restaurantId: string | null) {
      const uid = newId("user");
      await tx.user.create({ data: { id: uid, email, passwordHash: bcrypt.hashSync(pw, 10), name, role, restaurantId } });
      return uid;
    }

    await mkUser("super@rhub.dev", "password", "Sam Superadmin", "SUPER_ADMIN", null);
    const ownerId = await mkUser("owner@rhub.dev", "password", "Olivia Owner", "OWNER", rid);
    const managerId = await mkUser("manager@rhub.dev", "password", "Marco Manager", "MANAGER", rid);
    const chefId = await mkUser("chef@rhub.dev", "password", "Chen Chef", "CHEF", rid);
    const waiterId = await mkUser("waiter@rhub.dev", "password", "Wendy Waiter", "WAITER", rid);
    const cashierId = await mkUser("cashier@rhub.dev", "password", "Carl Cashier", "CASHIER", rid);
    const custUserId = await mkUser("john@customer.dev", "password", "John Customer", "CUSTOMER", null);
    void managerId;
    void ownerId;

    async function mkEmployee(userId: string, position: string, rate: number) {
      const eid = newId("emp");
      await tx.employee.create({ data: { id: eid, userId, restaurantId: rid, position, hourlyRate: rate } });
      return eid;
    }
    const chefEmp = await mkEmployee(chefId, "Chef", 22);
    const waiterEmp = await mkEmployee(waiterId, "Waiter", 15);
    const cashierEmp = await mkEmployee(cashierId, "Cashier", 14);
    const managerEmp = await mkEmployee(managerId, "Manager", 26);

    // schedules (mon-fri)
    for (const [empId, day, s, e] of [
      [chefEmp, 1, "09:00", "17:00"], [waiterEmp, 1, "17:00", "23:00"],
      [chefEmp, 2, "09:00", "17:00"], [waiterEmp, 2, "17:00", "23:00"],
      [cashierEmp, 3, "12:00", "20:00"], [managerEmp, 5, "10:00", "18:00"],
    ] as [string, number, string, string][]) {
      await tx.schedule.create({ data: { id: newId("sch"), employeeId: empId, restaurantId: rid, dayOfWeek: day, startTime: s, endTime: e } });
    }

    // customer
    const custId = newId("cust");
    await tx.customer.create({
      data: { id: custId, userId: custUserId, restaurantId: rid, name: "John Customer", phone: "+49 151 2345678", email: "john@customer.dev", favoriteFood: "Margherita Pizza", allergy: "Peanuts", birthday: "07-20", loyaltyPoints: 120, visits: 12 },
    });

    // extra walk-in customers
    const walkins: [string, string, number, number][] = [
      ["Anna Berg", "+49 151 111", 40, 4],
      ["Liam Fischer", "+49 151 222", 15, 2],
      ["Mia Wolf", "+49 151 333", 200, 18],
    ];
    for (const [name, phone, pts, visits] of walkins) {
      await tx.customer.create({ data: { id: newId("cust"), restaurantId: rid, name, phone, loyaltyPoints: pts, visits } });
    }

    // categories + menu items
    const categories: [string, number][] = [["Pizza", 1], ["Pasta", 2], ["Salads", 3], ["Drinks", 4], ["Desserts", 5]];
    const catIds: Record<string, string> = {};
    for (const [name, sort] of categories) {
      const cid = newId("cat");
      catIds[name] = cid;
      await tx.menuCategory.create({ data: { id: cid, restaurantId: rid, name, sortOrder: sort } });
    }

    type SeedItem = {
      cat: string; name: string; desc: string; price: number; prep: number;
      tags: string; spice: number; cal: number; protein: number; popularity: number;
      rating: number; chefPick?: boolean; trending?: boolean;
    };
    const items: SeedItem[] = [
      { cat: "Pizza", name: "Margherita Pizza", desc: "Tomato, mozzarella, basil", price: 12, prep: 10,
        tags: "vegetarian", spice: 0, cal: 780, protein: 28, popularity: 92, rating: 4.7, chefPick: true },
      { cat: "Pizza", name: "Pepperoni Pizza", desc: "Tomato, mozzarella, pepperoni", price: 14, prep: 12,
        tags: "", spice: 1, cal: 950, protein: 35, popularity: 88, rating: 4.6, trending: true },
      { cat: "Pizza", name: "Quattro Formaggi", desc: "Four cheese blend", price: 15, prep: 12,
        tags: "vegetarian", spice: 0, cal: 1050, protein: 40, popularity: 70, rating: 4.4 },
      { cat: "Pasta", name: "Spaghetti Carbonara", desc: "Egg, pancetta, pecorino", price: 13, prep: 14,
        tags: "", spice: 0, cal: 820, protein: 30, popularity: 95, rating: 4.8, chefPick: true, trending: true },
      { cat: "Pasta", name: "Pasta Alfredo", desc: "Creamy parmesan sauce", price: 12, prep: 12,
        tags: "vegetarian", spice: 0, cal: 780, protein: 22, popularity: 65, rating: 4.3 },
      { cat: "Pasta", name: "Lasagna Bolognese", desc: "Beef ragu, bechamel", price: 14, prep: 18,
        tags: "", spice: 1, cal: 900, protein: 38, popularity: 80, rating: 4.5 },
      { cat: "Salads", name: "Caesar Salad", desc: "Romaine, parmesan, croutons", price: 9, prep: 8,
        tags: "vegetarian", spice: 0, cal: 380, protein: 15, popularity: 60, rating: 4.2 },
      { cat: "Salads", name: "Greek Salad", desc: "Feta, olives, cucumber", price: 9, prep: 6,
        tags: "vegetarian,gluten-free", spice: 0, cal: 320, protein: 9, popularity: 58, rating: 4.3 },
      { cat: "Drinks", name: "Coca-Cola", desc: "330ml can", price: 3, prep: 1,
        tags: "vegan,gluten-free", spice: 0, cal: 140, protein: 0, popularity: 50, rating: 4.0 },
      { cat: "Drinks", name: "Sparkling Water", desc: "500ml", price: 2.5, prep: 1,
        tags: "vegan,gluten-free", spice: 0, cal: 0, protein: 0, popularity: 40, rating: 4.1 },
      { cat: "Drinks", name: "Italian Espresso", desc: "Single shot", price: 2.5, prep: 3,
        tags: "vegan,gluten-free", spice: 0, cal: 5, protein: 0, popularity: 55, rating: 4.6 },
      { cat: "Desserts", name: "Tiramisu", desc: "Classic Italian dessert", price: 6.5, prep: 5,
        tags: "vegetarian", spice: 0, cal: 450, protein: 6, popularity: 90, rating: 4.8, chefPick: true },
      { cat: "Desserts", name: "Panna Cotta", desc: "Vanilla bean, berry coulis", price: 6, prep: 5,
        tags: "vegetarian,gluten-free", spice: 0, cal: 380, protein: 5, popularity: 75, rating: 4.5 },
    ];
    const menuItemIds: Record<string, string> = {};
    for (const it of items) {
      const mid = newId("item");
      menuItemIds[it.name] = mid;
      const slug = it.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const imageUrl = `https://picsum.photos/seed/${slug}/600/400`;
      await tx.menuItem.create({
        data: {
          id: mid, restaurantId: rid, categoryId: catIds[it.cat], name: it.name, description: it.desc,
          price: it.price, imageUrl, available: true, prepMinutes: it.prep, dietaryTags: it.tags,
          spiceLevel: it.spice, calories: it.cal, proteinG: it.protein, popularity: it.popularity,
          rating: it.rating, isChefPick: it.chefPick || false, isTrending: it.trending || false,
        },
      });
    }

    // burger house items (2nd tenant)
    const bhCatId = newId("cat");
    await tx.menuCategory.create({ data: { id: bhCatId, restaurantId: rid2, name: "Burgers", sortOrder: 1 } });
    await tx.menuItem.create({
      data: { id: newId("item"), restaurantId: rid2, categoryId: bhCatId, name: "Cheeseburger", description: "Beef patty, cheddar, pickles", price: 9, imageUrl: "https://picsum.photos/seed/cheeseburger/600/400", available: true, prepMinutes: 8 },
    });

    // inventory
    const inv: [string, string, number, number, number][] = [
      ["Tomatoes", "kg", 15, 5, 2.1],
      ["Mozzarella", "kg", 8, 4, 6.5],
      ["Flour", "kg", 25, 8, 0.9],
      ["Chicken", "kg", 25, 10, 4.2],
      ["Beef Mince", "kg", 12, 5, 7.8],
      ["Lettuce", "kg", 4, 3, 1.5],
      ["Bread", "kg", 6, 4, 1.2],
      ["Eggs", "unit", 60, 24, 0.25],
      ["Parmesan", "kg", 5, 2, 9.5],
      ["Basil", "kg", 1.2, 1, 12],
    ];
    const invIds: Record<string, string> = {};
    for (const [name, unit, qty, low, cost] of inv) {
      const iid = newId("inv");
      invIds[name] = iid;
      await tx.inventoryItem.create({ data: { id: iid, restaurantId: rid, name, unit, quantity: qty, lowStockAt: low, costPerUnit: cost } });
    }

    // recipe items (cost calc) for a few dishes
    const recipeMap: [string, [string, number][]][] = [
      ["Margherita Pizza", [["Flour", 0.25], ["Tomatoes", 0.15], ["Mozzarella", 0.2], ["Basil", 0.02]]],
      ["Spaghetti Carbonara", [["Flour", 0.2], ["Eggs", 2], ["Parmesan", 0.05]]],
      ["Caesar Salad", [["Lettuce", 0.2], ["Parmesan", 0.03], ["Bread", 0.05]]],
    ];
    for (const [item, lines] of recipeMap) {
      for (const [ingredient, qty] of lines) {
        await tx.recipeItem.create({ data: { id: newId("rec"), menuItemId: menuItemIds[item], inventoryItemId: invIds[ingredient], restaurantId: rid, quantity: qty } });
      }
    }

    // suppliers
    const supId = newId("sup");
    await tx.supplier.create({ data: { id: supId, restaurantId: rid, name: "FreshFarm Produce", phone: "+49 30 1234567", email: "sales@freshfarm.example" } });

    // tables
    const tableIds: string[] = [];
    const layout: [number, number, number, number][] = [
      [1, 2, 40, 60], [2, 4, 160, 60], [3, 4, 280, 60],
      [4, 6, 40, 200], [5, 2, 160, 200], [6, 4, 280, 200],
      [7, 4, 40, 340], [8, 8, 200, 340],
    ];
    for (const [num, seats, x, y] of layout) {
      const tid = newId("table");
      tableIds.push(tid);
      const status = num === 2 ? "OCCUPIED" : num === 5 ? "RESERVED" : "FREE";
      await tx.restaurantTable.create({ data: { id: tid, restaurantId: rid, number: num, seats, status: status as any, posX: x, posY: y } });
    }

    // reservations
    const today = new Date();
    function atHour(h: number, m = 0) {
      const d = new Date(today);
      d.setHours(h, m, 0, 0);
      return d;
    }
    await tx.reservation.create({ data: { id: newId("res"), restaurantId: rid, guestName: "Peter Klein", guestPhone: "+49 151 9988", partySize: 2, time: atHour(18), status: "BOOKED", tableId: tableIds[4] } });
    await tx.reservation.create({ data: { id: newId("res"), restaurantId: rid, guestName: "Sara Nowak", guestPhone: "+49 151 7766", partySize: 4, time: atHour(19), status: "BOOKED" } });
    await tx.reservation.create({ data: { id: newId("res"), restaurantId: rid, guestName: "Tom Weber", guestPhone: "+49 151 5544", partySize: 5, time: atHour(20), status: "BOOKED" } });

    // sample orders across today for dashboard/report data
    const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "SERVED", "PREPARING", "PENDING"];
    const allItemIds = Object.entries(menuItemIds);
    for (let i = 0; i < 14; i++) {
      const oid = newId("order");
      const hoursAgo = Math.floor(Math.random() * 10);
      const created = new Date(today.getTime() - hoursAgo * 3600 * 1000);
      const status = statuses[i % statuses.length];
      let subtotal = 0;
      const chosen: { name: string; mid: string; qty: number; price: number }[] = [];
      const n = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < n; j++) {
        const [name, mid] = allItemIds[Math.floor(Math.random() * allItemIds.length)];
        const menuItem = await tx.menuItem.findUniqueOrThrow({ where: { id: mid } });
        const qty = 1 + Math.floor(Math.random() * 2);
        subtotal += menuItem.price * qty;
        chosen.push({ name, mid, qty, price: menuItem.price });
      }
      const tax = subtotal * 0.1;
      const total = subtotal + tax;
      await tx.order.create({
        data: {
          id: oid, restaurantId: rid, tableId: tableIds[i % tableIds.length], type: "DINE_IN",
          status: status as any, paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
          subtotal, taxTotal: tax, total, createdAt: created, updatedAt: created, employeeId: waiterEmp,
        },
      });
      for (const c of chosen) {
        await tx.orderItem.create({ data: { id: newId("oi"), orderId: oid, menuItemId: c.mid, quantity: c.qty, price: c.price, status: status as any } });
      }
    }

    // waste log entries (inventory_logs with negative reason 'waste')
    await tx.inventoryLog.create({ data: { id: newId("ilog"), inventoryItemId: invIds["Lettuce"], restaurantId: rid, change: -1.2, reason: "waste" } });
    await tx.inventoryLog.create({ data: { id: newId("ilog"), inventoryItemId: invIds["Tomatoes"], restaurantId: rid, change: -2.5, reason: "waste" } });
    await tx.inventoryLog.create({ data: { id: newId("ilog"), inventoryItemId: invIds["Bread"], restaurantId: rid, change: -0.8, reason: "waste" } });

    // reviews
    await tx.review.create({ data: { id: newId("rev"), restaurantId: rid, customerId: custId, foodRating: 5, serviceRating: 4, waitRating: 4, cleanRating: 5, comment: "Great pizza, friendly staff!" } });
    await tx.review.create({ data: { id: newId("rev"), restaurantId: rid, customerId: custId, foodRating: 4, serviceRating: 5, waitRating: 3, cleanRating: 4, comment: "Loved the tiramisu, wait was a bit long." } });

    // notifications
    await tx.notification.create({ data: { id: newId("notif"), restaurantId: rid, type: "LOW_STOCK", message: "Lettuce is running low (4kg left)" } });
    await tx.notification.create({ data: { id: newId("notif"), restaurantId: rid, type: "RESERVATION", message: "New reservation from Sara Nowak for 7:00 PM" } });
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
