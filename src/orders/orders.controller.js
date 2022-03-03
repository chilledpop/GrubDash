const path = require("path");

const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");

// validation middleware functions

function isValidOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } } = req.body;

  if (!deliverTo || deliverTo === "") {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  } else if (!mobileNumber || mobileNumber === "") {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  } else if (!dishes) {
    return next({
        status: 400,
        message: "Order must include a dish",
    });
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
        status: 400,
        message: "Order must include at least one dish",
    });
  } else {
    for (let index = 0; index < dishes.length; index++) {
      if (!dishes[index].quantity || 
        dishes[index].quantity <= 0 || 
        !Number.isInteger(dishes[index].quantity)
      ) {
        return next({
          status: 400,
          message: `Dish ${index} must have a quantity that is an integer greater than 0`,
        })
      }
    }
  }

  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }

  next({
    status: 404,
    message: `Order id does not exist: ${orderId}`,
  });
}

function checkOrderStatus(req, res, next) {
  const { data: { id, status } } = req.body;
  const { orderId } = req.params;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
    });
  } else if (!status || 
    status === "" || 
    (status !== "pending" && 
    status !== "prepariing" && 
    status !== "out-for-delivery")
  ) {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed"
    });
  }

  next();
}

function checkPendingStatus(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }

  next();
}

// route handlers

// GET endpoint
function list(req, res) {
  res.status(200).json({ data: orders });
}

// POST endpoint
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } } = req.body;
  
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status ? status : "pending",
    dishes: dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// route handler for /orders/:orderId path
function read(req, res) {
  res.status(200).json({ data: res.locals.order });
}

// PUT endpoint
function update(req, res) {
  let order = res.locals.order;
  const { data: { deliverTo, mobileNumber, dishes, status } } = req.body;

  order = {
    id: order.id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    status: status,
  };

  res.json({ data: order });
}


// DELETE endpoint
function destroy(req, res) {
  const index = orders.indexOf(res.locals.order);

  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [isValidOrder, create],
  read: [orderExists, read],
  update: [orderExists, isValidOrder, checkOrderStatus, update],
  delete: [orderExists, checkPendingStatus, destroy],
}