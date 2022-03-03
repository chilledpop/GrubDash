const path = require("path");

const dishes = require(path.resolve("src/data/dishes-data"));

const nextId = require("../utils/nextId");


// validation middleware functions 

function isValidDish(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (!name || name === "") {
    return next({
      status: 400,
      message: "Dish must include a name",
    });
  } else if (!description || description === "") {
    return next({
      status: 400,
      message: "Dish must include a description",
    });
  } else if (!price) {
    return next({
      status:400,
      message: "Dish must include a price",
    });
  } else if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  } else if (!image_url || image_url === "") {
    return next({
      status: 400,
      message: "Dish must include a image_url",
    });
  }

  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }

  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  })
} 

function idMatch(req, res, next) {
  const { dishId } = req.params;
  const id = req.body.data.id;

  if (!id || id === dishId) {
    res.locals.dishId = dishId;
    return next();
  }

  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  })
}


// route handlers

// GET endpoint
function list(req, res) {
  res.json({ data: dishes });
}

// POST endpoint
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// route handler for /dishes/dishId path
function read(req, res) {
  res.json({ data: res.locals.dish})
}


// PUT endpoint
function update(req, res) {
  let dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  
  dish = {
    id: dish.id,
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  }

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [isValidDish, create],
  read: [dishExists, read],
  update: [dishExists, isValidDish, idMatch, update],
}