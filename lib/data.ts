import { db } from "./db";
import { newId as id } from "./ids";

// ---------- Restaurants ----------
export function listRestaurants() {
  return db.restaurant.findMany({ orderBy: { name: "asc" } });
}
export function getRestaurant(restaurantId: string) {
  return db.restaurant.findUnique({ where: { id: restaurantId } });
}

// ---------- Dashboard ----------
export async function dashboardStats(restaurantId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const todayDow = new Date().getDay();

  const [revenueAgg, ordersToday, activeTables, reservationsToday, inventoryItems, scheduleRows] = await Promise.all([
    db.order.aggregate({ where: { restaurantId, createdAt: { gte: todayStart }, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    db.order.count({ where: { restaurantId, createdAt: { gte: todayStart } } }),
    db.restaurantTable.count({ where: { restaurantId, status: "OCCUPIED" } }),
    db.reservation.count({ where: { restaurantId, time: { gte: todayStart, lt: tomorrowStart } } }),
    db.inventoryItem.findMany({ where: { restaurantId }, select: { quantity: true, lowStockAt: true } }),
    db.schedule.findMany({ where: { restaurantId, dayOfWeek: todayDow }, select: { employeeId: true }, distinct: ["employeeId"] }),
  ]);

  return {
    revenue: revenueAgg._sum.total || 0,
    ordersToday,
    activeTables,
    reservationsToday,
    lowStock: inventoryItems.filter((i) => i.quantity <= i.lowStockAt).length,
    staffOnDuty: scheduleRows.length,
  };
}

export function salesLast7Days(restaurantId: string) {
  return db.$queryRaw<{ day: string; total: number }[]>`
    SELECT date("createdAt") as day, COALESCE(SUM(total),0)::float as total
    FROM orders WHERE "restaurantId"=${restaurantId} AND status != 'CANCELLED' AND "createdAt" >= NOW() - INTERVAL '7 days'
    GROUP BY day ORDER BY day
  `;
}

export function salesByHourToday(restaurantId: string) {
  return db.$queryRaw<{ hour: string; c: number }[]>`
    SELECT to_char("createdAt", 'HH24:00') as hour, COUNT(*)::int as c
    FROM orders WHERE "restaurantId"=${restaurantId} AND date("createdAt")=date(NOW())
    GROUP BY hour ORDER BY hour
  `;
}

export async function popularDishes(restaurantId: string, limit = 6) {
  const items = await db.orderItem.findMany({
    where: { order: { restaurantId } },
    select: { quantity: true, price: true, menuItem: { select: { name: true } } },
  });
  const byName = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const it of items) {
    const cur = byName.get(it.menuItem.name) || { name: it.menuItem.name, qty: 0, revenue: 0 };
    cur.qty += it.quantity;
    cur.revenue += it.quantity * it.price;
    byName.set(it.menuItem.name, cur);
  }
  return Array.from(byName.values()).sort((a, b) => b.qty - a.qty).slice(0, limit);
}

// ---------- Menu ----------
export function listCategories(restaurantId: string) {
  return db.menuCategory.findMany({ where: { restaurantId }, orderBy: { sortOrder: "asc" } });
}
export async function listMenuItems(restaurantId: string) {
  const items = await db.menuItem.findMany({
    where: { restaurantId },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  return items.map((mi) => ({ ...mi, categoryName: mi.category.name }));
}
export function createMenuItem(data: {
  restaurantId: string; categoryId: string; name: string; description?: string;
  price: number; prepMinutes?: number;
}) {
  return db.menuItem.create({
    data: {
      id: id("item"), restaurantId: data.restaurantId, categoryId: data.categoryId, name: data.name,
      description: data.description || "", price: data.price, prepMinutes: data.prepMinutes || 10,
    },
  }).then((r) => r.id);
}
export async function updateMenuItem(itemId: string, restaurantId: string, data: Partial<{ name: string; description: string; price: number; available: boolean; categoryId: string; prepMinutes: number }>) {
  if (!Object.keys(data).length) return false;
  const result = await db.menuItem.updateMany({ where: { id: itemId, restaurantId }, data });
  return result.count > 0;
}
export async function deleteMenuItem(itemId: string, restaurantId: string) {
  const item = await db.menuItem.findFirst({ where: { id: itemId, restaurantId }, select: { id: true } });
  if (!item) return false;
  await db.recipeItem.deleteMany({ where: { menuItemId: itemId } });
  await db.menuItem.delete({ where: { id: itemId } });
  return true;
}
export function createCategory(restaurantId: string, name: string) {
  return db.menuCategory.create({ data: { id: id("cat"), restaurantId, name, sortOrder: 99 } }).then((r) => r.id);
}

// ---------- Orders ----------
export async function listOrders(restaurantId: string, opts: { status?: string; limit?: number } = {}) {
  const orders = await db.order.findMany({
    where: { restaurantId, ...(opts.status ? { status: opts.status as any } : {}) },
    include: { table: true, items: { include: { menuItem: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    ...(opts.limit ? { take: opts.limit } : {}),
  });
  return orders.map((o) => ({
    ...o, tableNumber: o.table?.number ?? null,
    items: o.items.map((it) => ({ ...it, name: it.menuItem.name })),
  }));
}

export async function getOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { table: true, items: { include: { menuItem: { select: { name: true } } } } },
  });
  if (!order) return null;
  return { ...order, tableNumber: order.table?.number ?? null, items: order.items.map((it) => ({ ...it, name: it.menuItem.name })) };
}

export async function createOrder(data: {
  restaurantId: string; tableId?: string | null; customerId?: string | null; employeeId?: string | null;
  type: string; notes?: string; items: { menuItemId: string; quantity: number; price: number }[];
  discountPercent?: number;
}) {
  const restaurant = await getRestaurant(data.restaurantId);
  const taxRate = restaurant?.taxRate ?? 0.1;
  const subtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountTotal = subtotal * ((data.discountPercent || 0) / 100);
  const taxTotal = (subtotal - discountTotal) * taxRate;
  const total = subtotal - discountTotal + taxTotal;
  const oid = id("order");

  await db.$transaction(async (tx) => {
    await tx.order.create({
      data: {
        id: oid, restaurantId: data.restaurantId, tableId: data.tableId || null, customerId: data.customerId || null,
        employeeId: data.employeeId || null, type: data.type as any, notes: data.notes || "",
        subtotal, discountTotal, taxTotal, total,
      },
    });
    for (const item of data.items) {
      await tx.orderItem.create({ data: { id: id("oi"), orderId: oid, menuItemId: item.menuItemId, quantity: item.quantity, price: item.price } });
      const recipe = await tx.recipeItem.findMany({ where: { menuItemId: item.menuItemId }, select: { inventoryItemId: true, quantity: true } });
      for (const r of recipe) {
        await tx.inventoryItem.update({ where: { id: r.inventoryItemId }, data: { quantity: { decrement: r.quantity * item.quantity } } });
        await tx.inventoryLog.create({
          data: { id: id("ilog"), inventoryItemId: r.inventoryItemId, restaurantId: data.restaurantId, change: -(r.quantity * item.quantity), reason: "order" },
        });
      }
    }
    if (data.tableId) {
      await tx.restaurantTable.update({ where: { id: data.tableId }, data: { status: "OCCUPIED" } });
    }
  });
  return oid;
}

export async function updateOrderStatus(orderId: string, restaurantId: string, status: string) {
  const result = await db.order.updateMany({ where: { id: orderId, restaurantId }, data: { status: status as any, updatedAt: new Date() } });
  if (result.count === 0) return false;
  await db.orderItem.updateMany({ where: { orderId }, data: { status: status as any } });
  if (status === "COMPLETED") {
    const order = await db.order.findUnique({ where: { id: orderId }, select: { tableId: true } });
    if (order?.tableId) await db.restaurantTable.update({ where: { id: order.tableId }, data: { status: "CLEANING" } });
  }
  return true;
}

export async function payOrder(orderId: string, restaurantId: string, method: string, tip: number) {
  const order = await db.order.findFirst({ where: { id: orderId, restaurantId } });
  if (!order) return false;
  const total = order.total + (tip || 0);
  await db.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", paymentMethod: method as any, tip: tip || 0, total } });
  await db.payment.create({ data: { id: id("pay"), orderId, restaurantId, amount: total, method: method as any } });
  if (order.customerId) {
    await db.customer.update({ where: { id: order.customerId }, data: { loyaltyPoints: { increment: Math.floor(total) }, visits: { increment: 1 } } });
  }
  // paying settles the table — free it (or hand it to the next reservation)
  if (order.tableId) await releaseTable(order.tableId);
  return true;
}

export async function updateOrder(orderId: string, restaurantId: string, data: { tableId?: string | null; notes?: string; items?: { id: string; quantity: number }[] }) {
  const order = await db.order.findFirst({ where: { id: orderId, restaurantId } });
  if (!order) return false;

  if (data.items) {
    for (const it of data.items) {
      if (it.quantity <= 0) await db.orderItem.deleteMany({ where: { id: it.id, orderId } });
      else await db.orderItem.updateMany({ where: { id: it.id, orderId }, data: { quantity: it.quantity } });
    }
  }

  if (data.notes !== undefined) await db.order.update({ where: { id: orderId }, data: { notes: data.notes } });

  if (data.tableId !== undefined && data.tableId !== order.tableId) {
    await db.order.update({ where: { id: orderId }, data: { tableId: data.tableId } });
    if (order.tableId) await releaseTable(order.tableId);
    if (data.tableId) await db.restaurantTable.update({ where: { id: data.tableId }, data: { status: "OCCUPIED" } });
  }

  const restaurant = await getRestaurant(order.restaurantId);
  const taxRate = restaurant?.taxRate ?? 0.1;
  const lines = await db.orderItem.findMany({ where: { orderId }, select: { price: true, quantity: true } });
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const discountPercent = order.subtotal ? (order.discountTotal / order.subtotal) * 100 : 0;
  const discountTotal = subtotal * (discountPercent / 100);
  const taxTotal = (subtotal - discountTotal) * taxRate;
  const total = subtotal - discountTotal + taxTotal;
  await db.order.update({ where: { id: orderId }, data: { subtotal, discountTotal, taxTotal, total } });
  return true;
}

// ---------- Kitchen ----------
export async function kitchenOrders(restaurantId: string) {
  const orders = await db.order.findMany({
    where: { restaurantId, status: { in: ["PENDING", "PREPARING", "READY"] } },
    include: { table: true, items: { include: { menuItem: { select: { name: true, prepMinutes: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return orders.map((o) => ({
    ...o, tableNumber: o.table?.number ?? null,
    items: o.items.map((it) => ({ ...it, name: it.menuItem.name, prepMinutes: it.menuItem.prepMinutes })),
  }));
}

// ---------- Tables ----------
export function listTables(restaurantId: string) {
  return db.restaurantTable.findMany({ where: { restaurantId }, orderBy: { number: "asc" } });
}
export async function updateTableStatus(tableId: string, restaurantId: string, status: string) {
  const result = await db.restaurantTable.updateMany({ where: { id: tableId, restaurantId }, data: { status: status as any } });
  return result.count > 0;
}
export async function updateTable(tableId: string, restaurantId: string, data: Partial<{ number: number; seats: number; posX: number; posY: number }>) {
  const fields = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (!Object.keys(fields).length) return false;
  const result = await db.restaurantTable.updateMany({ where: { id: tableId, restaurantId }, data: fields });
  return result.count > 0;
}
export function createTable(restaurantId: string, number: number, seats: number, posX: number, posY: number) {
  return db.restaurantTable.create({ data: { id: id("table"), restaurantId, number, seats, posX, posY } }).then((r) => r.id);
}
export async function deleteTable(tableId: string, restaurantId: string) {
  const table = await db.restaurantTable.findFirst({ where: { id: tableId, restaurantId }, select: { id: true } });
  if (!table) return false;
  await db.order.updateMany({ where: { tableId }, data: { tableId: null } });
  await db.reservation.updateMany({ where: { tableId }, data: { tableId: null } });
  await db.restaurantTable.delete({ where: { id: tableId } });
  return true;
}

// releases a table back to its correct resting state: RESERVED if another
// booking is queued for it, FREE otherwise — but never overrides an active order.
async function releaseTable(tableId: string) {
  const activeOrder = await db.order.count({ where: { tableId, status: { not: "CANCELLED" }, paymentStatus: { not: "PAID" } } });
  if (activeOrder) return;
  const activeRes = await db.reservation.count({ where: { tableId, status: "BOOKED" } });
  await db.restaurantTable.update({ where: { id: tableId }, data: { status: activeRes ? "RESERVED" : "FREE" } });
}

// ---------- Reservations ----------
export async function listReservations(restaurantId: string) {
  const rows = await db.reservation.findMany({
    where: { restaurantId },
    include: { table: true },
    orderBy: { time: "asc" },
  });
  return rows.map((r) => ({ ...r, tableNumber: r.table?.number ?? null }));
}
export async function createReservation(data: { restaurantId: string; guestName: string; guestPhone?: string; partySize: number; time: string; tableId?: string | null }) {
  const rid = id("res");
  await db.reservation.create({
    data: { id: rid, restaurantId: data.restaurantId, guestName: data.guestName, guestPhone: data.guestPhone || "", partySize: data.partySize, time: new Date(data.time), tableId: data.tableId || null },
  });
  if (data.tableId) await db.restaurantTable.update({ where: { id: data.tableId }, data: { status: "RESERVED" } });
  await db.notification.create({
    data: { id: id("notif"), restaurantId: data.restaurantId, type: "RESERVATION", message: `New reservation from ${data.guestName} for ${new Date(data.time).toLocaleString()}` },
  });
  return rid;
}
export async function updateReservationStatus(resId: string, restaurantId: string, status: string) {
  const res = await db.reservation.findFirst({ where: { id: resId, restaurantId }, select: { tableId: true } });
  if (!res) return false;
  await db.reservation.update({ where: { id: resId }, data: { status: status as any } });
  if (!res.tableId) return true;
  if (status === "SEATED") await db.restaurantTable.update({ where: { id: res.tableId }, data: { status: "OCCUPIED" } });
  else if (status === "CANCELLED" || status === "NO_SHOW" || status === "COMPLETED") await releaseTable(res.tableId);
  return true;
}

// ---------- Inventory ----------
export function listInventory(restaurantId: string) {
  return db.inventoryItem.findMany({ where: { restaurantId }, orderBy: { name: "asc" } });
}
export async function lowStockItems(restaurantId: string) {
  const items = await db.inventoryItem.findMany({ where: { restaurantId }, orderBy: { quantity: "asc" } });
  return items.filter((i) => i.quantity <= i.lowStockAt);
}
export async function adjustInventory(itemId: string, restaurantId: string, change: number, reason: string) {
  const result = await db.inventoryItem.updateMany({ where: { id: itemId, restaurantId }, data: { quantity: { increment: change } } });
  if (result.count === 0) return false;
  await db.inventoryLog.create({ data: { id: id("ilog"), inventoryItemId: itemId, restaurantId, change, reason } });
  return true;
}
export function createInventoryItem(data: { restaurantId: string; name: string; unit: string; quantity: number; lowStockAt: number; costPerUnit: number }) {
  return db.inventoryItem.create({
    data: { id: id("inv"), restaurantId: data.restaurantId, name: data.name, unit: data.unit, quantity: data.quantity, lowStockAt: data.lowStockAt, costPerUnit: data.costPerUnit },
  }).then((r) => r.id);
}
export async function updateInventoryItem(itemId: string, restaurantId: string, data: Partial<{ name: string; unit: string; quantity: number; lowStockAt: number; costPerUnit: number }>) {
  const fields = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (!Object.keys(fields).length) return false;
  const result = await db.inventoryItem.updateMany({ where: { id: itemId, restaurantId }, data: fields });
  return result.count > 0;
}

export async function wasteSummary(restaurantId: string) {
  const grouped = await db.inventoryLog.groupBy({
    by: ["inventoryItemId"], where: { restaurantId, reason: "waste" }, _sum: { change: true },
  });
  const items = await db.inventoryItem.findMany({ where: { id: { in: grouped.map((g) => g.inventoryItemId) } } });
  const byId = new Map(items.map((i) => [i.id, i]));
  const rows = grouped
    .map((g) => {
      const item = byId.get(g.inventoryItemId);
      if (!item) return null;
      return { name: item.name, unit: item.unit, costPerUnit: item.costPerUnit, wasted: -(g._sum.change || 0) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.wasted - a.wasted);
  const totalCost = rows.reduce((s, r) => s + r.wasted * r.costPerUnit, 0);
  return { rows, totalCost };
}

// Smart inventory prediction: heuristic based on last 7 days consumption via orders
export async function inventoryForecast(restaurantId: string) {
  const items = await listInventory(restaurantId);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  return Promise.all(items.map(async (item) => {
    const consumed = await db.inventoryLog.aggregate({
      where: { inventoryItemId: item.id, reason: "order", createdAt: { gte: sevenDaysAgo } },
      _sum: { change: true },
    });
    const avgDaily = -(consumed._sum.change || 0) / 7;
    const recommended = Math.max(0, avgDaily * 3 - item.quantity);
    return { ...item, expectedUsageTomorrow: Math.round(avgDaily * 10) / 10, recommendedPurchase: Math.round(recommended * 10) / 10 };
  }));
}

// ---------- Recipe cost ----------
export async function recipeCost(menuItemId: string) {
  const lines = await db.recipeItem.findMany({
    where: { menuItemId },
    include: { inventoryItem: { select: { name: true, unit: true, costPerUnit: true } } },
  });
  const flat = lines.map((l) => ({ name: l.inventoryItem.name, quantity: l.quantity, costPerUnit: l.inventoryItem.costPerUnit, unit: l.inventoryItem.unit }));
  const cost = flat.reduce((s, l) => s + l.quantity * l.costPerUnit, 0);
  return { lines: flat, cost };
}
export async function setRecipe(menuItemId: string, restaurantId: string, lines: { inventoryItemId: string; quantity: number }[]) {
  await db.recipeItem.deleteMany({ where: { menuItemId } });
  for (const l of lines) {
    await db.recipeItem.create({ data: { id: id("rec"), menuItemId, inventoryItemId: l.inventoryItemId, restaurantId, quantity: l.quantity } });
  }
}

// ---------- Employees / scheduling ----------
export async function listEmployees(restaurantId: string) {
  const rows = await db.employee.findMany({
    where: { restaurantId }, include: { user: { select: { name: true, email: true } } },
  });
  return rows
    .map((e) => ({ ...e, name: e.user.name, email: e.user.email }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
export async function listSchedules(restaurantId: string) {
  const rows = await db.schedule.findMany({
    where: { restaurantId },
    include: { employee: { include: { user: { select: { name: true } } } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return rows.map((s) => ({ ...s, employeeName: s.employee.user.name }));
}
export function createSchedule(data: { employeeId: string; restaurantId: string; dayOfWeek: number; startTime: string; endTime: string }) {
  return db.schedule.create({
    data: { id: id("sch"), employeeId: data.employeeId, restaurantId: data.restaurantId, dayOfWeek: data.dayOfWeek, startTime: data.startTime, endTime: data.endTime },
  }).then((r) => r.id);
}
export async function staffPerformance(restaurantId: string) {
  const employees = await db.employee.findMany({ where: { restaurantId }, include: { user: { select: { name: true } } } });
  const grouped = await db.order.groupBy({
    by: ["employeeId"], where: { restaurantId, status: "COMPLETED", employeeId: { not: null } }, _count: { id: true }, _sum: { total: true },
  });
  const byEmployee = new Map(grouped.map((g) => [g.employeeId, g]));
  return employees
    .map((e) => {
      const g = byEmployee.get(e.id);
      return { name: e.user.name, position: e.position, ordersServed: g?._count.id || 0, revenue: g?._sum.total || 0 };
    })
    .sort((a, b) => b.ordersServed - a.ordersServed);
}

// Shift simulator: estimate wait time based on staff count vs order volume heuristic
export async function simulateShift(restaurantId: string, waiterCount: number) {
  const tenHoursAgo = new Date(Date.now() - 10 * 3600 * 1000);
  const orderCount = await db.order.count({ where: { restaurantId, createdAt: { gte: tenHoursAgo } } });
  const baseline = orderCount / 10 || 4;
  const perWaiterCapacity = 3; // orders/hour a waiter can comfortably handle
  const capacity = waiterCount * perWaiterCapacity;
  const utilization = capacity > 0 ? baseline / capacity : 2;
  const waitMinutes = Math.max(3, Math.round(utilization * 12));
  return { waiterCount, expectedOrdersPerHour: Math.round(baseline * 10) / 10, expectedWaitMinutes: waitMinutes };
}

// ---------- Customers ----------
export function listCustomers(restaurantId: string) {
  return db.customer.findMany({ where: { restaurantId }, orderBy: { visits: "desc" } });
}
export function createCustomer(data: { restaurantId: string; name: string; phone?: string; email?: string }) {
  return db.customer.create({
    data: { id: id("cust"), restaurantId: data.restaurantId, name: data.name, phone: data.phone || "", email: data.email || "" },
  }).then((r) => r.id);
}

// ---------- Reviews ----------
export async function listReviews(restaurantId: string) {
  const rows = await db.review.findMany({
    where: { restaurantId },
    include: { customer: { select: { name: true } }, menuItem: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({ ...r, customerName: r.customer?.name ?? null, menuItemName: r.menuItem?.name ?? null }));
}
export function createReview(data: { restaurantId: string; customerId?: string | null; menuItemId?: string | null; foodRating: number; serviceRating: number; waitRating: number; cleanRating: number; comment?: string }) {
  return db.review.create({
    data: {
      id: id("rev"), restaurantId: data.restaurantId, customerId: data.customerId || null, menuItemId: data.menuItemId || null,
      foodRating: data.foodRating, serviceRating: data.serviceRating, waitRating: data.waitRating, cleanRating: data.cleanRating, comment: data.comment || "",
    },
  });
}

// ---------- Notifications ----------
export function listNotifications(restaurantId: string) {
  return db.notification.findMany({ where: { restaurantId }, orderBy: { createdAt: "desc" }, take: 20 });
}

// ---------- Reports ----------
export function revenueReport(restaurantId: string, days = 30) {
  return db.$queryRaw<{ day: string; revenue: number; orders: number }[]>`
    SELECT date("createdAt") as day, COALESCE(SUM(total),0)::float as revenue, COUNT(*)::int as orders
    FROM orders WHERE "restaurantId"=${restaurantId} AND status != 'CANCELLED' AND "createdAt" >= NOW() - (${days}::text || ' days')::interval
    GROUP BY day ORDER BY day
  `;
}

// AI sales forecast (heuristic): average of same weekday over past weeks + trend
export async function salesForecast(restaurantId: string) {
  const history = await db.$queryRaw<{ day: string; revenue: number; orders: number }[]>`
    SELECT date("createdAt") as day, COALESCE(SUM(total),0)::float as revenue, COUNT(*)::int as orders
    FROM orders WHERE "restaurantId"=${restaurantId} AND status != 'CANCELLED' AND "createdAt" >= NOW() - INTERVAL '14 days'
    GROUP BY day ORDER BY day
  `;
  const avgRevenue = history.length ? history.reduce((s, h) => s + h.revenue, 0) / history.length : 0;
  const avgOrders = history.length ? history.reduce((s, h) => s + h.orders, 0) / history.length : 0;
  const growthFactor = 1.05; // simple optimistic trend assumption
  const hourly = await salesByHourToday(restaurantId);
  const busiest = [...hourly].sort((a, b) => b.c - a.c).slice(0, 2).map((h) => h.hour);
  return {
    expectedOrders: Math.round(avgOrders * growthFactor),
    expectedRevenue: Math.round(avgRevenue * growthFactor * 100) / 100,
    busyHours: busiest.length ? busiest : ["12:00", "19:00"],
    history,
  };
}

// Menu insights: sales volume vs margin
export async function menuInsights(restaurantId: string) {
  const items = await listMenuItems(restaurantId);
  return Promise.all(items.map(async (item) => {
    const sold = await db.orderItem.aggregate({
      where: { menuItemId: item.id, order: { restaurantId } }, _sum: { quantity: true },
    });
    const { cost } = await recipeCost(item.id);
    const margin = item.price - cost;
    const qty = sold._sum.quantity || 0;
    let suggestion = "Keep as is";
    if (qty > 5 && margin < item.price * 0.4) suggestion = `High sales, thin margin — consider +${money10(item.price)} price increase`;
    if (qty <= 1) suggestion = "Rarely ordered — feature it on the QR menu or consider retiring it";
    return { ...item, sold: qty, cost, margin, suggestion };
  }));
}
function money10(price: number) {
  return (Math.round(price * 0.05 * 2) / 2).toFixed(2);
}

export async function defaultRestaurantId() {
  const r = await db.restaurant.findFirst({ orderBy: { name: "asc" }, select: { id: true } });
  return r?.id || "";
}

export async function slowSellingDishes(restaurantId: string, limit = 6) {
  const items = await db.menuItem.findMany({ where: { restaurantId }, select: { id: true, name: true } });
  const grouped = await db.orderItem.groupBy({ by: ["menuItemId"], where: { order: { restaurantId } }, _sum: { quantity: true } });
  const byId = new Map(grouped.map((g) => [g.menuItemId, g._sum.quantity || 0]));
  return items
    .map((mi) => ({ name: mi.name, qty: byId.get(mi.id) || 0 }))
    .sort((a, b) => a.qty - b.qty)
    .slice(0, limit);
}

export async function returningCustomers(restaurantId: string) {
  const [total, returning] = await Promise.all([
    db.customer.count({ where: { restaurantId } }),
    db.customer.count({ where: { restaurantId, visits: { gt: 1 } } }),
  ]);
  return { total, returning };
}

export function monthlySales(restaurantId: string) {
  return db.$queryRaw<{ month: string; total: number }[]>`
    SELECT to_char("createdAt", 'YYYY-MM') as month, COALESCE(SUM(total),0)::float as total
    FROM orders WHERE "restaurantId"=${restaurantId} AND status != 'CANCELLED' GROUP BY month ORDER BY month
  `;
}

export function getRestaurantBySlug(slug: string) {
  return db.restaurant.findUnique({ where: { slug } });
}

export function callWaiter(restaurantId: string, tableLabel: string) {
  return db.notification.create({
    data: { id: id("notif"), restaurantId, type: "CALL_WAITER", message: `${tableLabel} is calling for a waiter` },
  });
}

export async function customerOrderHistory(customerId: string) {
  const orders = await db.order.findMany({
    where: { customerId }, orderBy: { createdAt: "desc" },
    include: { items: { include: { menuItem: { select: { name: true } } } } },
  });
  return orders.map((o) => ({ ...o, items: o.items.map((it) => ({ ...it, name: it.menuItem.name })) }));
}

export function getCustomerByUserId(userId: string) {
  return db.customer.findUnique({ where: { userId } });
}
